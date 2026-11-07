import type { Product } from "@/lib/catalog";
import { resolveImageUrl } from "@/lib/image-url";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const COLOR_NAME_HEX: Record<string, string> = {
  Đen: "#181815",
  Trắng: "#F2F1EC",
  Be: "#D8C3A5",
  "Xanh dương": "#3A6BC4",
  Nâu: "#6B4A32",
  Xám: "#9A9A92",
  "Xanh lá": "#5B7F5B",
  Cam: "#DE8A3C",
  Hồng: "#E0A0B4",
  Tím: "#7A5BA8",
  Đỏ: "#BF3B30",
  Vàng: "#E3C24B",
  Kem: "#C8A97E",
};

// Tên màu thực tế hay dài ("Xanh Navy Khói", "Vàng Chanh"): khớp chính xác trước,
// không có thì tìm từ khoá (từ dài/cụ thể trước).
const COLOR_KEYWORDS: [string, string][] = [
  ["xanh dương", "#3A6BC4"],
  ["xanh lá", "#5B7F5B"],
  ["xanh navy", "#1B2A4A"],
  ["navy", "#1B2A4A"],
  ["coban", "#0047AB"],
  ["cổ vịt", "#2D5A4F"],
  ["rêu", "#8A9A5B"],
  ["moss", "#8A9A5B"],
  ["pastel", "#C8E6C9"],
  ["baby", "#89CFF0"],
  ["lơ", "#2A9DD6"],
  ["trời", "#1E54B7"],
  ["chanh", "#E5E58E"],
  ["cherry", "#DE3163"],
  ["ruby", "#9B111E"],
  ["dâu", "#FC5A8D"],
  ["kaki", "#C3B091"],
  ["cát", "#C2B280"],
  ["bơ", "#FFF8DC"],
  ["đen", "#181815"],
  ["trắng", "#F2F1EC"],
  ["kem", "#E8DDB5"],
  ["nâu", "#6B4A32"],
  ["xám", "#9A9A92"],
  ["cam", "#DE8A3C"],
  ["hồng", "#E0A0B4"],
  ["tím", "#7A5BA8"],
  ["đỏ", "#BF3B30"],
  ["vàng", "#E3C24B"],
  ["be", "#D8C3A5"],
  ["xanh", "#3A6BC4"],
];

export function colorHex(name: string | null | undefined): string | null {
  if (!name) return null;
  if (COLOR_NAME_HEX[name]) return COLOR_NAME_HEX[name];
  const lower = name.toLowerCase();
  for (const [key, hex] of COLOR_KEYWORDS) {
    if (lower.includes(key)) return hex;
  }
  return null;
}

interface GraphQLResponse<T> {
  data: T | null;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("Empty GraphQL response");
  return json.data;
}

interface GqlAttribute {
  attribute: { name: string };
  attributeValue: { value: string };
}
interface GqlVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  attributes: GqlAttribute[];
  images?: { url: string }[];
}
interface GqlProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  category: { name: string };
  images: { url: string; isPrimary: boolean; variantId?: string | null }[];
  variants: GqlVariant[];
}

export interface StoreVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  size: string | null;
  color: string | null;
}

export function mapVariant(v: GqlVariant): StoreVariant {
  const size = v.attributes.find((a) => a.attribute.name === "Size");
  const color = v.attributes.find((a) => a.attribute.name === "Màu sắc");
  return {
    id: v.id,
    sku: v.sku,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    stockQuantity: v.stockQuantity,
    isActive: v.isActive,
    size: size?.attributeValue.value ?? null,
    color: color?.attributeValue.value ?? null,
  };
}

export function mapProduct(p: GqlProduct): Product {
  const activeVariants = p.variants.filter((v) => v.isActive);
  const first = activeVariants[0] ?? p.variants[0];

  // Mỗi màu = các biến thể cùng màu; ảnh riêng của màu lấy từ ảnh của các biến thể đó,
  // giá = giá thấp nhất trong các biến thể đang bán của màu.
  const byColor = new Map<
    string,
    { images: string[]; price?: number; compareAt?: number | null }
  >();
  for (const v of p.variants) {
    const name = v.attributes.find((a) => a.attribute.name === "Màu sắc")?.attributeValue.value;
    if (!name) continue;
    const entry = byColor.get(name) ?? { images: [] };
    for (const img of v.images ?? []) {
      if (!entry.images.includes(img.url)) entry.images.push(img.url);
    }
    if (v.isActive && (entry.price === undefined || v.price < entry.price)) {
      entry.price = v.price;
      entry.compareAt = v.compareAtPrice;
    }
    byColor.set(name, entry);
  }
  const colorOptions = [...byColor.entries()].map(([name, e]) => ({
    name,
    hex: colorHex(name) ?? "#cccccc",
    images: e.images.map(resolveImageUrl),
    price: e.price,
    compareAt: e.compareAt ?? null,
  }));

  // Thư viện ảnh chung = ảnh không gắn biến thể (nếu có).
  const shared = p.images.filter((i) => !i.variantId);
  const gallery = (shared.length > 0 ? shared : p.images).map((i) => resolveImageUrl(i.url));

  return {
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    price: first?.price ?? 0,
    compareAt: first?.compareAtPrice ?? null,
    rating: null,
    reviews: 0,
    images: gallery,
    colors: colorOptions.map((o) => o.hex),
    colorOptions,
    badge: null,
    description: p.description,
  };
}

const PRODUCT_FIELDS = `
  id name slug description thumbnail status
  category { name }
  images { url isPrimary variantId }
  variants { id sku price compareAtPrice stockQuantity isActive
    attributes { attribute { name } attributeValue { value } }
    images { url } }
`;

export async function fetchProducts(
  take = 100,
  skip = 0,
): Promise<{ products: Product[]; totalCount: number }> {
  const data = await gql<{
    products: { totalCount: number; nodes: GqlProduct[] };
  }>(
    `query Products($skip: Int!, $take: Int!) {
      products(pagination: { skip: $skip, take: $take }, filter: { status: ACTIVE }) {
        totalCount
        nodes { ${PRODUCT_FIELDS} }
      }
    }`,
    { skip, take: Math.min(take, 100) },
  );
  return {
    products: data.products.nodes.map(mapProduct),
    totalCount: data.products.totalCount,
  };
}

export async function fetchAllProducts(): Promise<Product[]> {
  const out: Product[] = [];
  let skip = 0;
  for (;;) {
    const { products, totalCount } = await fetchProducts(100, skip);
    out.push(...products);
    if (skip + 100 >= totalCount) break;
    skip += 100;
  }
  return out;
}

export async function fetchProductDetail(
  slug: string,
): Promise<{ product: Product; variants: StoreVariant[] } | null> {
  const data = await gql<{ productBySlug: GqlProduct | null }>(
    `query ProductBySlug($slug: String!) {
      productBySlug(slug: $slug) { ${PRODUCT_FIELDS} }
    }`,
    { slug },
  );
  if (!data.productBySlug) return null;
  return {
    product: mapProduct(data.productBySlug),
    variants: data.productBySlug.variants.filter((v) => v.isActive).map(mapVariant),
  };
}
