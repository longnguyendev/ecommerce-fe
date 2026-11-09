"use client";

import { useCallback, useEffect, useState } from "react";

import { DataTable, selectClass } from "@/components/admin/form-controls";
import { Pagination } from "@/components/admin/list-controls";
import {
  formatDateTime,
  formatMoney,
  INVENTORY_PAGE_SIZE,
  listMovements,
  MOVEMENT_LABEL,
  variantLabel,
  type MovementType,
  type StockMovementRow,
} from "@/lib/admin/inventory";

export function MovementsTab({ onError }: { onError: (message: string | null) => void }) {
  const [type, setType] = useState<MovementType | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<StockMovementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMovements({ type: type || undefined, page });
      setRows(res.nodes);
      setTotal(res.totalCount);
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Tải lịch sử thất bại");
    } finally {
      setLoading(false);
    }
  }, [type, page, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE));

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as MovementType | "");
            setPage(0);
          }}
          aria-label="Loại giao dịch"
          className={`${selectClass} max-w-[200px]`}
        >
          <option value="">Tất cả giao dịch</option>
          {(Object.keys(MOVEMENT_LABEL) as MovementType[]).map((t) => (
            <option key={t} value={t}>
              {MOVEMENT_LABEL[t]}
            </option>
          ))}
        </select>
        <span className="text-[12.5px] text-muted-foreground">{total} giao dịch</span>
      </div>

      <DataTable
        columns={[
          { label: "Thời gian" },
          { label: "Sản phẩm" },
          { label: "Loại" },
          { label: "Số lượng", right: true },
          { label: "Tồn sau", right: true },
          { label: "Ghi chú" },
        ]}
      >
        {rows.map((m) => (
          <tr key={m.id} className="border-b border-border last:border-0">
            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
              {formatDateTime(m.createdAt)}
            </td>
            <td className="px-4 py-3">
              <div className="font-medium">{variantLabel(m)}</div>
              <div className="text-[12px] text-muted-foreground">{m.sku}</div>
            </td>
            <td className="px-4 py-3">{MOVEMENT_LABEL[m.type]}</td>
            <td
              className={`px-4 py-3 text-right font-medium tabular-nums ${
                m.quantity > 0 ? "text-emerald-700" : "text-destructive"
              }`}
            >
              {m.quantity > 0 ? "+" : ""}
              {m.quantity}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{m.balanceAfter}</td>
            <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
              {m.reason ?? (m.unitCost !== null ? `Giá nhập ${formatMoney(m.unitCost)}` : "")}
            </td>
          </tr>
        ))}
        {!loading && rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
              Chưa có giao dịch kho
            </td>
          </tr>
        ) : null}
      </DataTable>
      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      ) : null}
    </>
  );
}
