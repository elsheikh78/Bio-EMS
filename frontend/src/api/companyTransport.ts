function encode(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) result += String.fromCharCode(byte);
  return btoa(result);
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
export function companyCloudMode(): boolean {
  return import.meta.env.VITE_COMPANY_CLOUD === "true";
}
export async function companyRequest(
  path: string,
  options: RequestInit,
): Promise<Response> {
  const stored = window.sessionStorage.getItem("bioems.company.selected-site");
  if (!stored) throw new Error("Select a site in the company portal first");
  const selected = JSON.parse(stored) as { id: string; publicKey: JsonWebKey };
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(selected.id))
    throw new Error("Invalid selected site");
  if (options.body !== undefined && typeof options.body !== "string")
    throw new Error("File transfer is not available in the cloud pilot");
  const commandId = crypto.randomUUID();
  const aad = new TextEncoder().encode(`${selected.id}:${commandId}`);
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    selected.publicKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = JSON.stringify({
    path,
    method: options.method || "GET",
    authorization:
      new Headers(options.headers).get("Authorization") || undefined,
    body: options.body,
    expiresAt: Date.now() + 110_000,
  });
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    key,
    new TextEncoder().encode(payload),
  );
  const wrapped = await crypto.subtle.encrypt("RSA-OAEP", publicKey, rawKey);
  const base = `/api/company/sites/${selected.id}/commands`;
  const queued = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: commandId,
      envelope: {
        key: encode(new Uint8Array(wrapped)),
        iv: encode(iv),
        ciphertext: encode(new Uint8Array(encrypted)),
      },
    }),
    signal: options.signal,
  });
  if (!queued.ok) return queued;
  const deadline = Date.now() + 110_000;
  while (Date.now() < deadline) {
    if (options.signal?.aborted)
      throw new DOMException(
        "Request aborted; verify local state before retrying",
        "AbortError",
      );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await fetch(`${base}/${commandId}`, {
      signal: options.signal,
    });
    if (!response.ok) return response;
    const result = (await response.json()) as {
      state: string;
      result?: { iv: string; ciphertext: string };
    };
    if (result.state === "expired") break;
    if (result.state === "completed" && result.result) {
      const bytes = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: decode(result.result.iv),
          additionalData: new TextEncoder().encode(
            `${selected.id}:${commandId}:response`,
          ),
        },
        key,
        decode(result.result.ciphertext),
      );
      const local = JSON.parse(new TextDecoder().decode(bytes)) as {
        status: number;
        body: string;
        contentType: string;
      };
      return new Response(
        [204, 205, 304].includes(local.status) ? null : decode(local.body),
        {
          status: local.status,
          headers: { "Content-Type": local.contentType },
        },
      );
    }
  }
  throw new Error("Remote result unknown. Check site state before retrying.");
}
