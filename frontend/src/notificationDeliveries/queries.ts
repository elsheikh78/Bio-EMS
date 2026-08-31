import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import {
  notificationDeliveriesEnvelopeSchema,
  type DeliveryStatus,
} from "./contracts";

export function useNotificationDeliveries(
  siteId?: number,
  status?: DeliveryStatus,
) {
  const { protectedRequest } = useAuthentication();
  return useQuery({
    queryKey: ["notification-deliveries", siteId, status],
    enabled: Boolean(siteId),
    refetchInterval: 15_000,
    queryFn: async () => {
      const filter = status ? `&status=${status}` : "";
      const value = await protectedRequest<unknown>(
        `/notification-deliveries?site_id=${siteId}&limit=200${filter}`,
      );
      return notificationDeliveriesEnvelopeSchema.parse(value).deliveries;
    },
  });
}
