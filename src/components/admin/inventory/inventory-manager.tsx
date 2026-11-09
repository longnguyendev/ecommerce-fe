"use client";

import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { MovementsTab } from "@/components/admin/inventory/movements-tab";
import { ReceiptsTab } from "@/components/admin/inventory/receipts-tab";
import { StockTab } from "@/components/admin/inventory/stock-tab";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/use-admin-guard";

const TABS = [
  { id: "stock", label: "Tồn kho" },
  { id: "receipts", label: "Phiếu nhập" },
  { id: "history", label: "Lịch sử" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function InventoryManager() {
  const [tab, setTab] = useState<TabId>("stock");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  useAdminGuard();

  function openTab(id: TabId) {
    setTab(id);
    setError(null);
  }

  return (
    <AdminShell
      title="Quản lý kho"
      subtitle="Tồn kho chỉ thay đổi qua phiếu nhập, điều chỉnh có lý do hoặc đơn hàng — mọi thay đổi đều có lịch sử."
      error={error}
      maxWidth="1200px"
      action={
        tab === "receipts" ? (
          <Button
            onClick={() => {
              setCreating(true);
              window.scrollTo({ top: 0 });
            }}
            className="h-11 rounded-none text-xs uppercase tracking-widest"
          >
            + Tạo phiếu nhập
          </Button>
        ) : undefined
      }
    >
      <div className="mb-5 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock" ? <StockTab onError={setError} /> : null}
      {tab === "receipts" ? (
        <ReceiptsTab onError={setError} creating={creating} onCreatingChange={setCreating} />
      ) : null}
      {tab === "history" ? <MovementsTab onError={setError} /> : null}
    </AdminShell>
  );
}
