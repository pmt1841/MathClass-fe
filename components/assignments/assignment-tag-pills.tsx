'use client'

import type { AssignmentTag } from '@/services/assignmentService'
import { cn } from '@/lib/utils'

const colors: Record<string, string> = {
  GRADE: 'border-sky-200 bg-sky-50 text-sky-700',
  SUBJECT: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  DIFFICULTY: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function AssignmentTagPills({ tags }: { tags?: AssignmentTag[] }) {
  if (!tags?.length) {
    return (
      <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        Chưa phân loại
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag, idx) => {
        let tagColor = (tag.type && colors[tag.type]) || 'border-indigo-100 bg-indigo-50/70 text-indigo-700'
        if (tag.type === 'DIFFICULTY') {
          if (tag.name === 'Dễ') {
            tagColor = 'border-emerald-200 bg-emerald-50 text-emerald-700'
          } else if (tag.name === 'Khó') {
            tagColor = 'border-rose-200 bg-rose-50 text-rose-700'
          } else {
            tagColor = 'border-amber-200 bg-amber-50 text-amber-700'
          }
        }

        return (
          <span
            key={tag.id || `${tag.name}-${idx}`}
            title={tag.name}
            className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tagColor)}
          >
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}
