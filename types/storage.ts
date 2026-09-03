export interface StorageCleanupStatus {
  enabled: boolean;
  cronExpression: string;
  gracePeriodHours: number;
  lastRunAt: string | null;
  lastRunResult?: StorageCleanupResponse | null;
}

export interface StorageCleanupRequest {
  gracePeriodHours?: number;
  dryRun?: boolean;
}

export interface UpdateStorageCleanupConfigRequest {
  enabled: boolean;
  cronExpression: string;
  gracePeriodHours: number;
}

export interface StorageCleanupResponse {
  scannedBuckets: string[];
  totalFilesScanned: number;
  orphanFilesDetected: number;
  filesDeletedSuccessfully: number;
  failedDeletions: number;
  executionTimeMs: number;
  dryRun: boolean;
  completedAt: string;
}
