import { useQuery } from '@tanstack/react-query'
import {
  aiFeatureService,
  AI_FEATURE_TASKS,
  AiFeatureTask
} from '@/services/aiFeatureService'

export { AI_FEATURE_TASKS }
export type { AiFeatureTask }

/**
 * Hook trạng thái tính năng AI cho giao diện người dùng.
 *
 * Pattern React Query: queryKey ['ai-features'], cache 5 phút.
 * FE nên FAIL-CLOSED: khi chưa tải xong / endpoint lỗi → coi như feature CHƯA bật.
 */
export function useAiFeatures() {
  return useQuery<Record<AiFeatureTask, boolean>>({
    queryKey: ['ai-features'],
    queryFn: () => aiFeatureService.getFeatures(),
    staleTime: 1000 * 60 * 5, // 5 phút
    retry: 1,
  })
}
