import { gql } from "./cart";

export interface AdminUnit {
  code: string;
  name: string;
  type: string;
}

// Danh mục gần như không đổi: cache theo phiên trang, mỗi tỉnh chỉ tải phường một lần.
let provincesCache: Promise<AdminUnit[]> | null = null;
const wardsCache = new Map<string, Promise<AdminUnit[]>>();

function cached<T>(promise: Promise<T>, onError: () => void): Promise<T> {
  return promise.catch((error: unknown) => {
    onError(); // lỗi mạng: lần sau thử lại
    throw error;
  });
}

export function fetchProvinces(): Promise<AdminUnit[]> {
  provincesCache ??= cached(
    gql<{ provinces: AdminUnit[] }>(`{ provinces { code name type } }`).then((d) => d.provinces),
    () => {
      provincesCache = null;
    },
  );
  return provincesCache;
}

export function fetchWards(provinceCode: string): Promise<AdminUnit[]> {
  let pending = wardsCache.get(provinceCode);
  if (!pending) {
    pending = cached(
      gql<{ wards: AdminUnit[] }>(
        `query Wards($provinceCode: ID!) { wards(provinceCode: $provinceCode) { code name type } }`,
        { provinceCode },
      ).then((d) => d.wards),
      () => wardsCache.delete(provinceCode),
    );
    wardsCache.set(provinceCode, pending);
  }
  return pending;
}

/** So khớp không dấu: "ben thanh" khớp "Phường Bến Thành", "da nang" khớp "Đà Nẵng". */
export function normalizeVi(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
