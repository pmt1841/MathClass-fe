'use client'

import type { AssignmentTag, TagType } from '@/services/assignmentService'

const labels: Record<TagType, string> = { GRADE: 'Khối lớp', SUBJECT: 'Phân môn', DIFFICULTY: 'Độ khó' }
const colors: Record<TagType, string> = { GRADE: 'border-sky-200 bg-sky-50 text-sky-700', SUBJECT: 'border-indigo-200 bg-indigo-50 text-indigo-700', DIFFICULTY: 'border-amber-200 bg-amber-50 text-amber-700' }

export function AssignmentTagSelector({ tags, selectedIds, onChange }: { tags: AssignmentTag[]; selectedIds: number[]; onChange: (ids: number[]) => void }) {
  return <div className="space-y-3">{(['GRADE', 'SUBJECT', 'DIFFICULTY'] as TagType[]).map(type => <div key={type}><p className="mb-1.5 text-xs font-semibold text-slate-600">{labels[type]}</p><div className="flex flex-wrap gap-2">{tags.filter(tag => tag.type === type).map(tag => {
    const selected = selectedIds.includes(tag.id)
    return <button type="button" key={tag.id} onClick={() => onChange(selected ? selectedIds.filter(id => id !== tag.id) : [...selectedIds.filter(id => tags.find(item => item.id === id)?.type !== type), tag.id])} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${colors[type]} ${selected ? 'ring-2 ring-primary ring-offset-1' : 'hover:brightness-95'}`}>{tag.name}</button>
  })}</div></div>)}</div>
}
