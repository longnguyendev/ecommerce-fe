"use client";

import { useEffect } from "react";

/** Khung popup dùng chung: nền mờ, đóng bằng Esc hoặc bấm nền. */
export function DialogShell({
  open,
  title,
  tone = "danger",
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  tone?: "danger" | "neutral";
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-lg bg-background p-6 shadow-xl"
      >
        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-[18px] ${
            tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
          }`}
        >
          !
        </div>
        <h2 id="dialog-title" className="text-[15px] font-medium">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
