
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

let accessToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function getAccessToken(): Promise<string | null> {
  return accessToken ?? refreshAccessToken();
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshRequest) {
    refreshRequest = fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      },
    )
      .then(async (response) => {
        if (!response.ok) return null;

        const result = (await response.json()) as {
          accessToken?: string;
        };

        accessToken = result.accessToken ?? null;
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, headers, ...requestOptions } = options;

  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const url = `${baseUrl}/${normalizedEndpoint}`;

  const makeRequest = (token: string | null) => {
    const requestHeaders = new Headers(headers);

    if (body !== undefined && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    } else {
      requestHeaders.delete("Authorization");
    }

    return fetch(url, {
      ...requestOptions,
      credentials: "include",
      headers: requestHeaders,
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });
  };

  let response = await makeRequest(accessToken);

  const isRefreshEndpoint = normalizedEndpoint.endsWith("auth/refresh");

  if (response.status === 401 && !isRefreshEndpoint) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await makeRequest(refreshedToken);
    }
  }

  const contentType = response.headers.get("content-type") ?? "";

  const data: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
