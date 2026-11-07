"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isAuthenticated } from "@/lib/admin/client";

/** Chuyển về trang đăng nhập nếu chưa có token; gọi `onReady` khi đã đăng nhập. */
export function useAdminGuard(onReady?: () => void) {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    onReady?.();
  }, [router, onReady]);
}
