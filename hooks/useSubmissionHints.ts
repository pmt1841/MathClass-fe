import { useState, useCallback } from 'react'
import { submissionHintApi, SubmissionHintItemDTO, StudentHintResponse } from '@/lib/api/submissionHint'

export function useSubmissionHints(submissionId?: number | null) {
  const [hints, setHints] = useState<SubmissionHintItemDTO[]>([])
  const [totalUsed, setTotalUsed] = useState<number>(0)
  const [remainingHints, setRemainingHints] = useState<number>(3)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRequesting, setIsRequesting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [latestHint, setLatestHint] = useState<StudentHintResponse | null>(null)

  const fetchHistory = useCallback(async (subId: number) => {
    if (!subId || typeof subId !== 'number' || subId <= 0 || isNaN(subId)) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await submissionHintApi.getHintHistory(subId)
      setHints(data.hints || [])
      setTotalUsed(data.totalUsed)
      setRemainingHints(data.remainingHints)
    } catch (e: any) {
      console.error('Failed to fetch hint history', e)
      setError(e.response?.data?.message || 'Không thể tải lịch sử gợi ý.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const requestHint = useCallback(async (assignmentId: number, currentContent: string): Promise<StudentHintResponse | null> => {
    setIsRequesting(true)
    setError(null)
    try {
      const res = await submissionHintApi.requestHint(assignmentId, currentContent)
      setLatestHint(res)
      setRemainingHints(res.remainingHints)
      setTotalUsed(res.hintNumber)

      // Append to local hint list
      const newItem: SubmissionHintItemDTO = {
        id: res.id,
        hintNumber: res.hintNumber,
        studentSnapshotContent: currentContent,
        aiHintContent: res.hintContent,
        createdAt: res.createdAt
      }
      setHints(prev => [...prev, newItem])
      return res
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Không thể gửi yêu cầu gợi ý lúc này. Vui lòng thử lại sau.'
      setError(msg)
      return null
    } finally {
      setIsRequesting(false)
    }
  }, [])

  return {
    hints,
    totalUsed,
    remainingHints,
    isLoading,
    isRequesting,
    error,
    latestHint,
    fetchHistory,
    requestHint
  }
}
