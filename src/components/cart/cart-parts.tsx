"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/catalog";
import { isLocalImage, resolveImageUrl } from "@/lib/image-url";
import { messageForKey, type Cart, type CartLine } from "@/lib/storefront/cart";

import { useCart } from "./cart-provider";

const ISSUE_TEXT: Record<NonNullable<CartLine["issue"]>, (line: CartLine) => string> = {
  UNAVAILABLE: () => "Sản phẩm không còn bán — vui lòng xoá khỏi giỏ.",
  OUT_OF_STOCK: () => "Đã hết hàng — vui lòng xoá khỏi giỏ.",
  INSUFFICIENT_STOCK: (l) => `Chỉ còn ${l.maxQuantity} sản phẩm — vui lòng giảm số lượng.`,
};

export function productHref(line: Pick<CartLine, "productSlug" | "color">) {
  return line.color
    ? `/products/${line.productSlug}?color=${encodeURIComponent(line.color)}`
    : `/products/${line.productSlug}`;
}

function QuantityStepper({ line, disabled }: { line: CartLine; disabled: boolean }) {
  const { updateQuantity } = useCart();
  const canIncrease = !line.issue && line.quantity < line.maxQuantity;
  return (
    <div className="inline-flex h-8 items-center border border-border">
      <button
        type="button"
        aria-label="Giảm số lượng"
        disabled={disabled || line.quantity <= 1}
        onClick={() => void updateQuantity(line.variantId, line.quantity - 1)}
        className="h-full w-8 text-[14px] disabled:text-[#bbb]"
      >
        −
      </button>
      <span className="w-7 text-center text-[12px] tabular-nums" aria-live="polite">
        {line.quantity}
      </span>
      <button
        type="button"
        aria-label="Tăng số lượng"
        disabled={disabled || !canIncrease}
        onClick={() => void updateQuantity(line.variantId, line.quantity + 1)}
        className="h-full w-8 text-[14px] disabled:text-[#bbb]"
      >
        +
      </button>
    </div>
  );
}

export function CartLineItem({
  line,
  onNavigate,
  compact = false,
}: {
  line: CartLine;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { pending, removeItem } = useCart();
  const busy = pending.has(line.variantId);
  const src = resolveImageUrl(line.image);
  const meta = [line.color, line.size].filter(Boolean).join(" / ");

  return (
    <li className={`flex gap-4 py-4 ${busy ? "opacity-60" : ""}`}>
      <Link
        href={productHref(line)}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden bg-muted ${compact ? "h-24 w-18" : "h-32 w-24"}`}
      >
        {src ? (
          <Image
            src={src}
            alt={line.productName}
            fill
            sizes="96px"
            unoptimized={isLocalImage(src)}
            className="object-cover"
          />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={productHref(line)}
              onClick={onNavigate}
              className="line-clamp-2 text-[13px] text-foreground hover:opacity-70"
            >
              {line.productName}
            </Link>
            {meta ? <p className="mt-1 text-[11.5px] text-muted-foreground">{meta}</p> : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] tabular-nums">{formatPrice(line.lineTotal)}</p>
            {line.quantity > 1 ? (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {formatPrice(line.unitPrice)} / chiếc
              </p>
            ) : null}
          </div>
        </div>
        {line.issue ? (
          <p className="mt-2 text-[11.5px] text-destructive">{ISSUE_TEXT[line.issue](line)}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3">
          {line.issue === "UNAVAILABLE" || line.issue === "OUT_OF_STOCK" ? (
            <span />
          ) : (
            <QuantityStepper line={line} disabled={busy} />
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void removeItem(line.variantId)}
            className="text-[11.5px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Xoá
          </button>
        </div>
      </div>
    </li>
  );
}

export function FreeShippingProgress({ cart }: { cart: Cart }) {
  const remaining = cart.freeShippingThreshold - (cart.subtotal - cart.discountAmount);
  const percent = Math.min(
    100,
    Math.max(0, ((cart.subtotal - cart.discountAmount) / cart.freeShippingThreshold) * 100),
  );
  return (
    <div>
      <p className="text-[11.5px] text-foreground">
        {remaining > 0 ? (
          <>
            Mua thêm <span className="tabular-nums">{formatPrice(remaining)}</span> để được miễn phí
            vận chuyển
          </>
        ) : (
          "Đơn hàng của bạn được miễn phí vận chuyển"
        )}
      </p>
      <div className="mt-2 h-0.5 w-full bg-border">
        <div
          className="h-full bg-foreground transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function CartTotals({
  cart,
  showTotalOnly = false,
}: {
  cart: Cart;
  showTotalOnly?: boolean;
}) {
  const row = "flex items-center justify-between text-[12.5px]";
  return (
    <dl className="space-y-2">
      {showTotalOnly ? null : (
        <>
          <div className={row}>
            <dt className="text-muted-foreground">Tạm tính</dt>
            <dd className="tabular-nums">{formatPrice(cart.subtotal)}</dd>
          </div>
          {cart.discountAmount > 0 ? (
            <div className={row}>
              <dt className="text-muted-foreground">Giảm giá ({cart.couponCode})</dt>
              <dd className="tabular-nums">−{formatPrice(cart.discountAmount)}</dd>
            </div>
          ) : null}
          <div className={row}>
            <dt className="text-muted-foreground">Vận chuyển</dt>
            <dd className="tabular-nums">
              {cart.shippingFee === 0 ? "Miễn phí" : formatPrice(cart.shippingFee)}
            </dd>
          </div>
        </>
      )}
      <div className="flex items-center justify-between border-t border-border pt-3 text-[14px]">
        <dt>Tổng cộng</dt>
        <dd className="font-medium tabular-nums">{formatPrice(cart.total)}</dd>
      </div>
    </dl>
  );
}

export function CouponBox({ cart }: { cart: Cart }) {
  const { applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (cart.couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 border border-dashed border-border px-3 py-2.5">
        <div className="min-w-0 text-[12px]">
          <p>
            Mã <span className="font-medium">{cart.couponCode}</span>
          </p>
          {cart.couponError ? (
            <p className="mt-0.5 text-destructive">
              {messageForKey(cart.couponError, formatPrice)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void removeCoupon()}
          className="shrink-0 text-[11.5px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Bỏ mã
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        const message = await applyCoupon(code.trim());
        setBusy(false);
        setError(message);
        if (!message) setCode("");
      }}
    >
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Mã giảm giá"
          aria-label="Mã giảm giá"
          aria-invalid={error ? true : undefined}
          className="h-10 min-w-0 flex-1 border border-border bg-transparent px-3 text-[12.5px] uppercase outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="h-10 shrink-0 border border-foreground px-4 text-[11.5px] uppercase tracking-widest disabled:border-border disabled:text-[#bbb]"
        >
          Áp dụng
        </button>
      </div>
      {error ? <p className="mt-1.5 text-[11.5px] text-destructive">{error}</p> : null}
    </form>
  );
}
