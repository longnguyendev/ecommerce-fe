/** Một màu của sản phẩm (lấy từ biến thể) kèm ảnh riêng của màu đó. */
export type ColorOption = {
  name: string;
  hex: string;
  images: string[];
  /** Giá thấp nhất trong các biến thể đang bán của màu này. */
  price?: number;
  compareAt?: number | null;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAt: number | null;
  rating: number | null;
  reviews: number;
  images: string[];
  colors: string[];
  colorOptions?: ColorOption[];
  badge: string | null;
  description?: string | null;
  /** Slug các bộ sưu tập chứa sản phẩm. */
  collections?: string[];
};

/* ---------------------------------------------------------------- prices */

/** Deterministic — never rely on Intl between server and client. */
export function formatPrice(value: number): string {
  return (
    Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫"
  );
}

export function priceMax(products: Product[]): number {
  return products.length ? Math.max(...products.map((p) => p.price)) : 0;
}

/* ---------------------------------------------------------------- colours */

const PALETTE: { name: string; hex: string }[] = [
  { name: "Beige", hex: "#D8C3A5" },
  { name: "Black", hex: "#181815" },
  { name: "Blue", hex: "#3A6BC4" },
  { name: "Brown", hex: "#6B4A32" },
  { name: "Green", hex: "#5B7F5B" },
  { name: "Grey", hex: "#9A9A92" },
  { name: "Orange", hex: "#DE8A3C" },
  { name: "Pink", hex: "#E0A0B4" },
  { name: "Purple", hex: "#7A5BA8" },
  { name: "Red", hex: "#BF3B30" },
  { name: "Tan", hex: "#C8A97E" },
  { name: "White", hex: "#F2F1EC" },
  { name: "Yellow", hex: "#E3C24B" },
];

function parseColor(input?: string): { r: number; g: number; b: number } | null {
  if (!input) return null;
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  return null;
}

/** Map a scraped CSS colour to the nearest of the site's 13 swatch names. */
export function colorName(css?: string): string {
  const c = parseColor(css);
  if (!c) return "Khác";
  let best = PALETTE[0];
  let bestD = Infinity;
  for (const p of PALETTE) {
    const q = parseColor(p.hex)!;
    const d = (c.r - q.r) ** 2 * 0.3 + (c.g - q.g) ** 2 * 0.59 + (c.b - q.b) ** 2 * 0.11;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best.name;
}

export const SWATCH_HEX = Object.fromEntries(PALETTE.map((p) => [p.name, p.hex]));

/* ------------------------------------------------------------------ kinds */

const KIND_RULES: [RegExp, string][] = [
  [/bra/i, "Bra"],
  [/leggings/i, "Leggings"],
  [/váy|skirt/i, "Chân váy"],
  [/set/i, "Set"],
  [/áo|top|jacket|cover/i, "Áo"],
];

export function kindOf(p: Product): string {
  if (p.category) return p.category;
  for (const [re, kind] of KIND_RULES) if (re.test(p.name)) return kind;
  return "Khác";
}

export function kindsOf(products: Product[]) {
  const counts = new Map<string, number>();
  for (const p of products) {
    const k = kindOf(p);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function colorNamesOf(products: Product[]) {
  const seen = new Map<string, number>();
  for (const p of products) {
    for (const c of p.colors) {
      const n = colorName(c);
      seen.set(n, (seen.get(n) || 0) + 1);
    }
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

/* --------------------------------------------------------------- helpers */

export const NAV = [
  { href: "/products", label: "Cửa hàng" },
  { href: "/products", label: "Tất cả sản phẩm" },
];
