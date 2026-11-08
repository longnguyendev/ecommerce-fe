"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "@/lib/admin/client";

/** Chuyển về trang đăng nhập nếu chưa có token; gọi `onReady` một lần khi đã đăng nhập. */
export function useAdminGuard(onReady?: () => void) {
  const router = useRouter();
  // Giữ callback mới nhất trong ref để effect không chạy lại mỗi lần render
  // (nếu không, onReady → setState → render → onReady… lặp vô hạn).
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    onReadyRef.current?.();
  }, [router]);
}
