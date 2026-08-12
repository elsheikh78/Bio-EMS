import { getEnvironment } from "../config/environment";
import { backendErrorEnvelopeSchema } from "../auth/contracts";

export type ApiRequestMode = "public" | "protected";

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
  auth?: ApiRequestMode;
}

export interface ApiClient {
  request<T>(path: `/${string}`, options?: ApiRequestOptions): Promise<T>;
}

export interface ApiClientConfiguration {
  getAccessToken?: () => string | undefined;
  onProtectedUnauthorized?: () => void | Promise<void>;
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: ApiRequestOptions = {},
) {
  return defaultApiClient.request<T>(path, options);
}

export function createApiClient(
  configuration: ApiClientConfiguration = {},
): ApiClient {
  return {
    request: (path, options = {}) => request(path, options, configuration),
  };
}

async function request<T>(
  path: `/${string}`,
  options: ApiRequestOptions,
  configuration: ApiClientConfiguration,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (headers.has("Authorization")) {
    throw new ApiRequestConfigurationError(
      "Caller-supplied Authorization is not allowed",
    );
  }

  const mode = options.auth ?? "public";
  if (mode === "protected") {
    const token = configuration.getAccessToken?.();
    if (!token) {
      throw new ApiRequestConfigurationError(
        "A protected request requires an authenticated session",
      );
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const requestOptions: RequestInit = { ...options };
  delete (requestOptions as { auth?: ApiRequestMode }).auth;
  const response = await fetch(`${getEnvironment().VITE_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (!response.ok) {
    const envelope = await readErrorEnvelope(response);
    if (mode === "protected" && response.status === 401) {
      await configuration.onProtectedUnauthorized?.();
    }
    throw new ApiResponseError(response.status, envelope?.error.code);
  }

  return (await response.json()) as T;
}

async function readErrorEnvelope(response: Response) {
  try {
    return backendErrorEnvelopeSchema.safeParse(await response.json()).data;
  } catch {
    return undefined;
  }
}

export class ApiResponseError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(status: number, code?: string) {
    super("API request failed");
    this.name = "ApiResponseError";
    this.status = status;
    this.code = code;
  }
}

export class ApiRequestConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestConfigurationError";
  }
}

const defaultApiClient = createApiClient();
