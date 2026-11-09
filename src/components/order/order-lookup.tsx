"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { errorMessage, LAST_ORDER_KEY, lookupOrder, type PublicOrder } from "@/lib/storefront/cart";

import { ORDER_STATUS_TEXT, OrderSummary } from "./order-summary";

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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Tải lại trạng thái mới nhất bằng SĐT của chính đơn (BE khớp contactPhone/shippingPhone).
  const refresh = useCallback(async (current: PublicOrder, silent = false) => {
    if (!silent) setRefreshing(true);
    setRefreshError(null);
    try {
      const fresh = await lookupOrder(current.orderCode, current.contactPhone);
      setOrder(fresh);
      setUpdatedAt(new Date());
    } catch (err) {
      if (!silent) setRefreshError(errorMessage(err));
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const last = readLastOrder(initialCode);
    if (last) {
      setOrder(last);
      setJustPlaced(true);
      // Đơn trong sessionStorage có thể đã cũ (shop đã xác nhận/giao): cập nhật ngầm.
      void refresh(last, true);
    }
    setChecked(true);
  }, [initialCode, refresh]);

  const lookupAnother = () => {
    setOrder(null);
    setJustPlaced(false);
    setCode("");
    setPhone("");
    setError(null);
    setRefreshError(null);
    setUpdatedAt(null);
  };

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
      setUpdatedAt(new Date());
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
          <div className="mb-8">
            <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
              Đơn hàng {order.orderCode}
            </h1>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              Đặt lúc {new Date(order.createdAt).toLocaleString("vi-VN")} · Trạng thái:{" "}
              <span className="text-foreground">{ORDER_STATUS_TEXT[order.status]}</span>
            </p>
          </div>
        )}
        <OrderSummary order={order} />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[12px] text-muted-foreground">
          <p aria-live="polite">
            {refreshError ? (
              <span className="text-destructive">{refreshError}</span>
            ) : updatedAt ? (
              <>Cập nhật lúc {updatedAt.toLocaleTimeString("vi-VN")}</>
            ) : null}
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => void refresh(order)}
              disabled={refreshing}
              className="underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              {refreshing ? "Đang cập nhật…" : "Cập nhật trạng thái"}
            </button>
            <button
              type="button"
              onClick={lookupAnother}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Tra cứu đơn khác
            </button>
          </div>
        </div>
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
