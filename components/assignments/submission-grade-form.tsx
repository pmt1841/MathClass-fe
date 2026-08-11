import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

export const createGradeSchema = (maxScore: number = 10) => z.object({
  score: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, { message: 'Vui lòng nhập điểm số' })
    .refine((val) => !isNaN(Number(val)), { message: 'Điểm phải là một số hợp lệ' })
    .refine((val) => Number(val) >= 0, { message: 'Điểm tối thiểu là 0' })
    .refine((val) => Number(val) <= maxScore, { message: `Điểm tối đa là ${maxScore}` })
    .refine(
      (val) => {
        const num = Number(val)
        return Math.round(num * 10) / 10 === num
      },
      { message: 'Điểm chỉ được lẻ tối đa 1 chữ số thập phân' }
    )
    .transform((val) => Number(val)),
  teacherFeedback: z.string().optional(),
})

export const gradeSchema = createGradeSchema(10)

export type GradeFormValues = z.infer<typeof gradeSchema>

interface SubmissionGradeFormProps {
  initialScore: number
  initialFeedback: string
  isSubmitting: boolean
  isDraft: boolean
  maxScore?: number
  onSubmit: (values: GradeFormValues) => void
}

export function SubmissionGradeForm({ 
  initialScore, 
  initialFeedback, 
  isSubmitting, 
  isDraft, 
  maxScore = 10,
  onSubmit 
}: SubmissionGradeFormProps) {
  const schema = useMemo(() => createGradeSchema(maxScore), [maxScore])
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      score: initialScore,
      teacherFeedback: initialFeedback,
    },
  })

  useEffect(() => {
    form.setValue('score', initialScore)
    form.setValue('teacherFeedback', initialFeedback)
  }, [initialScore, initialFeedback, form])

  return (
    <div className="flex items-center gap-4">
      <Form {...form}>
        <form id="grade-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-sm font-semibold text-slate-600">Điểm:</span>
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem className="flex items-center space-y-0 relative">
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={maxScore}
                    className="w-20 h-8 text-center font-bold bg-white focus-visible:ring-blue-500"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <span className="text-sm text-slate-400 font-medium">/ {maxScore}</span>
        </form>
      </Form>
      
      <Button
        form="grade-form"
        type="submit"
        disabled={isSubmitting || isDraft}
        className="bg-blue-600 hover:bg-blue-700 h-9 px-6 font-semibold"
      >
        <Save className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Đang lưu...' : 'Lưu điểm'}
      </Button>
    </div>
  )
}
