"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImageCarousel } from "@/components/product/product-image-carousel";

const MAX_SWATCHES = 5;

export type CardSwatch = {
  name: string;
  hex: string;
  images: string[];
  priceText: string;
  compareAtText: string | null;
  discountPercent: number | null;
};

/**
 * Thẻ sản phẩm: bấm chấm màu để xem ảnh của màu đó (không chuyển trang);
 * bấm ảnh/tên để vào trang sản phẩm với màu đã chọn.
 */
export function ProductCardView({
  slug,
  name,
  images,
  badge,
  discountPercent,
  priceText,
  compareAtText,
  swatches,
}: {
  slug: string;
  name: string;
  images: string[];
  badge: string | null;
  discountPercent: number | null;
  priceText: string;
  compareAtText: string | null;
  swatches: CardSwatch[];
}) {
  const [selected, setSelected] = useState(0);
  const [touched, setTouched] = useState(false);

  const current = swatches[selected];
  // Màu chưa có ảnh riêng thì dùng thư viện ảnh chung của sản phẩm.
  const shownImages = current && current.images.length > 0 ? current.images : images;
  // Giá / giảm giá theo màu đang chọn (khớp với trang chi tiết).
  const shownPrice = current?.priceText ?? priceText;
  const shownCompareAt = current ? current.compareAtText : compareAtText;
  const shownDiscount = current ? current.discountPercent : discountPercent;
  const base = `/products/${slug}`;
  const href =
    touched && current ? `${base}?color=${encodeURIComponent(current.name)}` : base;

  return (
    <article className="group pb-1">
      <ProductImageCarousel
        key={`${selected}-${shownImages[0] ?? ""}`}
        images={shownImages}
        name={name}
        href={href}
        badge={badge}
        discountPercent={shownDiscount}
      />

      <div className="mt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 flex-1">
            <h2 className="line-clamp-1 text-[13px] font-normal text-foreground">
              {name}
            </h2>
          </Link>
          <span className="shrink-0 text-muted-foreground" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M17.6 3.3c1.1.1 1.9 1.1 1.9 2.2V21L12 17.2 4.5 21V5.5c0-1.1.8-2 1.9-2.2a48.5 48.5 0 0 1 11.2 0Z" />
            </svg>
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[13px] text-foreground">{shownPrice}</span>
          {shownCompareAt ? (
            <span className="text-[11.5px] text-[#999] line-through">
              {shownCompareAt}
            </span>
          ) : null}
        </div>

        {swatches.length > 0 ? (
          <div className="mt-1.5 flex items-center gap-1.5" role="group" aria-label="Màu sắc">
            {swatches.slice(0, MAX_SWATCHES).map((c, i) => (
              <button
                key={`${c.name}-${i}`}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={i === selected}
                onClick={() => {
                  setSelected(i);
                  setTouched(true);
                }}
                className={`h-3.5 w-3.5 rounded-full border border-border transition-shadow ${
                  i === selected
                    ? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
                    : "hover:ring-1 hover:ring-border hover:ring-offset-2 hover:ring-offset-background"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {swatches.length > MAX_SWATCHES ? (
              <span className="text-[11px] text-muted-foreground">
                +{swatches.length - MAX_SWATCHES}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
