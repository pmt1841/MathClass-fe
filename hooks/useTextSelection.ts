import { useState, useCallback, RefObject } from 'react'

export interface SelectionData {
  quoteText: string
  occurrenceIndex: number
  position: { top: number; left: number }
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const text = selection.toString().trim()
    if (!text) return

    const container = containerRef.current
    if (!container || !container.contains(selection.anchorNode)) return

    try {
      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(container)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const preSelectionText = preSelectionRange.toString()

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
