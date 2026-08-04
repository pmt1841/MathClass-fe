import { useState, useCallback, RefObject } from 'react'

export interface SelectionData {
  quoteText: string
  occurrenceIndex: number
  position: { top: number; left: number }
}

function getVisibleTextUpTo(container: HTMLElement, targetNode: Node, targetOffset: number): string {
  let text = ''

  function walk(node: Node): boolean {
    if (node === targetNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += (node.nodeValue || '').substring(0, targetOffset)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < Math.min(targetOffset, node.childNodes.length); i++) {
          const stopped = walk(node.childNodes[i])
          if (stopped) return true
        }
      }
      return true
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (
        el.classList?.contains('katex-mathml') ||
        el.tagName === 'SCRIPT' ||
        el.tagName === 'STYLE'
      ) {
        return false
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        const stopped = walk(node.childNodes[i])
        if (stopped) return true
      }
      return false
    }

    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue || ''
      return false
    }

    return false
  }

  walk(container)
  return text
}

function getVisibleTextOfRange(range: Range, container: HTMLElement): string {
  let text = ''
  let inRange = false

  const startNode = range.startContainer
  const startOffset = range.startOffset
  const endNode = range.endContainer
  const endOffset = range.endOffset

  function walk(node: Node): boolean {
    if (node === startNode) {
      inRange = true
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (
        el.classList?.contains('katex-mathml') ||
        el.tagName === 'SCRIPT' ||
        el.tagName === 'STYLE'
      ) {
        if (node === endNode) return true
        return false
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        const stopped = walk(node.childNodes[i])
        if (stopped) return true
      }

      if (node === endNode) return true
      return false
    }

    if (node.nodeType === Node.TEXT_NODE) {
      if (inRange) {
        const val = node.nodeValue || ''
        let s = 0
        let e = val.length

        if (node === startNode) {
          s = startOffset
        }
        if (node === endNode) {
          e = endOffset
        }

        text += val.substring(s, e)
      }

      if (node === endNode) {
        return true
      }
      return false
    }

    return false
  }

  walk(container)
  return text.trim()
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const container = containerRef.current
    if (!container || !container.contains(selection.anchorNode)) return

    try {
      const range = selection.getRangeAt(0)
      const visibleText = getVisibleTextOfRange(range, container)
      const text = visibleText || selection.toString().trim()
      if (!text) return

      const preSelectionText = getVisibleTextUpTo(container, range.startContainer, range.startOffset)

      let occurrenceIndex = 0
      let index = preSelectionText.indexOf(text)
      while (index !== -1) {
        occurrenceIndex++
        index = preSelectionText.indexOf(text, index + 1)
      }

      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      setSelectionData({
        quoteText: text,
        occurrenceIndex,
        position: {
          top: rect.bottom - containerRect.top + container.scrollTop + 8,
          left: rect.left - containerRect.left + (rect.width / 2) - 16
        }
      })
    } catch (e) {
      console.error("Lỗi khi xử lý text selection", e)
    }
  }, [containerRef])

  const clearSelection = useCallback(() => {
    setSelectionData(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  return {
    selectionData,
    handleMouseUp,
    clearSelection,
  }
}
