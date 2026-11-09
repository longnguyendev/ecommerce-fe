"use client";

import Link from "next/link";

import { CountBadge, HEADER_ICON_CLASS } from "@/components/layout/header-icon";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { CartLineItem, CartTotals, FreeShippingProgress } from "./cart-parts";
import { useCart } from "./cart-provider";

function BagIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

/** Mini-cart: icon túi + badge số lượng ở header, mở drawer bên phải. */
export function CartDrawer() {
  const { cart, ready, drawerOpen, setDrawerOpen } = useCart();
  const count = cart?.itemCount ?? 0;
  const close = () => setDrawerOpen(false);
  const cta =
    "flex h-11 items-center justify-center text-[11.5px] uppercase tracking-[0.15em] transition-opacity";

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger
        className={`${HEADER_ICON_CLASS} -mr-2`}
        aria-label={`Mở giỏ hàng, ${count} sản phẩm`}
        title="Giỏ hàng"
      >
        <BagIcon />
        <CountBadge count={ready ? count : 0} />
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-xs font-normal uppercase tracking-[0.08em] text-foreground">
            Giỏ hàng ({count})
          </SheetTitle>
        </SheetHeader>

        {cart && cart.items.length > 0 ? (
          <>
            <div className="border-b border-border px-5 py-4">
              <FreeShippingProgress cart={cart} />
            </div>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {cart.items.map((line) => (
                <CartLineItem key={line.variantId} line={line} onNavigate={close} compact />
              ))}
            </ul>
            <div className="space-y-3 border-t border-border px-5 py-4">
              <CartTotals cart={cart} />
              {!cart.canCheckout ? (
                <p className="text-[11.5px] text-destructive">
                  Vui lòng xử lý các sản phẩm được đánh dấu trước khi thanh toán.
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/cart"
                  onClick={close}
                  className={`${cta} border border-foreground text-foreground hover:opacity-70`}
                >
                  Xem giỏ hàng
                </Link>
                <Link
                  href="/checkout"
                  onClick={(e) => {
                    if (!cart.canCheckout) {
                      e.preventDefault();
                      return;
                    }
                    close();
                  }}
                  aria-disabled={!cart.canCheckout}
                  className={`${cta} bg-foreground text-background hover:opacity-85 aria-disabled:cursor-not-allowed aria-disabled:opacity-40`}
                >
                  Thanh toán
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
            <svg
              className="mb-4 text-[#999]"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              aria-hidden="true"
            >
              <path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="mb-4 text-xs text-foreground">Giỏ hàng trống</p>
            <Link
              href="/products"
              onClick={close}
              className="flex h-10 items-center border border-foreground px-6 text-xs hover:opacity-70"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
