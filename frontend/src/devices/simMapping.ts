export function simMappingLabel(channel: number, ar: boolean): string {
  if (!Number.isInteger(channel) || channel < 1 || channel > 16)
    return ar ? "ربط SIM غير محدد" : "SIM mapping unavailable";
  const address = Math.floor((channel - 1) / 4) + 1;
  const input = ((channel - 1) % 4) + 1;
  return ar
    ? `SIM ${address} · المدخل ${input} · القناة ${channel}`
    : `SIM ${address} · Input ${input} · Channel ${channel}`;
}
