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

// Keep raw LaTeX formatting intact during conversion
const extractMath = (text: string) => {
  const mathBlocks: string[] = []
  if (!text) return { processed: '', mathBlocks }

  let index = 0
  // 1. Match display math: $$ ... $$
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    const placeholder = `MATHBLOCKDISPLAY${index}`
    mathBlocks.push(match)
    index++
    return placeholder
  })

  // 2. Match inline math: $ ... $
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (match) => {
    const placeholder = `MATHBLOCKINLINE${index}`
    mathBlocks.push(match)
    index++
    return placeholder
  })

  return { processed, mathBlocks }
}

const restoreMath = (text: string, mathBlocks: string[]) => {
  if (!text) return ''
  let restored = text
  mathBlocks.forEach((block, index) => {
    restored = restored.replaceAll(`MATHBLOCKDISPLAY${index}`, block)
    restored = restored.replaceAll(`MATHBLOCKINLINE${index}`, block)
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

    const placeholder = `RESOURCEBLOCKPLACEHOLDER${index}`
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
    restored = restored.replaceAll(`RESOURCEBLOCKPLACEHOLDER${index}`, block)
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
    return restoreMath(restoredResources, mathBlocks)
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

    return restoreMath(unescaped, mathBlocks)
  } catch (e) {
    console.error('Failed to parse html to markdown', e)
    return html
  }
}
