'use client'

import type { AssignmentTag } from '@/services/assignmentService'

const colors = {
  GRADE: 'border-sky-200 bg-sky-50 text-sky-700',
  SUBJECT: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  DIFFICULTY: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function AssignmentTagPills({ tags }: { tags?: AssignmentTag[] }) {
  if (!tags?.length) return <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Chưa phân loại</span>
  return <div className="flex flex-wrap gap-1.5">{tags.map(tag => {
    const difficulty = tag.type === 'DIFFICULTY' ? (tag.name === 'Dễ' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : tag.name === 'Khó' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700') : colors[tag.type]
    return <span key={tag.id} title={tag.type === 'GRADE' ? 'Khối lớp' : tag.type === 'SUBJECT' ? 'Phân môn' : 'Độ khó'} className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${difficulty}`}>{tag.name}</span>
  })}</div>
}
