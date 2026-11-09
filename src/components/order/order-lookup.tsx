"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { errorMessage, LAST_ORDER_KEY, lookupOrder, type PublicOrder } from "@/lib/storefront/cart";

import { OrderSummary } from "./order-summary";

function readLastOrder(code: string | undefined): PublicOrder | null {
  if (!code) return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    const order = raw ? (JSON.parse(raw) as PublicOrder) : null;
    return order?.orderCode === code ? order : null;
  } catch {
    return null;
  }
}

/**
 * Trang đơn hàng: vừa đặt xong thì hiện ngay (đơn lưu trong sessionStorage),
 * còn lại khách nhập mã đơn + số điện thoại để tra cứu.
 */
export function OrderLookupView({ initialCode }: { initialCode?: string }) {
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState(initialCode ?? "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const last = readLastOrder(initialCode);
    if (last) {
      setOrder(last);
      setJustPlaced(true);
    }
    setChecked(true);
  }, [initialCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) {
      setError("Vui lòng nhập mã đơn hàng và số điện thoại.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setOrder(await lookupOrder(code.trim(), phone.trim()));
      setJustPlaced(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return <div className="container-page min-h-[50vh] py-16" aria-busy="true" />;

  if (order) {
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        {justPlaced ? (
          <div className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Đặt hàng thành công
            </p>
            <h1 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
              Cảm ơn bạn, {order.shippingName}!
            </h1>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Mã đơn hàng <span className="font-medium text-foreground">{order.orderCode}</span>.
              Shop sẽ gọi tới {order.shippingPhone} để xác nhận trước khi giao. Lưu lại mã đơn để
              tra cứu sau.
            </p>
          </div>
        ) : (
          <h1 className="mb-8 text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
            Đơn hàng {order.orderCode}
          </h1>
        )}
        <OrderSummary order={order} />
        <div className="mt-10 flex justify-center">
          <Link
            href="/products"
            className="flex h-11 items-center bg-foreground px-8 text-[11.5px] uppercase tracking-[0.15em] text-background hover:opacity-85"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[50vh] max-w-md flex-col justify-center py-16">
      <h1 className="text-[22px] font-medium tracking-[-0.02em]">Tra cứu đơn hàng</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Nhập mã đơn hàng và số điện thoại đã dùng khi đặt hàng.
      </p>
      <form noValidate onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="orderCode" className="text-[11.5px] text-muted-foreground">
            Mã đơn hàng
          </label>
          <input
            id="orderCode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DH20261109123456"
            className="mt-1 h-11 w-full border border-border bg-transparent px-3 text-[13px] uppercase outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label htmlFor="lookupPhone" className="text-[11.5px] text-muted-foreground">
            Số điện thoại
          </label>
          <input
            id="lookupPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 h-11 w-full border border-border bg-transparent px-3 text-[13px] outline-none focus:border-foreground"
          />
        </div>
        {error ? (
          <p role="alert" className="text-[12px] text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-foreground text-[11.5px] uppercase tracking-[0.15em] text-background hover:opacity-85 disabled:opacity-50"
        >
          {loading ? "Đang tra cứu…" : "Tra cứu"}
        </button>
      </form>
    </div>
  );
}
