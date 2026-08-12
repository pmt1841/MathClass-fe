import { defaultSchema } from 'rehype-sanitize'

export const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'math', 'semantics', 'annotation', 'annotation-xml',
    'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mroot', 'msqrt',
    'mtable', 'mtr', 'mtd', 'mlabeledtr', 'multiscripts', 'mover', 'munder', 'munderover',
    'svg', 'path', 'line', 'rect', 'circle', 'use', 'g'
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] || []),
      'className', 'style', 'aria-hidden', 'aria-label', 'role', 'encoding', 'xmlns', 'viewBox', 'd'
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      'className', 'style', 'aria-hidden'
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      'className', 'style', 'aria-hidden'
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      'className', 'style'
    ]
  }
}
