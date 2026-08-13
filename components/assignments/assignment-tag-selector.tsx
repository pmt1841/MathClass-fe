'use client'

import type { AssignmentTag, TagType } from '@/services/assignmentService'
import { cn } from '@/lib/utils'

const labels: Record<TagType, string> = {
  GRADE: 'Khối lớp',
  SUBJECT: 'Phân môn',
  DIFFICULTY: 'Độ khó',
}

const colors: Record<TagType, string> = {
  GRADE: 'border-sky-200 bg-sky-50 text-sky-700',
  SUBJECT: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  DIFFICULTY: 'border-amber-200 bg-amber-50 text-amber-700',
}

interface AssignmentTagSelectorProps {
  tags: AssignmentTag[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function AssignmentTagSelector({ tags, selectedIds, onChange }: AssignmentTagSelectorProps) {
  const tagTypes: TagType[] = ['GRADE', 'SUBJECT', 'DIFFICULTY']

  const handleSelect = (tag: AssignmentTag, selected: boolean) => {
    if (selected) {
      onChange(selectedIds.filter((id) => id !== tag.id))
    } else {
      const filteredIds = selectedIds.filter((id) => {
        const existingTag = tags.find((t) => t.id === id)
        return existingTag ? existingTag.type !== tag.type : true
      })
      onChange([...filteredIds, tag.id])
    }
  }

  return (
    <div className="space-y-3">
      {tagTypes.map((type) => {
        const groupTags = tags.filter((tag) => tag.type === type)
        return (
          <div key={type}>
            <p className="mb-1.5 text-xs font-semibold text-slate-600">{labels[type]}</p>
            <div className="flex flex-wrap gap-2">
              {groupTags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Không có tag</span>
              ) : (
                groupTags.map((tag) => {
                  const selected = selectedIds.includes(tag.id)
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => handleSelect(tag, selected)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                        colors[type],
                        selected ? 'ring-2 ring-primary ring-offset-1' : 'hover:brightness-95'
                      )}
                    >
                      {tag.name}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
