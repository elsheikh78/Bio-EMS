import { controllerHealthLabel } from "./controllerHealthLabels";
import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
type HealthAlarm = {
  id: number;
  device: string;
  site: string;
  code: string;
  status: string;
  trigger_time: string;
};
export function ControllerHealthAlarms({
  canAcknowledge,
}: {
  canAcknowledge: boolean;
}) {
  const { protectedRequest } = useAuthentication();
  const { language } = useLocalization();
  const cache = useQueryClient();
  const [error, setError] = useState(false);
  const alarms = useQuery({
    queryKey: ["controller-health-alarms"],
    queryFn: () => protectedRequest<HealthAlarm[]>("/controller-health"),
    refetchInterval: 10000,
  });
  return (
    <Stack spacing={1}>
      <Typography variant="h6">
        {language === "ar"
          ? "إنذارات الكهرباء والتخزين — أولوية قصوى"
          : "Power and storage alarms — highest priority"}
      </Typography>
      {(alarms.isError || error) && (
        <Alert severity="warning">
          {language === "ar"
            ? "تعذر تحميل إنذارات Main"
            : "Main health alarms could not be loaded"}
        </Alert>
      )}
      {(alarms.data ?? [])
        .filter((a) => a.status !== "RECOVERED")
        .map((a) => (
          <Alert
            severity="error"
            key={a.id}
            action={
              canAcknowledge && a.status === "TRIGGERED" ? (
                <Button
                  onClick={() => {
                    void protectedRequest(
                      `/controller-health/${a.id}/acknowledge`,
                      { method: "POST" },
                    )
                      .then(() =>
                        cache.invalidateQueries({
                          queryKey: ["controller-health-alarms"],
                        }),
                      )
                      .catch(() => setError(true));
                  }}
                >
                  {language === "ar" ? "إقرار" : "Acknowledge"}
                </Button>
              ) : undefined
            }
          >
            CRITICAL — {a.site}/{a.device} —{" "}
            {controllerHealthLabel(a.code, language === "ar")} — {a.status} —{" "}
            {a.trigger_time}
          </Alert>
        ))}
    </Stack>
  );
}
