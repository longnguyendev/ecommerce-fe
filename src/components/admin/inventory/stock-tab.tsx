"use client";

import { useCallback, useEffect, useState } from "react";

import { DataTable, Field, SaveButton, SecondaryButton } from "@/components/admin/form-controls";
import { Pagination, SearchInput } from "@/components/admin/list-controls";
import { DialogShell } from "@/components/shared/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adjustStock,
  formatMoney,
  INVENTORY_PAGE_SIZE,
  inventoryErrorMessage,
  listInventory,
  variantLabel,
  type InventoryVariant,
} from "@/lib/admin/inventory";
import { toast } from "@/lib/toast";

const LOW_STOCK = 5;

export function StockTab({ onError }: { onError: (message: string | null) => void }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<InventoryVariant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState<InventoryVariant | null>(null);
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Debounce ô tìm kiếm để không gọi API mỗi phím.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listInventory({
        search: query,
        lowStockThreshold: lowOnly ? LOW_STOCK : undefined,
        page,
      });
      setRows(res.nodes);
      setTotal(res.totalCount);
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Tải tồn kho thất bại");
    } finally {
      setLoading(false);
    }
  }, [query, lowOnly, page, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdjust(v: InventoryVariant) {
    setTarget(v);
    setNewQty(String(v.stockQuantity));
    setReason("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    try {
      await adjustStock({
        variantId: target.variantId,
        newQuantity: Number(newQty),
        reason: reason.trim(),
      });
      toast.success("Đã điều chỉnh tồn kho");
      setTarget(null);
      await load();
    } catch (err) {
      toast.error(inventoryErrorMessage(err, "Điều chỉnh thất bại"));
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE));
  const delta = target ? Number(newQty) - target.stockQuantity : 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4">
        <div className="min-w-[320px] flex-1 sm:max-w-xl">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên sản phẩm hoặc SKU"
            summary={`${total} biến thể`}
          />
        </div>
        <label className="mb-4 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => {
              setLowOnly(e.target.checked);
              setPage(0);
            }}
          />
          Sắp hết (≤ {LOW_STOCK})
        </label>
      </div>

      <DataTable
        columns={[
          { label: "Sản phẩm" },
          { label: "SKU" },
          { label: "Tồn", right: true },
          { label: "Giá vốn", right: true },
          { label: "", right: true },
        ]}
      >
        {rows.map((v) => (
          <tr key={v.variantId} className="border-b border-border last:border-0">
            <td className="px-4 py-3">
              <div className="font-medium">{v.productName}</div>
              {v.variantName ? (
                <div className="text-[12px] text-muted-foreground">{v.variantName}</div>
              ) : null}
            </td>
            <td className="px-4 py-3 text-muted-foreground">{v.sku}</td>
            <td
              className={`px-4 py-3 text-right tabular-nums ${
                v.stockQuantity === 0
                  ? "font-medium text-destructive"
                  : v.stockQuantity <= LOW_STOCK
                    ? "font-medium text-amber-600"
                    : ""
              }`}
            >
              {v.stockQuantity}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(v.costPrice)}</td>
            <td className="px-4 py-3 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAdjust(v)}
                className="h-7 rounded-none text-[11px]"
              >
                Điều chỉnh
              </Button>
            </td>
          </tr>
        ))}
        {!loading && rows.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
              Không có biến thể phù hợp
            </td>
          </tr>
        ) : null}
      </DataTable>
      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      ) : null}

      <DialogShell
        open={target !== null}
        title="Điều chỉnh tồn kho"
        tone="neutral"
        onClose={() => setTarget(null)}
      >
        {target ? (
          <form onSubmit={submit} className="mt-3 space-y-4">
            <p className="text-[13px] text-muted-foreground">
              {variantLabel(target)} · {target.sku}
            </p>
            <Field label={`Tồn thực tế (hiện ${target.stockQuantity})`}>
              <Input
                type="number"
                min={0}
                required
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="rounded-none"
              />
              {newQty !== "" && delta !== 0 ? (
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Chênh lệch: {delta > 0 ? "+" : ""}
                  {delta}
                </p>
              ) : null}
            </Field>
            <Field label="Lý do *">
              <Input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Kiểm kho, hàng hỏng, thất lạc…"
                className="rounded-none"
              />
            </Field>
            <div className="flex justify-end gap-3">
              <SecondaryButton onClick={() => setTarget(null)}>Huỷ</SecondaryButton>
              <SaveButton type="submit" busy={saving} disabled={newQty === ""}>
                Lưu
              </SaveButton>
            </div>
          </form>
        ) : null}
      </DialogShell>
    </>
  );
}
