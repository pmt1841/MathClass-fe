import { describe, it, expect } from 'vitest'
import {
  separateAdjacentMath,
  markdownToHtml,
  htmlToMarkdown,
  normalizeLatexToMarkdown,
} from '@/lib/editor-utils'

describe('editor-utils', () => {
  describe('separateAdjacentMath', () => {
    it('trả về chuỗi rỗng khi text rỗng', () => {
      expect(separateAdjacentMath('')).toBe('')
    })

    it('tách hai công thức toán inline nằm sát nhau $A$$B$ thành $A$ $B$', () => {
      expect(separateAdjacentMath('$x + 1$$y - 2$')).toBe('$x + 1$ $y - 2$')
    })

    it('tách chuỗi nhiều công thức toán sát nhau $A$$B$$C$', () => {
      expect(separateAdjacentMath('$a$$b$$c$')).toBe('$a$ $b$ $c$')
    })

    it('giữ nguyên khi các công thức đã có khoảng trắng', () => {
      expect(separateAdjacentMath('$x$ $y$')).toBe('$x$ $y$')
    })
  })

  describe('markdownToHtml & htmlToMarkdown', () => {
    it('markdownToHtml - chuyển đổi công thức inline $...$ sang thẻ span math-inline', () => {
      const md = 'Cho biểu thức $x^2 + 2x = 0$'
      const html = markdownToHtml(md)

      expect(html).toContain('data-type="math-inline"')
      expect(html).toContain('data-latex="x^2 + 2x = 0"')
    })

    it('markdownToHtml - chuyển đổi công thức block $$...$$ sang thẻ math display', () => {
      const md = '$$\n\\int_0^1 x dx\n$$'
      const html = markdownToHtml(md)

      expect(html).toContain('data-type="math-inline"')
      expect(html).toContain('data-display="true"')
    })

    it('markdownToHtml - giữ nguyên resource code [SHAPE_1] và [IMAGE_code]', () => {
      const md = 'Hình vẽ tam giác: [SHAPE_1]'
      const html = markdownToHtml(md)

      expect(html).toContain('[SHAPE_1]')
    })

    it('markdownToHtml - thay thế [IMAGE_code] bằng thẻ img nếu có truyền danh sách ảnh', () => {
      const md = 'Ảnh minh họa: [IMAGE_1]'
      const images = [{ imageCode: '[IMAGE_1]', imageUrl: 'https://storage.example.com/img1.png' }]
      const html = markdownToHtml(md, images)

      expect(html).toContain('<img src="https://storage.example.com/img1.png"')
    })

    it('htmlToMarkdown - chuyển đổi HTML phong phú và resource code ngược lại Markdown', () => {
      const html = '<p>Biểu thức <strong>in đậm</strong> và hình vẽ [SHAPE_1]</p>'
      const md = htmlToMarkdown(html)

      expect(md).toContain('**in đậm**')
      expect(md).toContain('[SHAPE_1]')
    })

    it('htmlToMarkdown - giữ nguyên công thức math Tiptap có content', () => {
      const html = '<p>Biểu thức <span data-type="math-inline" data-latex="x + 1 = 2">x + 1 = 2</span></p>'
      const md = htmlToMarkdown(html)

      expect(md).toContain('$x + 1 = 2$')
    })
  })

  describe('normalizeLatexToMarkdown', () => {
    it('trả về rỗng khi input rỗng', () => {
      expect(normalizeLatexToMarkdown('')).toBe('')
    })

    it('xóa code fence markdown hoặc latex bọc ngoài', () => {
      const input = '```latex\nx = 2\n```'
      expect(normalizeLatexToMarkdown(input)).toBe('$x = 2$')
    })

    it('tự động bọc $ cho công thức toán thuần túy không có tiếng Việt', () => {
      expect(normalizeLatexToMarkdown('\\frac{a}{b} = c')).toBe('$\\frac{a}{b} = c$')
    })

    it('chuyển đổi môi trường aligned với \\text{...} tiếng Việt thành văn bản thường kèm công thức $...$', () => {
      const input = '\\begin{aligned} & x^2 - 4 = 0 \\\\ & \\text{suy ra } x = 2 \\text{ hoặc } x = -2 \\end{aligned}'
      const output = normalizeLatexToMarkdown(input)

      expect(output).toContain('$x^2 - 4 = 0$')
      expect(output).toContain('suy ra')
      expect(output).toContain('$x = 2$')
      expect(output).toContain('hoặc')
      expect(output).toContain('$x = -2$')
      expect(output).not.toContain('\\begin{aligned}')
    })
  })
})
