"use client";

import { useState } from "react";
import Link from "next/link";

import { ProductImageCarousel } from "@/components/product/product-image-carousel";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

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
  // Tên hiển thị kèm màu đang chọn: "Air Bra - Navy".
  const displayName = current ? `${name} - ${current.name}` : name;
  const base = `/products/${slug}`;
  const href = touched && current ? `${base}?color=${encodeURIComponent(current.name)}` : base;

  return (
    <article className="group pb-1">
      <ProductImageCarousel
        key={`${selected}-${shownImages[0] ?? ""}`}
        images={shownImages}
        name={displayName}
        href={href}
        badge={badge}
        discountPercent={shownDiscount}
      />

      <div className="mt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 flex-1">
            <h2 className="line-clamp-1 text-[13px] font-normal text-foreground">{displayName}</h2>
          </Link>
          <WishlistButton slug={slug} name={name} className="-m-1.5 shrink-0 p-1.5" />
        </div>

        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[13px] text-foreground">{shownPrice}</span>
          {shownCompareAt ? (
            <span className="text-[11.5px] text-[#999] line-through">{shownCompareAt}</span>
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
                className={`h-3 w-3 rounded-full border transition-all duration-150 ${
                  i === selected ? "scale-125 border-foreground" : "border-border"
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
