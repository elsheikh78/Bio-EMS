import { useCallback } from "react";
import { BackupRestorePanel } from "../backup/BackupRestorePanel";
import { useAuthentication } from "../auth/useAuthentication";

export function BackupRestorePage() {
  const { protectedRequest } = useAuthentication();
  const request = useCallback(
    (path: string, options?: RequestInit) =>
      protectedRequest(path as `/${string}`, options),
    [protectedRequest],
  );
  return <BackupRestorePanel basePath="/platform-backups" request={request} />;
}
