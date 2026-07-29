import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SubmissionGradeForm, createGradeSchema } from '@/components/assignments/submission-grade-form'

describe('SubmissionGradeForm Component & Schema', () => {
  describe('createGradeSchema validation', () => {
    const schema = createGradeSchema(10)

    it('validates correct grade scores', () => {
      expect(schema.safeParse({ score: '8.5', teacherFeedback: 'Tốt' }).success).toBe(true)
      expect(schema.safeParse({ score: '10', teacherFeedback: '' }).success).toBe(true)
    })

    it('rejects negative or over max score', () => {
      expect(schema.safeParse({ score: '-1' }).success).toBe(false)
      expect(schema.safeParse({ score: '11' }).success).toBe(false)
    })
  })

  describe('SubmissionGradeForm Component', () => {
    it('renders initial score and submits updated grade', async () => {
      const onSubmitMock = vi.fn()

      render(
        <SubmissionGradeForm
          initialScore={7.5}
          initialFeedback="Làm bài ổn"
          isSubmitting={false}
          isDraft={false}
          maxScore={10}
          onSubmit={onSubmitMock}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(7.5)

      fireEvent.change(input, { target: { value: '9' } })
      fireEvent.click(screen.getByRole('button', { name: /Lưu điểm/i }))

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalledWith(
          expect.objectContaining({
            score: 9,
          }),
          expect.anything()
        )
      })
    })

    it('disables save button when submitting or in draft mode', () => {
      render(
        <SubmissionGradeForm
          initialScore={5}
          initialFeedback=""
          isSubmitting={true}
          isDraft={false}
          onSubmit={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /Đang lưu.../i })).toBeDisabled()
    })
  })
})
