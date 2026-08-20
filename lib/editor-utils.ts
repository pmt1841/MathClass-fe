import { marked } from 'marked'
// @ts-ignore
import TurndownService from 'turndown'
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm'

// Setup Turndown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})
turndownService.use(gfm)

// Add rule to keep [IMAGE_XYZ] intact when saving from editor
turndownService.addRule('imageCode', {
  filter: 'img',
  replacement: function (content: any, node: any) {
    const alt = node.getAttribute('alt') || ''
    if (alt.startsWith('[IMAGE_') && alt.endsWith(']')) {
      return alt
    }
    const src = node.getAttribute('src') || ''
    const title = node.getAttribute('title') || ''
    return src ? `![${alt}](${src}${title ? ` "${title}"` : ''})` : ''
  }
})

// Add rule to convert Tiptap math nodes back to Markdown $ ... $ or $$ ... $$
turndownService.addRule('tiptapMath', {
  filter: function (node: any) {
    return (
      (node.nodeName === 'SPAN' && (node.getAttribute?.('data-type') === 'math-inline' || node.classList?.contains('math-node-inline'))) ||
      (node.nodeName === 'DIV' && (node.getAttribute?.('data-type') === 'math-block' || node.getAttribute?.('data-type') === 'math-inline'))
    )
  },
  replacement: function (content: any, node: any) {
    const latex = node.getAttribute?.('data-latex') || content || ''
    const isDisplay = node.getAttribute?.('data-display') === 'true' || node.getAttribute?.('data-type') === 'math-block'
    const cleanLatex = latex.trim()
    if (!cleanLatex) {
      return ''
    }
    if (isDisplay) {
      return `\n\n$$\n${cleanLatex}\n$$\n\n`
    }
    return `$${cleanLatex}$`
  }
})

interface MathItem {
  raw: string
  latex: string
  isDisplay: boolean
}

export const separateAdjacentMath = (text: string): string => {
  if (!text) return ''
  let res = text
  let prev = ''
  while (prev !== res) {
    prev = res
    res = res.replace(/\$([^\$\r\n]+?)\$\$([^\$\r\n]+?)\$/g, '$$$1$ $$$2$')
  }
  return res
}

// Keep raw LaTeX formatting intact and transform into Tiptap Math Node tags during conversion
const extractMath = (text: string) => {
  const mathBlocks: MathItem[] = []
  if (!text) return { processed: '', mathBlocks }

  // Separate adjacent inline math tokens $A$$B$ into $A$ $B$ so they are not treated as block math $$
  const sanitized = separateAdjacentMath(text)

  let index = 0
  // 1. Match display math: $$ ... $$
  let processed = sanitized.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner) => {
    const placeholder = `MATHLIVEDISPLAY${index}ENDTOKEN`
    mathBlocks.push({
      raw: match,
      latex: inner.trim(),
      isDisplay: true
    })
    index++
    return placeholder
  })

  // 2. Match inline math: $ ... $ (strictly single-line to avoid swallowing multiple lines/formulas)
  processed = processed.replace(/\$([^\$\r\n]+?)\$/g, (match, inner) => {
    const placeholder = `MATHLIVEINLINE${index}ENDTOKEN`
    mathBlocks.push({
      raw: match,
      latex: inner.trim(),
      isDisplay: false
    })
    index++
    return placeholder
  })

  return { processed, mathBlocks }
}

const restoreMathAsHtml = (text: string, mathBlocks: MathItem[]) => {
  if (!text) return ''
  let restored = text
  mathBlocks.forEach((block, index) => {
    const escapedLatex = block.latex
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const htmlTag = `<span data-type="math-inline" data-latex="${escapedLatex}" ${block.isDisplay ? 'data-display="true"' : ''}></span>`
    restored = restored.replaceAll(`MATHLIVEDISPLAY${index}ENDTOKEN`, htmlTag)
    restored = restored.replaceAll(`MATHLIVEINLINE${index}ENDTOKEN`, htmlTag)
  })
  return restored
}

const restoreMathAsMarkdown = (text: string, mathBlocks: MathItem[]) => {
  if (!text) return ''
  let restored = text
  mathBlocks.forEach((block, index) => {
    restored = restored.replaceAll(`MATHLIVEDISPLAY${index}ENDTOKEN`, block.raw)
    restored = restored.replaceAll(`MATHLIVEINLINE${index}ENDTOKEN`, block.raw)
  })
  return restored
}

