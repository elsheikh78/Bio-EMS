import { getEnvironment } from "../config/environment";

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: ApiRequestOptions = {},
) {
  const response = await fetch(`${getEnvironment().VITE_API_BASE_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });

  if (!response.ok) {
    throw new ApiResponseError(response.status);
  }

  return (await response.json()) as T;
}

export class ApiResponseError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("API request failed");
    this.name = "ApiResponseError";
    this.status = status;
  }
}
