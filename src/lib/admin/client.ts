const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "eql-admin-token";
const REFRESH_KEY = "eql-admin-refresh";

export const apiUrl = API_URL;

/* ---------------------------------------------------------------- auth */

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

/** Backwards-compatible alias. */
export function clearToken(): void {
  clearTokens();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.assign("/admin/login");
  }
}

/* ------------------------------------------------------------- graphql */

interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data: T | null;
  errors?: GraphQLError[];
}

async function post<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  token: string | null,
): Promise<GraphQLResponse<T>> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()) as GraphQLResponse<T>;
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (refreshing) return refreshing;

  refreshing = (async () => {
    try {
      const json = await post<{
        refreshToken: { accessToken: string; refreshToken: string };
      }>(
        `mutation Refresh($token: String!) {
          refreshToken(refreshToken: $token) { accessToken refreshToken }
        }`,
        { token: refreshToken },
        null,
      );
      const data = json.data?.refreshToken;
      if (!data?.accessToken) return false;
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  let json = await post<T>(query, variables, getToken());

  const unauth = json.errors?.some((e) => e.extensions?.code === "UNAUTHENTICATED");
  if (unauth) {
    const ok = await refreshAccessToken();
    if (ok) {
      json = await post<T>(query, variables, getToken());
    } else {
      clearTokens();
      redirectToLogin();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (json.data === null || json.data === undefined) {
    throw new Error("Empty GraphQL response");
  }
  return json.data;
}

/* -------------------------------------------------------------- upload */

export async function uploadImage(file: File): Promise<string> {
  const doUpload = async (token: string | null) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/uploads/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = (await res.json()) as { url?: string; message?: string };
    return { ok: res.ok, status: res.status, json };
  };

  let result = await doUpload(getToken());
  if (result.status === 401) {
    const ok = await refreshAccessToken();
    if (!ok) {
      clearTokens();
      redirectToLogin();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    result = await doUpload(getToken());
  }

  if (!result.ok || !result.json.url) {
    throw new Error(result.json.message ?? "Upload ảnh thất bại");
  }
  // Lưu đường dẫn tương đối (/uploads/products/...) để không phụ thuộc host; hiển thị qua resolveImageUrl.
  return result.json.url;
}

export { resolveImageUrl } from "@/lib/image-url";

/* ---------------------------------------------------------------- types */

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  status: ProductStatus;
  category: { name: string };
  variants: { price: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string | null;
  role: string;
}
