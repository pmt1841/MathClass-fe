import Link from 'next/link'
import { Users, GraduationCap, ExternalLink, Check, Copy } from 'lucide-react'

export interface Classroom {
  id: number
  classCode: string
  className: string
  teacherId: number
  teacherName: string
  studentCount: number
  maxStudents: number
}

interface ClassCardProps {
  item: Classroom
  gradient: string
  userRole: string
  isCopied: boolean
  onCopyCode: (code: string, id: number) => void
}

export function ClassCard({ item, gradient, userRole, isCopied, onCopyCode }: ClassCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />

      <div className="space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-foreground text-lg tracking-tight group-hover:text-primary transition-colors line-clamp-1">
              {item.className}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang hoạt động
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl transition-all">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
              Mã lớp học
            </span>
            <p className="font-mono text-sm font-bold text-slate-800 leading-tight">
              {item.classCode}
            </p>
          </div>
          <button
            onClick={() => onCopyCode(item.classCode, item.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
              isCopied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-white border-slate-200 text-muted-foreground hover:text-slate-800 hover:border-slate-300 active:scale-95'
            }`}
            title="Sao chép mã lớp"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Sĩ số:</span>
            <span className="text-xs font-bold text-foreground">
              {item.studentCount ?? 0}
              <span className="text-muted-foreground font-normal">/{item.maxStudents ?? '—'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (item.studentCount ?? 0) >= (item.maxStudents ?? Infinity)
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {(item.studentCount ?? 0) >= (item.maxStudents ?? Infinity) ? 'Đầy lớp' : 'Còn chỗ'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-medium">{item.teacherName}</span>
          </div>

          <Link
            href={userRole === 'STUDENT' ? `/classes/${item.classCode}/student` : `/classes/${item.classCode}`}
            className="flex items-center gap-1 rounded-xl bg-slate-100/80 hover:bg-primary hover:text-primary-foreground px-3.5 py-2 text-xs font-bold text-foreground transition-all duration-200 group/btn"
          >
            Vào lớp
            <ExternalLink className="h-3 w-3 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>
    </div>
  )
}
