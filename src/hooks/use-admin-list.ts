"use client";

import { useCallback, useState } from "react";

import { useAdminGuard } from "@/hooks/use-admin-guard";

/**
 * Trạng thái dùng chung cho các trang quản trị dạng danh sách:
 * danh sách + busy/error, và `run` bọc mọi thao tác ghi (bật busy, bắt lỗi, tải lại).
 */
export function useAdminList<T>(fetcher: () => Promise<T[]>, loadError: string) {
  const [items, setItems] = useState<T[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<void>, failMessage: string, reload = true) => {
      setBusy(true);
      setError(null);
      try {
        await action();
        if (reload) setItems(await fetcher());
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : failMessage);
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
