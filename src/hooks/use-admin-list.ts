"use client";

import { useCallback, useState } from "react";

import { useAdminGuard } from "@/hooks/use-admin-guard";
import { toast } from "@/lib/toast";

/**
 * Trạng thái dùng chung cho các trang quản trị dạng danh sách:
 * danh sách + busy/error, và `run` bọc mọi thao tác ghi (bật busy, bắt lỗi, tải lại,
 * báo "đã lưu"/lỗi bằng thông báo nổi khi có `successMessage`).
 */
export function useAdminList<T>(fetcher: () => Promise<T[]>, loadError: string) {
  const [items, setItems] = useState<T[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      action: () => Promise<void>,
      failMessage: string,
      reload = true,
      successMessage?: string,
    ) => {
      setBusy(true);
      setError(null);
      try {
        await action();
        if (reload) setItems(await fetcher());
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : failMessage;
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [fetcher],
  );

  const load = useCallback(
    () =>
      run(async () => {
        /* chỉ tải lại */
      }, loadError),
    [run, loadError],
  );

  useAdminGuard(() => void load());

  return { items, busy, error, setError, run, reload: load };
}
