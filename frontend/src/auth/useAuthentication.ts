import { useContext } from "react";
import { AuthenticationContext } from "./AuthenticationContext";

export function useAuthentication() {
  const authentication = useContext(AuthenticationContext);
  if (!authentication) {
    throw new Error(
      "useAuthentication must be used within AuthenticationProvider",
    );
  }
  return authentication;
}
