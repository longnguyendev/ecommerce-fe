"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { subscribeToast, type ToastItem } from "@/lib/toast";

const LIFETIME = { success: 3000, error: 6000, info: 10000 } as const;

/** Vùng hiển thị thông báo nổi (đặt một lần trong AdminShell). */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () =>
      subscribeToast((item) => {
        setItems((prev) => [...prev.slice(-3), item]);
        window.setTimeout(
          () => setItems((prev) => prev.filter((t) => t.id !== item.id)),
          LIFETIME[item.kind],
        );
      }),
    [],
  );

  if (items.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={[
            "pointer-events-auto flex items-start gap-2 border px-4 py-3 text-[13px] shadow-lg",
            t.kind === "success"
              ? "border-green-600/30 bg-green-50 text-green-800"
              : t.kind === "info"
                ? "border-foreground/15 bg-background text-foreground"
                : "border-destructive/40 bg-destructive/10 text-destructive",
          ].join(" ")}
        >
          <span aria-hidden className="mt-px">
            {t.kind === "success" ? "✓" : t.kind === "info" ? "●" : "!"}
          </span>
          {t.href ? (
            <Link
              href={t.href}
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="flex-1 underline-offset-4 hover:underline"
            >
              {t.message}
            </Link>
          ) : (
            <span className="flex-1">{t.message}</span>
          )}
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-[15px] leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
