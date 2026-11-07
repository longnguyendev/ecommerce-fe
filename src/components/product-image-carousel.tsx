"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Vùng ảnh của thẻ sản phẩm: hover hiện nút chuyển ảnh và thanh tiến trình ở dưới
 * (phần đã đi trượt từ trái sang phải theo ảnh đang xem).
 */
export function ProductImageCarousel({
  images,
  name,
  href,
  badge,
  discountPercent,
}: {
  images: string[];
  name: string;
  href: string;
  badge: string | null;
  discountPercent: number | null;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const multiple = count > 1;

  function go(delta: number) {
    setIndex((cur) => (cur + delta + count) % count);
  }

  const controlVisibility =
    "opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100";

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
      <Link href={href} className="absolute inset-0 block" aria-label={name}>
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={src}
              alt={i === 0 ? name : `${name} — view ${i + 1}`}
              width={400}
              height={500}
              loading="lazy"
              draggable={false}
              className="h-full w-full shrink-0 object-cover"
            />
          ))}
        </div>

        {badge ? (
          <Badge className="absolute left-2 top-2 rounded-none bg-background px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-foreground">
            {badge}
          </Badge>
        ) : null}
        {discountPercent ? (
          <Badge className="absolute right-2 top-2 rounded-none bg-foreground px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-background">
            -{discountPercent}%
          </Badge>
        ) : null}
      </Link>

      {multiple ? (
        <>
          {index > 0 ? (
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className={`absolute left-0 top-1/2 z-10 flex h-10 w-7 -translate-y-1/2 items-center justify-center bg-background text-foreground shadow-sm hover:bg-background/90 ${controlVisibility}`}
            >
              <Chevron direction="left" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Ảnh tiếp theo"
            className={`absolute right-0 top-1/2 z-10 flex h-10 w-7 -translate-y-1/2 items-center justify-center bg-background text-foreground shadow-sm hover:bg-background/90 ${controlVisibility}`}
          >
            <Chevron direction="right" />
          </button>

          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[3px] bg-black/15 ${controlVisibility}`}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={count}
            aria-valuenow={index + 1}
          >
            <div
              className="h-full bg-foreground transition-[width] duration-500 ease-out"
              style={{ width: `${((index + 1) / count) * 100}%` }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}
