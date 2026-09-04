export type AiJobStatus = 'QUEUED' | 'PROCESSING' | 'RETRYING' | 'COMPLETED' | 'FAILED'

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
