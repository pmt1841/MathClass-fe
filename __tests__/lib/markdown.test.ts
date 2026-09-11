import { describe, it, expect } from 'vitest'
import { sanitizeSchema } from '@/lib/markdown'

describe('markdown sanitizeSchema', () => {
  it('cho phép các thẻ MathML để hiển thị công thức toán học', () => {
    const allowedTags = sanitizeSchema.tagNames || []
    expect(allowedTags).toContain('math')
    expect(allowedTags).toContain('semantics')
    expect(allowedTags).toContain('mrow')
    expect(allowedTags).toContain('mfrac')
    expect(allowedTags).toContain('msqrt')
    expect(allowedTags).toContain('msup')
    expect(allowedTags).toContain('msub')
  })

  it('cho phép các thẻ SVG cho đồ thị và hình vẽ hình học', () => {
    const allowedTags = sanitizeSchema.tagNames || []
    expect(allowedTags).toContain('svg')
    expect(allowedTags).toContain('path')
    expect(allowedTags).toContain('circle')
    expect(allowedTags).toContain('rect')
    expect(allowedTags).toContain('line')
  })

  it('cho phép các thuộc tính tùy chỉnh cần thiết cho KaTeX và styling', () => {
    const globalAttrs = sanitizeSchema.attributes?.['*'] || []
    expect(globalAttrs).toContain('className')
    expect(globalAttrs).toContain('style')
    expect(globalAttrs).toContain('aria-hidden')
    expect(globalAttrs).toContain('viewBox')
  })
})
