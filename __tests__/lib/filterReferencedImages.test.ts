import { describe, it, expect } from 'vitest'
import { filterReferencedImages } from '@/app/(dashboard)/assignments/create/_components/AssignmentForm'

describe('filterReferencedImages', () => {
  const mockImages = [
    { imageCode: '[IMAGE_11111111]', imageUrl: 'https://supabase.co/storage/img1.png' },
    { imageCode: '[IMAGE_22222222]', imageUrl: 'https://supabase.co/storage/img2.png' },
    { imageCode: '[IMAGE_33333333]', imageUrl: 'https://supabase.co/storage/img3.png' },
  ]

  it('returns empty array when images is null or empty', () => {
    expect(filterReferencedImages('content', 'desc', [])).toEqual([])
    expect(filterReferencedImages('content', 'desc', null as any)).toEqual([])
  })

  it('keeps only images that are referenced by imageCode in content or description', () => {
    const content = 'Giải bài toán sau: [IMAGE_11111111] và tìm x.'
    const description = 'Đề bài minh họa'

    const filtered = filterReferencedImages(content, description, mockImages)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].imageCode).toBe('[IMAGE_11111111]')
  })

  it('keeps images referenced by imageUrl directly', () => {
    const content = 'Ảnh: https://supabase.co/storage/img2.png'
    const description = ''

    const filtered = filterReferencedImages(content, description, mockImages)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].imageCode).toBe('[IMAGE_22222222]')
  })

  it('removes images that were deleted from both content and description', () => {
    const content = 'Nội dung không có ảnh nào'
    const description = 'Mô tả bài tập'

    const filtered = filterReferencedImages(content, description, mockImages)

    expect(filtered).toHaveLength(0)
  })
})
