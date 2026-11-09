/** Thông báo nổi dùng chung (đã lưu / lỗi). Gọi từ bất kỳ đâu trên client; hiển thị bởi <Toaster />. */
export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  /** Nếu có: cả toast là link (vd mở chi tiết đơn mới). */
  href?: string;
}

type Listener = (item: ToastItem) => void;

const listeners = new Set<Listener>();
let seq = 0;

function emit(kind: ToastKind, message: string, href?: string) {
  const item: ToastItem = { id: ++seq, kind, message, href };
  listeners.forEach((l) => l(item));
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  info: (message: string, href?: string) => emit("info", message, href),
};
