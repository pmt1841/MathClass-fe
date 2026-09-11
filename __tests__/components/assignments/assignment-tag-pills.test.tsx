import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import { AssignmentTagPills } from '@/components/assignments/assignment-tag-pills'
import type { AssignmentTag } from '@/services/assignmentService'

describe('AssignmentTagPills component', () => {
  it('hiển thị nhãn "Chưa phân loại" khi danh sách tags rỗng hoặc undefined', () => {
    const { rerender } = render(<AssignmentTagPills />)
    expect(screen.getByText('Chưa phân loại')).toBeInTheDocument()

    rerender(<AssignmentTagPills tags={[]} />)
    expect(screen.getByText('Chưa phân loại')).toBeInTheDocument()
  })

  it('hiển thị đúng các tags phân loại GRADE, SUBJECT và DIFFICULTY', () => {
    const tags: AssignmentTag[] = [
      { id: 1, name: 'Lớp 10', type: 'GRADE' },
      { id: 2, name: 'Hình học', type: 'SUBJECT' },
      { id: 3, name: 'Dễ', type: 'DIFFICULTY' },
      { id: 4, name: 'Khó', type: 'DIFFICULTY' },
    ]

    render(<AssignmentTagPills tags={tags} />)

    expect(screen.getByText('Lớp 10')).toBeInTheDocument()
    expect(screen.getByText('Hình học')).toBeInTheDocument()
    expect(screen.getByText('Dễ')).toBeInTheDocument()
    expect(screen.getByText('Khó')).toBeInTheDocument()
  })
})
