"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  orderAlertsStore,
  setSoundEnabled,
  startOrderAlerts,
  unlockAudio,
} from "@/lib/admin/order-alerts";

export function useOrderAlerts() {
  return useSyncExternalStore(
    orderAlertsStore.subscribe,
    orderAlertsStore.getSnapshot,
    orderAlertsStore.getServerSnapshot,
  );
}

/**
 * Đặt trong AdminShell: bắt đầu nghe đơn mới và mở khoá âm thanh ở thao tác
 * đầu tiên của người dùng (trình duyệt chặn tự phát âm khi chưa tương tác).
 */
export function OrderAlertsListener() {
  useEffect(() => {
    startOrderAlerts();
    const unlock = () => void unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  return null;
}

const STATUS_TEXT = {
  idle: "Chưa kết nối",
  connecting: "Đang kết nối thông báo đơn…",
  connected: "Đang nhận thông báo đơn mới",
  offline: "Mất kết nối thông báo — đang thử lại",
} as const;

/** Chấm trạng thái + nút bật/tắt âm báo trên header. */
export function OrderAlertsControls() {
  const { status, soundEnabled, soundBlocked } = useOrderAlerts();
  return (
    <div className="flex items-center gap-2">
      <span
        role="status"
        title={STATUS_TEXT[status]}
        aria-label={STATUS_TEXT[status]}
        className={`h-2 w-2 rounded-full ${
          status === "connected"
            ? "bg-emerald-500"
            : status === "offline"
              ? "animate-pulse bg-amber-500"
              : "bg-zinc-300"
        }`}
      />
      <button
        type="button"
        onClick={() => setSoundEnabled(!soundEnabled)}
        aria-pressed={soundEnabled}
        title={soundEnabled ? "Tắt âm báo đơn mới" : "Bật âm báo đơn mới"}
        className={`flex h-9 items-center gap-1.5 px-2 text-[12px] transition-colors ${
          soundBlocked ? "text-amber-700" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          {soundEnabled ? (
            <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
          ) : (
            <path d="m17 9 5 6m0-6-5 6" />
          )}
        </svg>
        <span className="hidden sm:inline">
          {soundBlocked ? "Bấm để bật âm báo" : soundEnabled ? "Âm báo" : "Đã tắt"}
        </span>
      </button>
    </div>
  );
}
