import { z } from "zod";
import { authenticatedUserSchema, type LoginResponse } from "./contracts";

export const AUTHENTICATION_SESSION_KEY = "bio-ems.auth.session";

export const storedAuthenticationSessionSchema = z
  .object({
    version: z.literal(1),
    accessToken: z.string().min(1),
    tokenType: z.literal("bearer"),
    expiresAt: z.number().int().positive().safe(),
    user: authenticatedUserSchema,
  })
  .strict();

export type StoredAuthenticationSession = z.infer<
  typeof storedAuthenticationSessionSchema
>;

export interface AuthenticationStorageAdapter {
  clear(): void;
  read(): StoredAuthenticationSession | undefined;
  write(session: StoredAuthenticationSession): boolean;
}

export function createStoredAuthenticationSession(
  response: LoginResponse,
  responseReceivedAt: number,
): StoredAuthenticationSession {
  return storedAuthenticationSessionSchema.parse({
    version: 1,
    accessToken: response.access_token,
    tokenType: response.token_type,
    expiresAt: responseReceivedAt + response.expires_in * 1000,
    user: response.user,
  });
}

export function createAuthenticationStorageAdapter(
  getStorage: () => Storage = () => window.sessionStorage,
  now: () => number = Date.now,
): AuthenticationStorageAdapter {
  const clear = () => {
    try {
      getStorage().removeItem(AUTHENTICATION_SESSION_KEY);
    } catch {
      // A blocked storage backend is already a fail-closed state.
    }
  };

  const parse = (
    raw: string | null,
  ): StoredAuthenticationSession | undefined => {
    if (raw === null) return undefined;

    try {
      const result = storedAuthenticationSessionSchema.safeParse(
        JSON.parse(raw),
      );
      if (!result.success || result.data.expiresAt <= now()) {
        clear();
        return undefined;
      }
      return result.data;
    } catch {
      clear();
      return undefined;
    }
  };

  return {
    clear,
    read() {
      try {
        return parse(getStorage().getItem(AUTHENTICATION_SESSION_KEY));
      } catch {
        clear();
        return undefined;
      }
    },
    write(session) {
      const validation = storedAuthenticationSessionSchema.safeParse(session);
      if (!validation.success || validation.data.expiresAt <= now()) {
        clear();
        return false;
      }

      try {
        const serialized = JSON.stringify(validation.data);
        const storage = getStorage();
        storage.setItem(AUTHENTICATION_SESSION_KEY, serialized);
        const persisted = parse(storage.getItem(AUTHENTICATION_SESSION_KEY));
        const verified =
          persisted !== undefined && JSON.stringify(persisted) === serialized;
        if (!verified) clear();
        return verified;
      } catch {
        clear();
        return false;
      }
    },
  };
}
