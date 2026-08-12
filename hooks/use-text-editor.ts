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
    let cmd = latexCommand.trim()

    // Strip outer $ or $$ from cmd if present to prevent double-wrapping
    cmd = cmd.replace(/^\$\$?/, '').replace(/\$\$?$/, '').trim()

    if (selectedText && cmd.includes('{ }')) {
      cmd = cmd.replace('{ }', `{${selectedText}}`)
    }

    // Auto-wrap multi-line equations with \\ in \begin{aligned} environment if not already in an environment
    if (cmd.includes('\\\\') && !cmd.includes('\\begin{')) {
      cmd = `\\begin{aligned}\n${cmd}\n\\end{aligned}`
    }

    const isMathBlock = cmd.includes('\\begin') || cmd.includes('\\\\') || cmd.includes('\n')
    let insertText = cmd

    if (!isInsideMath) {
      const needsLeadingNewline = before.length > 0 && !before.endsWith('\n')
      const prefixPadding = before.trimEnd().endsWith('$$') ? '\n\n' : (isMathBlock && needsLeadingNewline ? '\n' : '')
      const suffixPadding = after.trimStart().startsWith('$$') ? '\n\n' : (isMathBlock && !after.startsWith('\n') ? '\n' : '')

      insertText = isMathBlock
        ? `${prefixPadding}$$\n${cmd}\n$$${suffixPadding}`
        : `${prefixPadding}$$ ${cmd} $$${suffixPadding}`
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
