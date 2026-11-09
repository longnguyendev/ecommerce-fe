"use client";

import { useMemo, useState } from "react";

import { Reveal } from "@/components/shared/reveal";
import {
  colorName,
  colorNamesOf,
  formatPrice,
  kindOf,
  kindsOf,
  priceMax,
  SWATCH_HEX,
  type Product,
} from "@/lib/catalog";

import { ProductCard } from "./product-card";

const SORTS = [
  { value: "featured", label: "Nổi bật" },
  { value: "new", label: "Mới nhất" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function toggle<T>(set: Set<T>, v: T) {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-border py-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-foreground">{title}</span>
        <span className="text-muted-foreground transition-transform group-open:rotate-180">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

export function Catalog({ products }: { products: Product[] }) {
  const KINDS = useMemo(() => kindsOf(products), [products]);
  const COLOR_NAMES = useMemo(() => colorNamesOf(products), [products]);
  const PRICE_MAX = useMemo(() => priceMax(products), [products]);
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [saleOnly, setSaleOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(() => priceMax(products));
  const [sort, setSort] = useState<Sort>("featured");
  const [openMobile, setOpenMobile] = useState(false);

  const filtered = useMemo(() => {
    const out = products.filter((p) => {
      if (kinds.size && !kinds.has(kindOf(p))) return false;
      if (colors.size && !p.colors.some((c) => colors.has(colorName(c)))) return false;
      if (saleOnly && !p.compareAt) return false;
      if (p.price > maxPrice) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        return out.sort((a, b) => a.price - b.price);
      case "price-desc":
        return out.sort((a, b) => b.price - a.price);
      default:
        return out;
    }
  }, [products, kinds, colors, saleOnly, maxPrice, sort]);

  const active = kinds.size + colors.size + (saleOnly ? 1 : 0) + (maxPrice < PRICE_MAX ? 1 : 0);

  const reset = () => {
    setKinds(new Set());
    setColors(new Set());
    setSaleOnly(false);
    setMaxPrice(PRICE_MAX);
  };

  const sidebar = (
    <div>
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-foreground">Bộ lọc</span>
        {active > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Xoá ({active})
          </button>
        ) : null}
      </div>

      <Group title="Nổi bật">
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground">
          <input
            type="checkbox"
            checked={saleOnly}
            onChange={(e) => setSaleOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-foreground"
          />
          Đang giảm giá
        </label>
      </Group>

      <Group title="Loại sản phẩm">
        <ul className="space-y-2">
          {KINDS.map((k) => (
            <li key={k.name}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={kinds.has(k.name)}
                  onChange={() => setKinds((s) => toggle(s, k.name))}
                  className="h-3.5 w-3.5 accent-foreground"
                />
                <span className="flex-1">{k.name}</span>
                <span className="text-[10.5px] text-[#999]">{k.count}</span>
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Màu sắc">
        <div className="flex flex-wrap gap-2.5">
          {COLOR_NAMES.map((c) => {
            const on = colors.has(c.name);
            return (
              <button
                key={c.name}
                type="button"
                title={`${c.name} (${c.count})`}
                aria-label={c.name}
                aria-pressed={on}
                onClick={() => setColors((v) => toggle(v, c.name))}
                className={`h-6 w-6 rounded-full ring-1 ring-inset ring-black/15 ${
                  on ? "outline outline-1 outline-offset-2 outline-foreground" : ""
                }`}
                style={{ backgroundColor: SWATCH_HEX[c.name] }}
              />
            );
          })}
        </div>
      </Group>

      <Group title="Khoảng giá">
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={50000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-foreground"
        />
        <div className="mt-1.5 flex justify-between text-[10.5px] text-muted-foreground">
          <span>0 ₫</span>
          <span>{formatPrice(maxPrice)}</span>
        </div>
      </Group>
    </div>
  );

  return (
    <div className="container-page grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 pb-10">
          {sidebar}
        </div>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
            {filtered.length} sản phẩm
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenMobile((v) => !v)}
              className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] lg:hidden"
            >
              Bộ lọc{active ? ` (${active})` : ""}
            </button>
            <label className="flex items-center gap-2">
              <span className="hidden text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:block">
                Sắp xếp theo:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border border-border bg-background px-2 py-1.5 text-[12.5px] outline-none focus:border-foreground"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {openMobile ? (
          <div className="mb-6 border border-border bg-muted/50 p-4 lg:hidden">{sidebar}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <Reveal key={p.slug} index={i}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-border py-24 text-center">
            <p className="text-[14px]">Không có sản phẩm phù hợp</p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 text-[12.5px] text-muted-foreground underline underline-offset-4"
            >
              Xoá bộ lọc
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