// Keep resource codes [SHAPE_X|options] and [IMAGE_X|options] intact during conversion
const extractResources = (text: string, images?: { imageCode: string, imageUrl: string }[]) => {
  const resourceBlocks: string[] = []
  if (!text) return { processed: '', resourceBlocks }

  let index = 0
  const processed = text.replace(/\[(SHAPE_[a-zA-Z0-9_]+|IMAGE_[a-zA-Z0-9_]+)(?:\|[^\]]*)?\]/g, (match, prefix) => {
    if (prefix.startsWith('IMAGE_') && images) {
      const cleanMatch = match.split('|')[0].replace('[', '').replace(']', '')
      const imgInfo = images.find(img => img.imageCode === match || img.imageCode === `[${cleanMatch}]` || match.includes(img.imageCode))
      if (imgInfo) {
        return `<img src="${imgInfo.imageUrl}" alt="${match}" class="max-w-full rounded-lg" />`
      }
    }

    const placeholder = `MATHLIVERESOURCE${index}ENDTOKEN`
    resourceBlocks.push(match)
    index++
    return placeholder
  })

  return { processed, resourceBlocks }
}

const restoreResources = (text: string, resourceBlocks: string[]) => {
  if (!text) return ''
  let restored = text
  resourceBlocks.forEach((block, index) => {
    restored = restored.replaceAll(`MATHLIVERESOURCE${index}ENDTOKEN`, block)
  })
  return restored
}

export const markdownToHtml = (markdown: string, images?: { imageCode: string, imageUrl: string }[]): string => {
  if (!markdown) return ''
  try {
    const { processed: withMath, mathBlocks } = extractMath(markdown)
    const { processed: withResources, resourceBlocks } = extractResources(withMath, images)

    const rawHtml = marked.parse(withResources) as string

    const restoredResources = restoreResources(rawHtml, resourceBlocks)
    return restoreMathAsHtml(restoredResources, mathBlocks)
  } catch (e) {
    console.error('Failed to parse markdown to html', e)
    return markdown
  }
}

export const htmlToMarkdown = (html: string): string => {
  if (!html) return ''
  try {
    const { processed: withMath, mathBlocks } = extractMath(html)
    const { processed: withResources, resourceBlocks } = extractResources(withMath)

    const preservedSpacesHtml = withResources.split(/(<[^>]*>)/).map(part => {
      if (part.startsWith('<')) return part
      return part.replace(/  /g, ' \u00A0')
    }).join('')

    const rawMd = turndownService.turndown(preservedSpacesHtml)
    const restoredResources = restoreResources(rawMd, resourceBlocks)

    // Fallback: unescape any remaining [SHAPE_X] / [IMAGE_X] if they were escaped outside the extractor
    let unescaped = restoredResources.replace(/\\\[(SHAPE|IMAGE)\\_([\s\S]+?)\\\]/g, (match, prefix, id) => {
      const cleanId = id.replaceAll('\\_', '_').replaceAll('\\|', '|')
      return `[${prefix}_${cleanId}]`
    })

    const restored = restoreMathAsMarkdown(unescaped, mathBlocks)
    return separateAdjacentMath(restored)
  } catch (e) {
    console.error('Failed to parse html to markdown', e)
    return html
  }
}

/**
 * Chuyển đổi mã LaTeX thô hoặc đầu ra OCR (ví dụ \begin{aligned}, \text{...}) 
 * thành Markdown chuẩn: văn bản tiếng Việt là text thường, chỉ có công thức toán mới được bọc $...$
 */
