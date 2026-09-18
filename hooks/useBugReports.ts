import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  bugReportService,
  BugReportResponse,
  BugReportStatus,
  BugErrorType,
  PageResponse,
} from '@/services/bugReportService'

interface UseBugReportsParams {
  errorType?: BugErrorType
  status?: BugReportStatus
  startDate?: string
  endDate?: string
  page: number
  size: number
}

export function useBugReports({ errorType, status, startDate, endDate, page, size }: UseBugReportsParams) {
  return useQuery<PageResponse<BugReportResponse>>({
    queryKey: ['bug-reports', errorType, status, startDate, endDate, page, size],
    queryFn: async () => {
      const res = await bugReportService.getReports({
        errorType,
        status,
        startDate,
        endDate,
        page,
        size,
      })
      const data: PageResponse<BugReportResponse> = res?.result || res
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useUpdateBugReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: BugReportStatus }) =>
      bugReportService.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] })
    },
  })
}
