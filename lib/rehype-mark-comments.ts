interface Comment {
  id: number
  quoteText: string | null
  occurrenceIndex: number | null
}

interface RehypeMarkCommentsOptions {
  comments: Comment[]
  activeCommentId: number | null
}

interface TextNodeRef {
  node: any
  parent: any
  indexInParent: number
  start: number
  end: number
}

function isElement(node: any): boolean {
  return node && typeof node === 'object' && node.type === 'element'
}

function hasClassName(node: any, className: string): boolean {
  if (!isElement(node) || !node.properties) return false
  const classList = node.properties.className
  if (Array.isArray(classList)) {
    return classList.includes(className)
  }
  if (typeof classList === 'string') {
    return classList.split(/\s+/).includes(className)
  }
  return false
}

function shouldSkipElement(node: any): boolean {
  if (!isElement(node)) return false
  const tag = node.tagName
  if (tag === 'mark' || tag === 'code' || tag === 'pre' || tag === 'script' || tag === 'style') {
    return true
  }
  if (hasClassName(node, 'katex-mathml')) {
    return true
  }
  return false
}

function collectTextNodes(
  node: any,
  parent: any = null,
  indexInParent: number = 0,
  textNodes: TextNodeRef[] = [],
  state: { currentOffset: number } = { currentOffset: 0 }
): TextNodeRef[] {
  if (!node) return textNodes

  if (node.type === 'text') {
    const val = node.value || ''
    if (val.length > 0) {
      const start = state.currentOffset
      state.currentOffset += val.length
      textNodes.push({
        node,
        parent,
        indexInParent,
        start,
        end: state.currentOffset
      })
    }
    return textNodes
  }

  if (node.type === 'element' || node.type === 'root') {
    if (shouldSkipElement(node)) {
      return textNodes
    }

    if (node.children && Array.isArray(node.children)) {
      for (let i = 0; i < node.children.length; i++) {
        collectTextNodes(node.children[i], node, i, textNodes, state)
      }
    }
  }

  return textNodes
}

function getMarkClassName(commentId: number, activeCommentId: number | null): string {
  if (commentId === -1) {
    return 'bg-blue-200/90 ring-2 ring-blue-400 text-slate-900 rounded-sm select-none'
  }
  if (activeCommentId === commentId) {
    return 'bg-yellow-300 ring-2 ring-yellow-400 rounded-sm cursor-pointer transition-colors'
  }
  return 'bg-yellow-100 hover:bg-yellow-200 cursor-pointer rounded-sm transition-colors'
}

function cleanQuoteText(quote: string): string {
  let clean = quote.trim()
  // Clean duplicated KaTeX MathML symbol artifacts (e.g. "− ∞ −∞" -> "−∞" or "- ∞ -∞" -> "-∞")
  clean = clean.replace(/([−\-+×÷=><±∞])\s*([−\-+×÷=><±∞])\s*\1\s*\2/g, '$1$2')
  clean = clean.replace(/([−\-+×÷=><±∞])\s+\1/g, '$1')
  return clean
}

export default function rehypeMarkComments(options: RehypeMarkCommentsOptions) {
  return (tree: any) => {
    if (!options.comments || options.comments.length === 0) return

    const validComments = options.comments.filter(
      c => c.quoteText && c.quoteText.trim().length > 0
    )

    if (validComments.length === 0) return

    for (const comment of validComments) {
      const textNodes = collectTextNodes(tree)
      if (textNodes.length === 0) continue

      const fullText = textNodes.map(tn => tn.node.value).join('')
      const rawQuote = comment.quoteText!
      let targetQuote = fullText.includes(rawQuote) ? rawQuote : rawQuote.trim()

      if (!fullText.includes(targetQuote)) {
        const cleaned = cleanQuoteText(rawQuote)
        if (fullText.includes(cleaned)) {
          targetQuote = cleaned
        }
      }

      if (!targetQuote) continue

      const targetOccurrence = comment.occurrenceIndex ?? 0
      let foundIndex = -1
      let currentOccurrence = 0
      let searchStart = 0

      while (searchStart < fullText.length) {
        const idx = fullText.indexOf(targetQuote, searchStart)
        if (idx === -1) break
        if (currentOccurrence === targetOccurrence) {
          foundIndex = idx
          break
        }
        currentOccurrence++
        searchStart = idx + 1
      }

      if (foundIndex === -1) continue

      const matchStart = foundIndex
      const matchEnd = foundIndex + targetQuote.length

      // Find all text nodes overlapping [matchStart, matchEnd]
      const overlapping = textNodes.filter(
        tn => tn.end > matchStart && tn.start < matchEnd
      )

      if (overlapping.length === 0) continue

      // Process in reverse order of indexInParent to avoid invalidating sibling indices during splice
      overlapping.sort((a, b) => b.indexInParent - a.indexInParent)

      for (const tn of overlapping) {
        const overlapStart = Math.max(tn.start, matchStart)
        const overlapEnd = Math.min(tn.end, matchEnd)

        const localStart = overlapStart - tn.start
        const localEnd = overlapEnd - tn.start

        const value = tn.node.value || ''
        const beforeText = value.substring(0, localStart)
        const highlightText = value.substring(localStart, localEnd)
        const afterText = value.substring(localEnd)

        const newNodes: any[] = []
        if (beforeText) {
          newNodes.push({ type: 'text', value: beforeText })
        }

        newNodes.push({
          type: 'element',
          tagName: 'mark',
          properties: {
            'data-comment-id': comment.id,
            className: getMarkClassName(comment.id, options.activeCommentId)
          },
          children: [{ type: 'text', value: highlightText }]
        })

        if (afterText) {
          newNodes.push({ type: 'text', value: afterText })
        }

        if (tn.parent && Array.isArray(tn.parent.children)) {
          tn.parent.children.splice(tn.indexInParent, 1, ...newNodes)
        }
      }
    }
  }
}
