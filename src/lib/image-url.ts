const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Đổi đường dẫn ảnh lưu trong DB thành URL trình duyệt tải được.
 * - "/uploads/..." là ảnh do BE phục vụ -> thêm host của API.
 * - URL tuyệt đối (http/https) và đường dẫn khác ("/images/...", public của FE) giữ nguyên.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
}

/** Ảnh từ API local (localhost/IP riêng) không đi qua optimizer của Next. */
export function isLocalImage(src: string): boolean {
  return /^https?:\/\/(localhost|127\.|10\.|192\.168\.)/.test(src);
}
