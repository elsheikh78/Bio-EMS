import { useContext } from "react";
import { PlatformAuthenticationContext } from "./context";

export function usePlatformAuthentication() {
  const value = useContext(PlatformAuthenticationContext);
  if (!value) {
    throw new Error(
      "usePlatformAuthentication must be used within PlatformAuthenticationProvider",
    );
  }
  return value;
}
