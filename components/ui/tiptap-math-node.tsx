'use client'

import React, { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { MathfieldElement } from 'mathlive'
import 'mathlive'

export function MathNodeView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected, editor } = props
  const latex = node.attrs.latex || ''
  const mathFieldRef = useRef<MathfieldElement | null>(null)
  const isInternalChangeRef = useRef(false)
  const [isEditable, setIsEditable] = useState(() => editor?.isEditable ?? true)

  // Listen to editor isEditable changes in real-time
  useEffect(() => {
    if (!editor) return
    const syncEditable = () => {
      setIsEditable(editor.isEditable)
      const mf = mathFieldRef.current
      if (mf) {
        mf.readOnly = !editor.isEditable
        if (!editor.isEditable) {
          mf.setAttribute('read-only', '')
        } else {
          mf.removeAttribute('read-only')
        }
      }
    }
    syncEditable()
    editor.on('transaction', syncEditable)
    editor.on('update', syncEditable)
    return () => {
      editor.off('transaction', syncEditable)
      editor.off('update', syncEditable)
    }
  }, [editor])

  const selectFirstPlaceholder = (mf: MathfieldElement) => {
    try {
      mf.focus()
      mf.executeCommand('moveToMathfieldStart')
      mf.executeCommand('moveToNextPlaceholder')
      if (mf.selectionIsCollapsed) {
        mf.executeCommand('selectGroup')
      }
    } catch { }
  }

  // Configure math-field on mount & sync external latex changes
  useEffect(() => {
    const mathField = mathFieldRef.current
    if (!mathField) return

    // Set readOnly according to editor isEditable status
    mathField.readOnly = !isEditable
    if (!isEditable) {
      mathField.setAttribute('read-only', '')
    } else {
      mathField.removeAttribute('read-only')
    }

    // Turn off virtual keyboard & menu toggles completely
    mathField.mathVirtualKeyboardPolicy = 'manual'
    if ('menuItems' in mathField) {
      try {
        mathField.menuItems = []
      } catch { }
    }

    // Set custom CSS variables on math-field
    try {
      mathField.style.setProperty('--selection-background-color', 'rgba(59, 130, 246, 0.25)')
      mathField.style.setProperty('--selection-color', 'inherit')
      mathField.style.setProperty('--contains-highlight-background-color', 'transparent')
      mathField.style.setProperty('--highlight-color', 'rgba(59, 130, 246, 0.2)')
      mathField.style.setProperty('--placeholder-color', '#94a3b8')
      mathField.style.setProperty('--caret-color', '#2563eb')
    } catch { }

    // Inject override styles into MathLive Shadow DOM if accessible
    try {
      if (mathField.shadowRoot && !mathField.shadowRoot.querySelector('#mathlive-custom-style')) {
        const style = document.createElement('style')
        style.id = 'mathlive-custom-style'
        style.textContent = `
          .ML__contains-highlight { background-color: transparent !important; background: transparent !important; }
          .ML__selected { background-color: rgba(59, 130, 246, 0.25) !important; color: inherit !important; }
          .ML__selection { background-color: rgba(59, 130, 246, 0.25) !important; color: inherit !important; }
          .ML__placeholder { color: #94a3b8 !important; opacity: 0.8 !important; }
          .ML__focused { outline: none !important; }
        `
        mathField.shadowRoot.appendChild(style)
      }
    } catch { }

    if (typeof window !== 'undefined' && 'mathVirtualKeyboard' in window) {
      try {
        const mvk = (window as unknown as { mathVirtualKeyboard?: { policy: string; hide: () => void } }).mathVirtualKeyboard
        if (mvk) {
          mvk.policy = 'manual'
          mvk.hide()
        }
      } catch { }
    }

    // Only set value if it differs from current to prevent cursor jump while typing
    if (mathField.value !== latex && !isInternalChangeRef.current) {
      mathField.setValue(latex || '')
    }
    isInternalChangeRef.current = false
  }, [latex, isEditable])

  // Auto focus and select placeholder on initial insert
  useEffect(() => {
    if (!isEditable) return
    const mathField = mathFieldRef.current
    if (!mathField) return

    if (latex.includes('\\placeholder') || latex.includes('#?')) {
      const timeoutId = setTimeout(() => {
        selectFirstPlaceholder(mathField)
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [isEditable, latex])

  const handleInput = (e: React.FormEvent<MathfieldElement>) => {
    if (!isEditable) return
    const target = e.target as MathfieldElement
    const newVal = target.value ?? ''
    isInternalChangeRef.current = true
    updateAttributes({ latex: newVal })
  }

  const handleFocus = () => {
    if (!isEditable) return
    const mf = mathFieldRef.current
    if (mf && (mf.value.includes('\\placeholder') || mf.value.includes('#?'))) {
      setTimeout(() => {
        selectFirstPlaceholder(mf)
      }, 10)
    }
  }

  const handleClick = () => {
    if (!isEditable) return
    const mf = mathFieldRef.current
    if (mf && (mf.value.includes('\\placeholder') || mf.value.includes('#?'))) {
      setTimeout(() => {
        selectFirstPlaceholder(mf)
      }, 10)
    }
  }

  const handleBlur = (e: React.FocusEvent<MathfieldElement>) => {
    if (!isEditable) return
    const target = e.target as MathfieldElement
    const newVal = (target.value ?? '').trim()
    if (!newVal) {
      deleteNode()
    } else {
      updateAttributes({ latex: newVal })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<MathfieldElement>) => {
    if (!isEditable) return
    // If the math field is completely empty and user hits Backspace, remove the node
    if (e.key === 'Backspace' && (!mathFieldRef.current?.value || mathFieldRef.current.value.trim() === '')) {
      e.preventDefault()
      deleteNode()
    }
  }

  return (
    <NodeViewWrapper
      as="span"
      className="relative inline-flex items-center align-middle transition-all my-0 mx-0.5 max-w-full"
      contentEditable={false}
    >
      <math-field
        ref={mathFieldRef}
        read-only={!isEditable ? '' : undefined}
        math-virtual-keyboard-policy="manual"
        onInput={handleInput}
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`inline-math-field px-1 py-0.5 rounded transition-all outline-none max-w-full overflow-x-auto ${
          !isEditable
            ? 'border-0 bg-transparent cursor-default'
            : selected
            ? 'border-0 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-400/40 cursor-text select-auto'
            : 'border-0 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-text select-auto focus-within:bg-blue-50/30 focus-within:ring-1 focus-within:ring-blue-400/40'
        }`}
        style={{
          display: 'inline-block',
          fontSize: '16px',
          minWidth: isEditable ? '12px' : 'auto',
          maxWidth: '100%',
          overflowX: 'auto',
          lineHeight: 'normal',
          verticalAlign: 'middle',
          userSelect: isEditable ? 'auto' : 'text',
          WebkitUserSelect: isEditable ? 'auto' : 'text',
          pointerEvents: isEditable ? 'auto' : 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
        }}
      />
    </NodeViewWrapper>
  )
}

