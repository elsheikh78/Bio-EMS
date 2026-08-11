import type { PropsWithChildren } from "react";
import { localizationDefaults } from "./resources";

export function LocalizationProvider({ children }: PropsWithChildren) {
  return <div dir={localizationDefaults.direction}>{children}</div>;
}
