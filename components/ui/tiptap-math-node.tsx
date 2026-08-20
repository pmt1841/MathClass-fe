'use client'

import React, { useEffect, useRef } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { MathfieldElement } from 'mathlive'
import 'mathlive'

export function MathNodeView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props
  const latex = node.attrs.latex || ''
  const mathFieldRef = useRef<MathfieldElement | null>(null)
  const isInternalChangeRef = useRef(false)

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
  }, [latex])

  // Auto focus and select placeholder on initial insert
  useEffect(() => {
    const mathField = mathFieldRef.current
    if (!mathField) return

    if (latex.includes('\\placeholder') || latex.includes('#?')) {
      const timeoutId = setTimeout(() => {
        selectFirstPlaceholder(mathField)
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [])

  const handleInput = (e: React.FormEvent<MathfieldElement>) => {
    const target = e.target as MathfieldElement
    const newVal = target.value ?? ''
    isInternalChangeRef.current = true
    updateAttributes({ latex: newVal })
  }

  const handleFocus = () => {
    const mf = mathFieldRef.current
    if (mf && (mf.value.includes('\\placeholder') || mf.value.includes('#?'))) {
      setTimeout(() => {
        selectFirstPlaceholder(mf)
      }, 10)
    }
  }

  const handleClick = () => {
    const mf = mathFieldRef.current
    if (mf && (mf.value.includes('\\placeholder') || mf.value.includes('#?'))) {
      setTimeout(() => {
        selectFirstPlaceholder(mf)
      }, 10)
    }
  }

  const handleBlur = (e: React.FocusEvent<MathfieldElement>) => {
    const target = e.target as MathfieldElement
    const newVal = (target.value ?? '').trim()
    if (!newVal) {
      deleteNode()
    } else {
      updateAttributes({ latex: newVal })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<MathfieldElement>) => {
    // If the math field is completely empty and user hits Backspace, remove the node
    if (e.key === 'Backspace' && (!mathFieldRef.current?.value || mathFieldRef.current.value.trim() === '')) {
      e.preventDefault()
      deleteNode()
    }
  }

  return (
    <NodeViewWrapper
      as="span"
      className="relative inline-flex items-center align-middle transition-all my-0.5 mx-1 max-w-full"
      contentEditable={false}
    >
      <math-field
        ref={mathFieldRef}
        math-virtual-keyboard-policy="manual"
        onInput={handleInput}
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`inline-math-field px-2 py-0.5 rounded-lg transition-all border outline-none cursor-text select-auto max-w-full overflow-x-auto ${selected
          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-400/20'
          : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-850/60 hover:border-blue-300 hover:bg-blue-50/30'
          } focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-400/20`}
        style={{
          display: 'inline-block',
          fontSize: '16px',
          minWidth: '24px',
          maxWidth: '100%',
          overflowX: 'auto',
          lineHeight: 'normal',
          verticalAlign: 'middle',
          userSelect: 'auto',
          WebkitUserSelect: 'auto',
        }}
      />
    </NodeViewWrapper>
  )
}

