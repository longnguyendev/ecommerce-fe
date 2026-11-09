"use client";

import { DialogShell } from "@/components/shared/dialog-shell";
import { Button } from "@/components/ui/button";

/** Popup thông báo đơn giản (đóng bằng nút, Esc hoặc bấm nền). */
export function AlertDialog({
  open,
  title,
  message,
  closeLabel = "Đã hiểu",
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  closeLabel?: string;
  onClose: () => void;
}) {
  return (
    <DialogShell open={open} title={title} onClose={onClose}>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end">
        <Button
          autoFocus
          onClick={onClose}
          className="h-10 rounded-none text-xs uppercase tracking-widest"
        >
          {closeLabel}
        </Button>
      </div>
    </DialogShell>
  );
}
