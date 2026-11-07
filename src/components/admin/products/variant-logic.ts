import { slugify } from "@/lib/slugify";

export interface Attribute {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}
export interface VariantAttr {
  attribute: { id: string; name: string };
  attributeValue: { id: string; value: string };
}
export interface Variant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  attributes: VariantAttr[];
  images: { url: string }[];
}

/** Một thuộc tính đang dùng + danh sách giá trị (text) của nó. */
export interface Option {
  attributeId: string;
  values: string[];
  draft: string;
}
export interface RowData {
  sku: string;
  price: string;
  stock: string;
  /** Ảnh đại diện của biến thể (URL), "" = không có. */
  image: string;
}
export interface Combo {
  key: string;
  label: string;
  options: { attributeId: string; value: string }[];
}


export const VARIANT_FIELDS = `
  id sku price compareAtPrice stockQuantity isActive
  attributes { attribute { id name } attributeValue { id value } }
  images { url }
`;


export const DEFAULT_KEY = "__default__";

export interface DraftVariant {
  sku: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  imageUrl: string | null;
  options: { attributeId: string; value: string }[];
}
/** Kết quả dựng biến thể để lưu (dùng cho chế độ tạo sản phẩm mới). */
export type DraftResult = { variants: DraftVariant[] } | { error: string };

export function comboKey(opts: { attributeId: string; value: string }[]): string {
  if (opts.length === 0) return DEFAULT_KEY;
  return opts
    .map((o) => `${o.attributeId}:${o.value}`)
    .sort()
    .join("|");
}

/** Tích Descartes các option -> danh sách tổ hợp biến thể. */
export function buildCombos(options: Option[]): Combo[] {
  const active = options.filter((o) => o.attributeId && o.values.length > 0);
  if (active.length === 0) return [];
  let acc: { attributeId: string; value: string }[][] = [[]];
  for (const opt of active) {
    acc = acc.flatMap((prefix) =>
      opt.values.map((value) => [
        ...prefix,
        { attributeId: opt.attributeId, value },
      ]),
    );
  }
  return acc.map((opts) => ({
    key: comboKey(opts),
    label: opts.map((o) => o.value).join(" / "),
    options: opts,
  }));
}

export const EMPTY_ROW: RowData = { sku: "", price: "", stock: "0", image: "" };

/**
 * Lấy dữ liệu dòng cho một tổ hợp. Nếu chưa có dòng khớp chính xác (vì vừa thêm/bớt
 * thuộc tính làm đổi khoá tổ hợp), kế thừa từ dòng cũ gần nhất:
 * - dòng cũ có các phần là tập con của tổ hợp mới (thêm thuộc tính) -> giữ giá/tồn,
 *   SKU thêm hậu tố giá trị mới để không trùng;
 * - dòng cũ là tập cha của tổ hợp mới (bớt thuộc tính) -> giữ nguyên dòng đầu tiên.
 */
export function resolveRow(rows: Record<string, RowData>, combo: Combo): RowData {
  const exact = rows[combo.key];
  if (exact) return exact;

  const parts = new Set(combo.key.split("|"));
  let best: { key: string; size: number } | null = null;
  let superset: string | null = null;

  for (const k of Object.keys(rows)) {
    if (k === DEFAULT_KEY) continue;
    const oldParts = k.split("|");
    if (oldParts.every((x) => parts.has(x))) {
      if (!best || oldParts.length > best.size) {
        best = { key: k, size: oldParts.length };
      }
    } else if (!superset && combo.key !== DEFAULT_KEY) {
      const oldSet = new Set(oldParts);
      if ([...parts].every((x) => oldSet.has(x))) superset = k;
    }
  }

  if (best) {
    const old = rows[best.key];
    const oldSet = new Set(best.key.split("|"));
    const extra = combo.options
      .filter((o) => !oldSet.has(`${o.attributeId}:${o.value}`))
      .map((o) => o.value)
      .join(" ");
    return {
      ...old,
      sku: old.sku && extra ? `${old.sku}-${slugify(extra)}` : old.sku,
    };
  }
  if (superset) return rows[superset];
  if (rows[DEFAULT_KEY]) {
    return { ...rows[DEFAULT_KEY], sku: "" };
  }
  return EMPTY_ROW;
}

export function formatVnd(v: string): string {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" ? `${n.toLocaleString("vi-VN")} đ` : "";
}

export const DEFAULT_COMBO: Combo = {
  key: DEFAULT_KEY,
  label: "Mặc định",
  options: [],
};