export const normalizeLatexToMarkdown = (input: string): string => {
  if (!input) return ''
  let text = input.trim()

  // 1. Xóa markdown code fence nếu có
  if (text.includes('```')) {
    text = text.replace(/^```(?:markdown|latex)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }

  // 2. Nếu đã có $...$ hoặc $$...$$ và không có \begin{aligned} / \text{...}, giữ nguyên
  const hasAligned = text.includes('\\begin{aligned}') || text.includes('\\begin{align*}') || text.includes('\\begin{align}')
  const hasTextTag = text.includes('\\text{')

  if (!hasAligned && !hasTextTag) {
    // Nếu có chứa dấu $ thì giữ nguyên
    if (text.includes('$')) return text

    // Nếu là công thức toán thuần túy (chứa lệnh \ hoặc ký hiệu toán học đặc trưng) và không có chữ tiếng Việt có dấu
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)
    if (!hasVietnamese) {
      return `$${text}$`
    }
    return text
  }

  // 3. Xử lý trường hợp có \begin{aligned} hoặc \text{...}
  // Bỏ thẻ bao aligned
  let cleanBody = text
    .replace(/\\begin\{aligned\}/g, '')
    .replace(/\\end\{aligned\}/g, '')
    .replace(/\\begin\{align\*\}/g, '')
    .replace(/\\end\{align\*\}/g, '')
    .replace(/\\begin\{align\}/g, '')
    .replace(/\\end\{align\}/g, '')
    .trim()

  // Tách thành từng dòng qua \\ hoặc \n
  const rawLines = cleanBody.split(/\\\\|\r?\n/)

  const processedLines = rawLines.map(rawLine => {
    let line = rawLine.trim()
    // Xóa ký tự căn lề & ở đầu hoặc giữa
    line = line.replace(/^&\s*/, '').replace(/\s*&\s*/g, ' ')
    // Xóa các khoảng trắng latex
    line = line.replace(/\\quad/g, ' ').replace(/\\qquad/g, ' ').replace(/\\,/g, ' ').replace(/\\;/g, ' ')

    if (!line) return ''

    // Nếu dòng có chứa \text{...}
    if (line.includes('\\text{')) {
      // Chuẩn hóa trường hợp ngoặc đơn bọc ngoài \text{...}, ví dụ: (\text{hằng đẳng thức}) -> \text{(hằng đẳng thức)}
      const normalizedLine = line.replace(/\(\s*\\text\{([^}]*)\}\s*\)/g, '\\text{($1)}')
      const parts = normalizedLine.split(/\\text\{([^}]*)\}/g)
      // parts xen kẽ: [math, text, math, text, math...]
      let result = ''
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (i % 2 === 1) {
          // Đây là text bên trong \text{...}
          result += ` ${part} `
        } else {
          // Đây là phần công thức toán
          let trimmedMath = part.trim()
          if (trimmedMath) {
            // Xử lý nếu dính dấu ngoặc đơn mở/đóng ở biên do phân tách: "math (" hoặc ") math"
            let prefixParen = ''
            let suffixParen = ''
            if (trimmedMath.endsWith('(')) {
              trimmedMath = trimmedMath.slice(0, -1).trim()
              suffixParen = '('
            }
            if (trimmedMath.startsWith(')')) {
              trimmedMath = trimmedMath.slice(1).trim()
              prefixParen = ')'
            }

            if (prefixParen) result += ` ${prefixParen} `
            if (trimmedMath) {
              // Nếu có ngoặc đơn bao quanh cả biểu thức toán, ví dụ "(\Rightarrow AE // NJ)"
              if (trimmedMath.startsWith('(') && trimmedMath.endsWith(')')) {
                const inner = trimmedMath.substring(1, trimmedMath.length - 1).trim()
                result += ` ($${inner}$) `
              } else {
                result += ` $${trimmedMath}$ `
              }
            }
            if (suffixParen) result += ` ${suffixParen} `
          }
        }
      }
      // Dọn dẹp khoảng trắng kép
      return result.replace(/\s+/g, ' ').trim()
    } else {
      // Dòng không có \text{...}:
      // Nếu dòng chứa các lệnh LaTeX hoặc ký hiệu toán học
      const trimmed = line.trim()
      if (!trimmed) return ''

      // Nếu có ngoặc chú thích ở đuôi, ví dụ "\frac{OE}{EN} = \frac{OH}{HJ} (EH // NJ)"
      const matchWithParen = trimmed.match(/^(.*?)\s*\(([^)]+)\)$/)
      if (matchWithParen) {
        const mainMath = matchWithParen[1].trim()
        const parenContent = matchWithParen[2].trim()
        return `$${mainMath}$ ($${parenContent}$)`
      }

      return `$${trimmed}$`
    }
  })

  return processedLines.filter(l => l.length > 0).join('\n\n')
}
