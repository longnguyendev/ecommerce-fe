"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Popover } from "@base-ui/react/popover";

import { useOrderAlerts } from "@/components/admin/order-alerts";
import { timeAgo, type AdminNotification } from "@/lib/admin/notifications";
import {
  loadMoreNotifications,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/admin/order-alerts";

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/** Thời gian tương đối, tự cập nhật mỗi phút khi panel đang mở. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

function NotificationRow({
  item,
  now,
  onOpen,
}: {
  item: AdminNotification;
  now: number;
  onOpen: (item: AdminNotification) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
          item.read ? "text-muted-foreground" : "bg-sky-50/60"
        }`}
      >
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-sky-600"}`}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[13px] ${item.read ? "" : "font-medium text-foreground"}`}
          >
            {item.title}
          </span>
          <span className="mt-0.5 block truncate text-[12px]">{item.body}</span>
          <time
            dateTime={item.createdAt}
            title={new Date(item.createdAt).toLocaleString("vi-VN")}
            className="mt-1 block text-[11px] text-muted-foreground"
          >
            {timeAgo(item.createdAt, now)}
          </time>
        </span>
        <span className="sr-only">{item.read ? "Đã đọc" : "Chưa đọc"}</span>
      </button>
    </li>
  );
}

/** Nút chuông trên header admin: số chưa đọc + danh sách thông báo lưu ở server. */
export function NotificationBell() {
  const router = useRouter();
  const { unread, items, hasMore, listStatus } = useOrderAlerts();
  const [open, setOpen] = useState(false);
  const now = useNow(open);

  const openItem = (item: AdminNotification) => {
    if (!item.read) void markNotificationRead(item.id);
    setOpen(false);
    if (item.link) router.push(item.link);
  };

  const label = unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo";

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void loadNotifications();
      }}
    >
      <Popover.Trigger
        aria-label={label}
        title={label}
        className="relative flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground data-popup-open:text-foreground"
      >
        <BellIcon />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none text-white tabular-nums"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
          <Popover.Popup className="flex max-h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-1rem))] flex-col border border-border bg-background shadow-xl outline-none">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Popover.Title className="text-[12px] uppercase tracking-[0.08em]">
                Thông báo{unread > 0 ? ` (${unread})` : ""}
              </Popover.Title>
              <button
                type="button"
                disabled={unread === 0}
                onClick={() => void markAllNotificationsRead()}
                className="text-[12px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:no-underline disabled:opacity-40"
              >
                Đánh dấu đã đọc hết
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {items.length > 0 ? (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <NotificationRow key={item.id} item={item} now={now} onOpen={openItem} />
                  ))}
                </ul>
              ) : listStatus === "loading" || listStatus === "idle" ? (
                <p
                  className="px-4 py-10 text-center text-[13px] text-muted-foreground"
                  aria-busy="true"
                >
                  Đang tải…
                </p>
              ) : listStatus === "error" ? (
                <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                  Không tải được thông báo.{" "}
                  <button
                    type="button"
                    onClick={() => void loadNotifications()}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                  Chưa có thông báo nào
                </p>
              )}

              {hasMore ? (
                <div className="border-t border-border p-2 text-center">
                  <button
                    type="button"
                    disabled={listStatus === "loading"}
                    onClick={() => void loadMoreNotifications()}
                    className="w-full py-2 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {listStatus === "loading" ? "Đang tải…" : "Xem thêm"}
                  </button>
                </div>
              ) : null}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
