import { defaultSchema } from 'rehype-sanitize'

export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className', 'math-inline', 'math-display']
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', 'math-inline', 'math-display']
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', 'math-inline', 'math-display']
    ]
  }
}
