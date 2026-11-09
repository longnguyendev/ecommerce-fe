"use client";

import { useWishlist } from "./wishlist-provider";

export function HeartIcon({ filled = false, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.6-7-9.4A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 3C19 15.4 12 20 12 20Z" />
    </svg>
  );
}

/** Nút tim bật/tắt yêu thích cho một sản phẩm (thẻ sản phẩm, trang chi tiết). */
export function WishlistButton({
  slug,
  name,
  size = 16,
  className = "",
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const on = ready && has(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug, name);
      }}
      aria-pressed={on}
      aria-label={on ? `Bỏ ${name} khỏi yêu thích` : `Thêm ${name} vào yêu thích`}
      title={on ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      className={`flex items-center justify-center transition-colors ${
        on ? "text-foreground" : "text-[#9ca3af] hover:text-foreground"
      } ${className}`}
    >
      <HeartIcon filled={on} size={size} />
    </button>
  );
}
