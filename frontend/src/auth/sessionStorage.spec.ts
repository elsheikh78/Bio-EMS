import { describe, expect, it, vi } from "vitest";
import type { LoginResponse } from "./contracts";
import {
  AUTHENTICATION_SESSION_KEY,
  createAuthenticationStorageAdapter,
  createStoredAuthenticationSession,
  type StoredAuthenticationSession,
} from "./sessionStorage";

const loginResponse: LoginResponse = {
  access_token: "opaque-token",
  token_type: "bearer",
  expires_in: 37,
  user: { id: 1, username: "admin", role: "ADMIN" },
};

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("versioned authentication session storage", () => {
  it("derives expiry from the response instead of a fixed token lifetime", () => {
    expect(createStoredAuthenticationSession(loginResponse, 1_000)).toEqual({
      version: 1,
      accessToken: "opaque-token",
      tokenType: "bearer",
      expiresAt: 38_000,
      user: { id: 1, username: "admin", role: "ADMIN" },
    });
  });

  it("writes and reads back the exact versioned record", () => {
    const storage = new MemoryStorage();
    const adapter = createAuthenticationStorageAdapter(
      () => storage,
      () => 1_000,
    );
    const session = createStoredAuthenticationSession(loginResponse, 1_000);

    expect(adapter.write(session)).toBe(true);
    expect(adapter.read()).toEqual(session);
    expect(JSON.parse(storage.getItem(AUTHENTICATION_SESSION_KEY)!)).toEqual(
      session,
    );
  });

  it.each([
    ["malformed", "{"],
    ["partial", JSON.stringify({ version: 1 })],
    [
      "unknown version",
      JSON.stringify({
        ...createStoredAuthenticationSession(loginResponse, 1_000),
        version: 2,
      }),
    ],
    [
      "unexpected field",
      JSON.stringify({
        ...createStoredAuthenticationSession(loginResponse, 1_000),
        secret: "unexpected",
      }),
    ],
    [
      "expired",
      JSON.stringify({
        ...createStoredAuthenticationSession(loginResponse, 1_000),
        expiresAt: 999,
      }),
    ],
  ])("rejects and clears a %s record", (_case, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(AUTHENTICATION_SESSION_KEY, raw);
    const adapter = createAuthenticationStorageAdapter(
      () => storage,
      () => 1_000,
    );

    expect(adapter.read()).toBeUndefined();
    expect(storage.getItem(AUTHENTICATION_SESSION_KEY)).toBeNull();
  });

  it("fails closed when storage cannot be accessed", () => {
    const adapter = createAuthenticationStorageAdapter(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const session = createStoredAuthenticationSession(
      loginResponse,
      Date.now(),
    );

    expect(adapter.read()).toBeUndefined();
    expect(adapter.write(session)).toBe(false);
    expect(() => adapter.clear()).not.toThrow();
  });

  it("fails closed when storage does not return the value that was written", () => {
    const storage = new MemoryStorage();
    vi.spyOn(storage, "getItem").mockReturnValueOnce(null);
    const adapter = createAuthenticationStorageAdapter(
      () => storage,
      () => 1_000,
    );
    const session: StoredAuthenticationSession =
      createStoredAuthenticationSession(loginResponse, 1_000);

    expect(adapter.write(session)).toBe(false);
    expect(storage.getItem(AUTHENTICATION_SESSION_KEY)).toBeNull();
  });

  it("removes a value when read-back verification returns a different session", () => {
    const storage = new MemoryStorage();
    const session = createStoredAuthenticationSession(loginResponse, 1_000);
    const differentSession = { ...session, accessToken: "different-token" };
    vi.spyOn(storage, "getItem").mockReturnValueOnce(
      JSON.stringify(differentSession),
    );
    const adapter = createAuthenticationStorageAdapter(
      () => storage,
      () => 1_000,
    );

    expect(adapter.write(session)).toBe(false);
    expect(storage.getItem(AUTHENTICATION_SESSION_KEY)).toBeNull();
  });

  it.each([
    [
      "invalid",
      {
        ...createStoredAuthenticationSession(loginResponse, 1_000),
        version: 2,
      },
    ],
    [
      "expired",
      {
        ...createStoredAuthenticationSession(loginResponse, 1_000),
        expiresAt: 999,
      },
    ],
  ])(
    "clears an existing usable record when a %s write is rejected",
    (_case, rejected) => {
      const storage = new MemoryStorage();
      const existing = createStoredAuthenticationSession(loginResponse, 1_000);
      storage.setItem(AUTHENTICATION_SESSION_KEY, JSON.stringify(existing));
      const adapter = createAuthenticationStorageAdapter(
        () => storage,
        () => 1_000,
      );

      expect(adapter.write(rejected as StoredAuthenticationSession)).toBe(
        false,
      );
      expect(storage.getItem(AUTHENTICATION_SESSION_KEY)).toBeNull();
    },
  );
});
