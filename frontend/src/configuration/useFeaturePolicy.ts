import { companyCloudMode } from "../api/companyTransport";
import { useEffect, useState } from "react";
import { useAuthentication } from "../auth/useAuthentication";
export const featureForPath: Record<string, string> = {
  "/reports": "reports",
  "/sensors-calibration": "calibration",
  "/backup-restore": "backups",
  "/system-update": "updates",
};
export function useFeaturePolicy() {
  const { protectedRequest } = useAuthentication();
  const [data, setData] = useState<Record<string, boolean>>();
  useEffect(() => {
    if (companyCloudMode()) return;
    let live = true;
    const load = async () => {
      try {
        const value =
          await protectedRequest<Record<string, boolean>>("/features");
        if (live) setData(value);
      } catch {
        /* Backend gates remain authoritative when the status request fails. */
      }
    };
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [protectedRequest]);
  return { data };
}
