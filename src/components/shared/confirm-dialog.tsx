"use client";

import { useCallback, useRef, useState } from "react";

import { DialogShell } from "@/components/shared/dialog-shell";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** destructive = nút xác nhận màu đỏ (mặc định). */
  destructive?: boolean;
}

/**
 * Thay cho window.confirm: `const [confirm, confirmDialog] = useConfirm();`
 * rồi `if (!(await confirm({ title: "Xoá …?" }))) return;` và render `{confirmDialog}`.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  const dialog = (
    <DialogShell
      open={options !== null}
      title={options?.title ?? ""}
      tone={options?.destructive === false ? "neutral" : "danger"}
      onClose={() => close(false)}
    >
      {options?.message ? (
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{options.message}</p>
      ) : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => close(false)}
          className="h-10 rounded-none text-xs"
        >
          {options?.cancelLabel ?? "Huỷ"}
        </Button>
        <Button
          autoFocus
          variant={options?.destructive === false ? "default" : "destructive"}
          onClick={() => close(true)}
          className="h-10 rounded-none text-xs uppercase tracking-[0.1em]"
        >
          {options?.confirmLabel ?? "Xoá"}
        </Button>
      </div>
    </DialogShell>
  );

  return [confirm, dialog] as const;
}
