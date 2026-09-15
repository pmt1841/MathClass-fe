export type AiJobStatus = 'QUEUED' | 'PROCESSING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface AiJobCancelResponse {
  jobId: string
  status: AiJobStatus
  cancelled: boolean
  refunded: boolean
  refundedCredits: number
  code?: 'SUCCESS' | 'ALREADY_PROCESSING' | 'CANCELLED_WITHOUT_REFUND' | 'COMPLETED' | 'ALREADY_CANCELLED' | string
  message: string
}

export interface AiJobSubmitResponse {
  jobId: string
  taskCode: string
  status: AiJobStatus
  createdAt: string
  message: string
}

export interface AiJobResultResponse<T = unknown> {
  jobId: string
  userId?: number
  taskCode: string
  status: AiJobStatus
  result?: T
  errorMessage?: string
  retryCount: number
  reservedCredits?: number
  createdAt: string
  completedAt?: string
}

export interface AiJobEventPayload<T = unknown> {
  eventType: 'AI_JOB_COMPLETED' | 'AI_JOB_FAILED'
  jobId: string
  taskCode: string
  status: AiJobStatus
  result?: T
  errorMessage?: string
}
