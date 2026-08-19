import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MathNodeView } from './tiptap-math-node'

export interface MathExtensionOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathInline: {
      /**
       * Set a math inline node
       */
      insertMath: (options: { latex: string; displayMode?: boolean }) => ReturnType
    }
  }
}

export const MathInline = Node.create<MathExtensionOptions>({
  name: 'mathInline',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: false,

  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => {
          return element.getAttribute('data-latex') || element.textContent || ''
        },
        renderHTML: (attributes) => {
          return {
            'data-latex': attributes.latex,
          }
        },
      },
      displayMode: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute('data-display') === 'true'
        },
        renderHTML: (attributes) => {
          return {
            'data-display': attributes.displayMode ? 'true' : 'false',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
      {
        tag: 'span.math-node-inline',
      },
      {
        tag: 'div[data-type="math-block"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const element = node as HTMLElement
          return {
            latex: element.getAttribute('data-latex') || element.textContent || '',
            displayMode: true,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'math-inline',
        class: 'math-node-inline',
      }),
      node.attrs.latex,
    ]
  },

  addCommands() {
    return {
      insertMath:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              latex: options.latex,
              displayMode: options.displayMode || false,
            },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView, {
      stopEvent: () => true,
    })
  },
})
