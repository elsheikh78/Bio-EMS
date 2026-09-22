import { useCallback } from "react";
import { BackupRestorePanel } from "../backup/BackupRestorePanel";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";

export function SystemOwnerBackupRestorePage() {
  const { apiClient } = usePlatformAuthentication();
  const request = useCallback(
    (path: string, options?: RequestInit) =>
      apiClient.request(path as `/${string}`, {
        ...options,
        auth: "protected",
      }),
    [apiClient],
  );
  return (
    <BackupRestorePanel
      basePath="/platform-operations/backups"
      restoreJobsPath="/platform-operations"
      disasterRecovery
      request={request}
    />
  );
}
