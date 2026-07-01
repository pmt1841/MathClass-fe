// Custom visit function instead of unist-util-visit to avoid installing new dependencies
function visit(tree: any, type: string, visitor: (node: any, index: number, parent: any) => number | void) {
  function traverse(node: any, parent: any, index: number) {
    if (node.type === type) {
      const result = visitor(node, index, parent)
      if (typeof result === 'number') {
        return result // Return new index offset
      }
    }
    
    if (node.children && Array.isArray(node.children)) {
      let i = 0
      while (i < node.children.length) {
        const nextIndex = traverse(node.children[i], node, i)
        if (typeof nextIndex === 'number') {
          i = nextIndex
        } else {
          i++
        }
      }
    }
  }
  
  traverse(tree, null, 0)
}

interface Comment {
  id: number
  quoteText: string | null
  occurrenceIndex: number | null
}

interface RehypeMarkCommentsOptions {
  comments: Comment[]
  activeCommentId: number | null
}

export default function rehypeMarkComments(options: RehypeMarkCommentsOptions) {
  return (tree: any) => {
    if (!options.comments || options.comments.length === 0) return

    // Create a deep copy of comments to track occurrences as we traverse
    const tracker = options.comments
      .filter(c => c.quoteText && c.quoteText.trim().length > 0)
      .map(c => ({ ...c, currentOccurrence: 0 }))

    if (tracker.length === 0) return

    visit(tree, 'text', (node: any, index: number, parent: any) => {
      // Do not process text inside already marked nodes or certain code blocks
      if (parent && (parent.tagName === 'mark' || parent.tagName === 'code' || parent.tagName === 'pre')) {
        return
      }

      let textValue = node.value

      for (let i = 0; i < tracker.length; i++) {
        const comment = tracker[i]
        const quote = comment.quoteText!
        
        let startIndex = 0
        let foundIndex = textValue.indexOf(quote, startIndex)

        while (foundIndex !== -1) {
          if (comment.currentOccurrence === comment.occurrenceIndex) {
            // Found the exact occurrence to highlight
            const beforeText = textValue.substring(0, foundIndex)
            const afterText = textValue.substring(foundIndex + quote.length)
            
            const newNodes = []
            if (beforeText) {
              newNodes.push({ type: 'text', value: beforeText })
            }
            
            newNodes.push({
              type: 'element',
              tagName: 'mark',
              properties: {
                'data-comment-id': comment.id,
                className: options.activeCommentId === comment.id 
                  ? 'bg-yellow-300 ring-2 ring-yellow-400 rounded-sm cursor-pointer transition-colors' 
                  : 'bg-yellow-100 hover:bg-yellow-200 cursor-pointer rounded-sm transition-colors'
              },
              children: [{ type: 'text', value: quote }]
            })
            
            if (afterText) {
              // The remaining text might contain other comments, so we should ideally continue processing
              // For simplicity, we push it as a text node. It will be visited in the next loop iteration if we modify the tree.
              // But unist-util-visit doesn't automatically visit newly inserted siblings in the same pass if we don't return the right index.
              newNodes.push({ type: 'text', value: afterText })
            }

            // Replace current node with the new nodes
            parent.children.splice(index, 1, ...newNodes)
            
            // Increment occurrence to avoid matching again if the logic loop re-evaluates
            comment.currentOccurrence++
            
            // Return the index offset to continue visiting the remaining nodes
            return index + newNodes.length
          }

          comment.currentOccurrence++
          startIndex = foundIndex + quote.length
          foundIndex = textValue.indexOf(quote, startIndex)
        }
      }
    })
  }
}
