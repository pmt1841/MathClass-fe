import { RefObject } from 'react'

interface UseTextEditorProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  content: string
  onChange: (newVal: string) => void
}

export function useTextEditor({ textareaRef, content, onChange }: UseTextEditorProps) {
  const handleFormatText = (format: 'bold' | 'italic' | 'underline') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = content || ''

    const before = currentVal.substring(0, start)
    const after = currentVal.substring(end)
    const selectedText = currentVal.substring(start, end)

    let insertText = ''
    let newCursorPos = start

    if (format === 'bold') {
      insertText = `**${selectedText}**`
      newCursorPos = selectedText ? start + insertText.length : start + 2
    } else if (format === 'italic') {
      insertText = `*${selectedText}*`
      newCursorPos = selectedText ? start + insertText.length : start + 1
    } else if (format === 'underline') {
      insertText = `<u>${selectedText}</u>`
      newCursorPos = selectedText ? start + insertText.length : start + 3
    }

    const newVal = before + insertText + after
    onChange(newVal)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleInsertLatex = (latexCommand: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = content || ''

    const before = currentVal.substring(0, start)
    const after = currentVal.substring(end)
    const selectedText = currentVal.substring(start, end)

    // Check if we are already inside a math block ($$ or $)
    const countDoubleDollar = (before.match(/\$\$/g) || []).length
    const countSingleDollar = (before.replace(/\$\$/g, '').match(/\$/g) || []).length
    const isInsideMath = (countDoubleDollar % 2 !== 0) || (countSingleDollar % 2 !== 0)

    // Replace { } with {selectedText} if user highlighted text
    let cmd = latexCommand
    if (selectedText && cmd.includes('{ }')) {
      cmd = cmd.replace('{ }', `{${selectedText}}`)
    }

    const isMathBlock = cmd.includes('\\begin')
    let insertText = cmd

    if (!isInsideMath) {
      insertText = isMathBlock ? `$$ \n${cmd} \n$$` : `$$ ${cmd} $$`
    }

    const newVal = before + insertText + after
    onChange(newVal)

    setTimeout(() => {
      textarea.focus()
      let newCursorPos = start + insertText.length

      const emptyBrackets = insertText.indexOf('{ }')
      if (emptyBrackets !== -1) {
        newCursorPos = start + emptyBrackets + 1
      } else if (isMathBlock) {
        const slashIndex = insertText.indexOf('\\\\')
        if (slashIndex !== -1) {
          newCursorPos = start + slashIndex
        }
      } else if (!isInsideMath && !selectedText) {
        newCursorPos = start + insertText.length - 3
      }

      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return {
    handleFormatText,
    handleInsertLatex
  }
}
