"use client";

import Link from "next/link";

import { CartLineItem, CartTotals, CouponBox, FreeShippingProgress } from "./cart-parts";
import { useCart } from "./cart-provider";

export function CartPageView() {
  const { cart, ready } = useCart();

  if (!ready) {
    return <div className="container-page min-h-[50vh] py-16" aria-busy="true" />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-[22px] font-medium tracking-[-0.02em]">Giỏ hàng trống</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Hãy khám phá sản phẩm và thêm món bạn thích vào giỏ.
        </p>
        <Link
          href="/products"
          className="mt-6 flex h-11 items-center bg-foreground px-8 text-[11.5px] uppercase tracking-[0.15em] text-background hover:opacity-85"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
        Giỏ hàng <span className="text-muted-foreground">({cart.itemCount})</span>
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
        <ul className="divide-y divide-border border-y border-border">
          {cart.items.map((line) => (
            <CartLineItem key={line.variantId} line={line} />
          ))}
        </ul>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <FreeShippingProgress cart={cart} />
          <CouponBox cart={cart} />
          <CartTotals cart={cart} />
          {!cart.canCheckout ? (
            <p className="text-[12px] text-destructive">
              Vui lòng xử lý các sản phẩm được đánh dấu trước khi thanh toán.
            </p>
          ) : null}
          <Link
            href="/checkout"
            aria-disabled={!cart.canCheckout}
            onClick={(e) => {
              if (!cart.canCheckout) e.preventDefault();
            }}
            className="flex h-12 items-center justify-center bg-foreground text-[11.5px] uppercase tracking-[0.15em] text-background hover:opacity-85 aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
          >
            Tiến hành thanh toán
          </Link>
          <Link
            href="/products"
            className="block text-center text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </div>
  );
}
