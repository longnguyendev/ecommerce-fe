/**
 * Thông báo cho admin: một kết nối graphql-ws dùng chung cho cả phiên (không nối
 * lại mỗi lần chuyển trang) + store cho header: số chưa đọc (theo server), danh
 * sách trong nút chuông, trạng thái kết nối, bật/tắt âm báo (Web Audio API).
 */
import { createClient, type Client } from "graphql-ws";

import { toast } from "@/lib/toast";

import { accessTokenTtl, apiUrl, getToken, refreshAccessToken } from "./client";
import {
  fetchUnreadCount,
  listNotifications,
  markNotificationsRead,
  NOTIFICATION_FIELDS,
  type AdminNotification,
} from "./notifications";

export interface OrdersChangedDetail {
  orderId: string;
}

/**
 * window event: OrderList nghe để tự tải lại.
 * detail = { orderId } khi có đơn mới, null khi vừa kết nối lại (có thể đã lỡ đơn).
 */
export const ORDERS_CHANGED_EVENT = "admin:orders-changed";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "offline";

export interface OrderAlertsState {
  status: ConnectionStatus;
  /** Số thông báo chưa đọc của admin này (theo server). */
  unread: number;
  /** Các thông báo đã tải cho nút chuông (mới nhất trước). */
  items: AdminNotification[];
  hasMore: boolean;
  /** "idle" chưa tải, "loading" đang tải, "ready" đã có, "error" lỗi. */
  listStatus: "idle" | "loading" | "ready" | "error";
  soundEnabled: boolean;
  /** Trình duyệt chặn phát âm thanh vì người dùng chưa tương tác với trang. */
  soundBlocked: boolean;
}

const SOUND_KEY = "eql-admin-order-sound";

/* ───────── store (useSyncExternalStore) ───────── */

let state: OrderAlertsState = {
  status: "idle",
  unread: 0,
  items: [],
  hasMore: false,
  listStatus: "idle",
  soundEnabled: true,
  soundBlocked: false,
};
const SERVER_STATE = state;
const listeners = new Set<() => void>();

function setState(patch: Partial<OrderAlertsState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const orderAlertsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER_STATE,
};

/* ───────── danh sách thông báo ───────── */

/** Tải lại trang đầu (khi mở chuông). */
export async function loadNotifications(): Promise<void> {
  setState({ listStatus: state.items.length ? "ready" : "loading" });
  try {
    const page = await listNotifications(0);
    setState({
      items: page.nodes,
      hasMore: page.hasNextPage,
      unread: page.unread,
      listStatus: "ready",
    });
  } catch {
    setState({ listStatus: "error" });
  }
}

export async function loadMoreNotifications(): Promise<void> {
  if (state.listStatus === "loading" || !state.hasMore) return;
  setState({ listStatus: "loading" });
  try {
    const page = await listNotifications(state.items.length);
    const known = new Set(state.items.map((n) => n.id));
    setState({
      items: [...state.items, ...page.nodes.filter((n) => !known.has(n.id))],
      hasMore: page.hasNextPage,
      unread: page.unread,
      listStatus: "ready",
    });
  } catch {
    setState({ listStatus: "error" });
  }
}

/** Đồng bộ số chưa đọc với server (tab khác / admin khác có thể đã đọc). */
export async function refreshUnread(): Promise<void> {
  try {
    setState({ unread: await fetchUnreadCount() });
    if (state.unread === 0) restoreTitle();
  } catch {
    // mất mạng: giữ số cũ
  }
}

/** Đánh dấu đã đọc: cập nhật giao diện ngay, rồi lấy số đúng từ server. */
async function markRead(
  input: { ids?: string[]; orderId?: string; all?: boolean },
  matches: (n: AdminNotification) => boolean,
): Promise<void> {
  const changed = state.items.filter((n) => !n.read && matches(n)).length;
  if (changed > 0 || input.all) {
    setState({
      items: state.items.map((n) => (matches(n) ? { ...n, read: true } : n)),
      unread: input.all ? 0 : Math.max(0, state.unread - changed),
    });
  }
  try {
    setState({ unread: await markNotificationsRead(input) });
  } catch {
    void refreshUnread();
  }
  if (state.unread === 0) restoreTitle();
}

export const markNotificationRead = (id: string) => markRead({ ids: [id] }, (n) => n.id === id);

export const markOrderNotificationsRead = (orderId: string) =>
  markRead({ orderId }, (n) => n.orderId === orderId);

export const markAllNotificationsRead = () => markRead({ all: true }, () => true);

export function setSoundEnabled(enabled: boolean) {
  setState({ soundEnabled: enabled, soundBlocked: enabled ? state.soundBlocked : false });
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
  } catch {
    // bỏ qua
  }
  if (enabled) void unlockAudio().then(() => playChime());
}

/* ───────── âm báo ───────── */

