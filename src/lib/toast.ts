/** Thông báo nổi dùng chung (đã lưu / lỗi). Gọi từ bất kỳ đâu trên client; hiển thị bởi <Toaster />. */
export type ToastKind = "success" | "error";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (item: ToastItem) => void;

const listeners = new Set<Listener>();
let seq = 0;

function emit(kind: ToastKind, message: string) {
  const item: ToastItem = { id: ++seq, kind, message };
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
};
