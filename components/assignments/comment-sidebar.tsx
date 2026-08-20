'use client'

import React from 'react'
import { SubmissionCommentResponse } from '@/services/submissionService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface CommentSidebarProps {
  comments: SubmissionCommentResponse[]
  onDeleteComment: (commentId: number) => void
  isDeleting: boolean
  activeCommentId: number | null
  onHoverComment: (commentId: number | null) => void
}

export function CommentSidebar({ comments, onDeleteComment, isDeleting, activeCommentId, onHoverComment }: CommentSidebarProps) {
  const { user } = useAuth()
  const isTeacher = user?.role === 'TEACHER'

  if (!comments || comments.length === 0) {
    return (
      <Card className="h-full border-slate-200 shadow-sm sticky top-24">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-700">Nhận xét chi tiết</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center text-slate-500 text-sm">
          Chưa có nhận xét nào.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full max-h-[calc(100vh-6rem)] overflow-y-auto border-slate-200 shadow-sm sticky top-24">
      <CardHeader className="pb-2 border-b border-slate-100 bg-white sticky top-0 z-10">
        <CardTitle className="text-sm font-semibold text-slate-700 flex justify-between items-center">
          <span>Nhận xét chi tiết</span>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            className={`p-3 rounded-lg border text-sm transition-colors duration-200 ${
              activeCommentId === comment.id 
                ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-100' 
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onMouseEnter={() => onHoverComment(comment.id)}
            onMouseLeave={() => onHoverComment(null)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-slate-700 text-xs">{comment.teacherName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {formatDateTime(comment.createdAt)}
                </div>
              </div>
              {isTeacher && comment.teacherId === user?.id && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-red-600 -mt-1 -mr-1"
                  onClick={() => onDeleteComment(comment.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            
            {comment.quoteText && (
              <div className="bg-yellow-50 border-l-2 border-yellow-400 text-yellow-800 text-xs p-2 mb-2 italic line-clamp-3">
                "{comment.quoteText}"
              </div>
            )}
            
            {comment.imageCode && (
              <div className="bg-slate-100 text-slate-600 text-xs p-1.5 mb-2 rounded font-mono flex items-center gap-1">
                <span className="text-[10px]">🖼️</span> Hình ảnh: {comment.imageCode}
              </div>
            )}
            
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