let audio: AudioContext | null = null;

/** Gọi trong một thao tác của người dùng (click / phím) để trình duyệt cho phát âm. */
export async function unlockAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") await audio.resume();
    if (audio.state === "running" && state.soundBlocked) setState({ soundBlocked: false });
  } catch {
    // trình duyệt không hỗ trợ Web Audio
  }
}

/** "Ding-dong" hai nốt, ~0.6s, không cần file âm thanh. */
function playChime(): boolean {
  if (!audio || audio.state !== "running") return false;
  const now = audio.currentTime;
  for (const [i, freq] of [880, 1318.5].entries()) {
    const start = now + i * 0.18;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  }
  return true;
}

/* ───────── tiêu đề tab ───────── */

let baseTitle: string | null = null;

function flashTitle() {
  if (typeof document === "undefined" || !document.hidden) return;
  baseTitle ??= document.title;
  document.title = `(${state.unread}) Thông báo mới — ${baseTitle}`;
}

function restoreTitle() {
  if (baseTitle !== null && typeof document !== "undefined") {
    document.title = baseTitle;
    baseTitle = null;
  }
}

/* ───────── kết nối ───────── */

let client: Client | null = null;
let unsubscribe: (() => void) | null = null;
let everConnected = false;
let forceRefresh = false;

function onNotification(notification: AdminNotification) {
  if (state.items.some((n) => n.id === notification.id)) return;
  setState({
    unread: state.unread + 1,
    items: state.listStatus === "idle" ? state.items : [notification, ...state.items],
  });
  toast.info(`${notification.title} · ${notification.body}`, notification.link ?? undefined);
  if (state.soundEnabled && !playChime()) setState({ soundBlocked: true });
  flashTitle();
  if (notification.orderId) {
    window.dispatchEvent(
      new CustomEvent<OrdersChangedDetail>(ORDERS_CHANGED_EVENT, {
        detail: { orderId: notification.orderId },
      }),
    );
  }
}

/** Bắt đầu nghe đơn mới (idempotent). Gọi từ mọi trang admin. */
export function startOrderAlerts() {
  if (typeof window === "undefined" || client) return;

  try {
    setState({ soundEnabled: window.localStorage.getItem(SOUND_KEY) !== "0" });
  } catch {
    // bỏ qua
  }

  setState({ status: "connecting" });
  client = createClient({
    url: `${apiUrl.replace(/^http/, "ws")}/graphql`,
    lazy: false,
    retryAttempts: Infinity,
    // Token hết hạn / sắp hết hạn / server vừa từ chối -> refresh trước khi kết nối.
    connectionParams: async () => {
      const ttl = accessTokenTtl();
      if (forceRefresh || ttl === null || ttl < 30) {
        forceRefresh = false;
        if (!(await refreshAccessToken())) {
          throw new Error("Phiên đăng nhập đã hết hạn");
        }
      }
      return { authorization: `Bearer ${getToken()}` };
    },
    on: {
      connecting: () => setState({ status: "connecting" }),
      connected: () => {
        setState({ status: "connected" });
        // Mỗi lần (kết nối lại): đồng bộ số chưa đọc — thông báo lúc offline vẫn nằm ở server.
        void refreshUnread();
        if (state.listStatus !== "idle") void loadNotifications();
        // Kết nối lại sau khi rớt: có thể đã lỡ đơn -> báo danh sách tải lại.
        if (everConnected) {
          window.dispatchEvent(new CustomEvent(ORDERS_CHANGED_EVENT, { detail: null }));
        }
        everConnected = true;
      },
      closed: (event) => {
        // 4403 = server từ chối token -> lần sau refresh rồi mới thử.
        if ((event as CloseEvent | undefined)?.code === 4403) forceRefresh = true;
        if (client) setState({ status: "offline" });
      },
    },
  });

  unsubscribe = client.subscribe<{ adminNotificationCreated: AdminNotification }>(
    {
      query: `subscription AdminNotificationCreated {
        adminNotificationCreated { ${NOTIFICATION_FIELDS} }
      }`,
    },
    {
      next: ({ data }) => {
        if (data?.adminNotificationCreated) onNotification(data.adminNotificationCreated);
      },
      error: () => setState({ status: "offline" }),
      complete: () => undefined,
    },
  );

  document.removeEventListener("visibilitychange", onVisibility);
  document.addEventListener("visibilitychange", onVisibility);
}

function onVisibility() {
  if (document.hidden) return;
  restoreTitle();
  void refreshUnread();
}

/** Ngắt khi đăng xuất. */
export function stopOrderAlerts() {
  unsubscribe?.();
  const current = client;
  client = null;
  unsubscribe = null;
  everConnected = false;
  void current?.dispose();
  setState({ status: "idle", unread: 0, items: [], hasMore: false, listStatus: "idle" });
  restoreTitle();
}
