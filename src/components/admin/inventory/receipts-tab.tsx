"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import { DataTable, selectClass } from "@/components/admin/form-controls";
import { ReceiptForm } from "@/components/admin/inventory/receipt-form";
import { Pagination } from "@/components/admin/list-controls";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  cancelReceipt,
  confirmReceipt,
  formatDateTime,
  formatMoney,
  INVENTORY_PAGE_SIZE,
  inventoryErrorMessage,
  listReceipts,
  RECEIPT_STATUS_LABEL,
  revertReceipt,
  variantLabel,
  type Receipt,
  type ReceiptStatus,
} from "@/lib/admin/inventory";
import { toast } from "@/lib/toast";

const STATUS_STYLE: Record<ReceiptStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function ReceiptsTab({
  onError,
  creating,
  onCreatingChange,
}: {
  onError: (message: string | null) => void;
  creating: boolean;
  onCreatingChange: (v: boolean) => void;
}) {
  const [status, setStatus] = useState<ReceiptStatus | "">("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listReceipts({ status: status || undefined, page });
      setRows(res.nodes);
      setTotal(res.totalCount);
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Tải phiếu nhập thất bại");
    } finally {
      setLoading(false);
    }
  }, [status, page, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(fn: () => Promise<unknown>, ok: string, fail: string) {
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(inventoryErrorMessage(err, fail));
    }
  }

  async function onConfirm(r: Receipt) {
    const ok = await confirm({
      title: `Nhập kho phiếu ${r.code}?`,
      message: `Cộng ${r.totalQuantity} sản phẩm vào kho và cập nhật giá vốn bình quân. Phiếu đã nhập kho không sửa hay xoá được.`,
      confirmLabel: "Nhập kho",
      destructive: false,
    });
    if (ok) await act(() => confirmReceipt(r.id), "Đã nhập kho", "Nhập kho thất bại");
  }

  async function onRevert(r: Receipt) {
    const ok = await confirm({
      title: `Hoàn phiếu ${r.code} về nháp?`,
      message: `Trừ lại ${r.totalQuantity} sản phẩm đã nhập khỏi kho và gỡ lô này khỏi giá vốn bình quân. Phiếu quay về trạng thái nháp để sửa hoặc huỷ.`,
      confirmLabel: "Hoàn về nháp",
      destructive: false,
    });
    // BE kiểm tra lại điều kiện (tồn hiện tại >= số lượng phiếu) và trả lỗi nếu không đạt.
    if (ok) await act(() => revertReceipt(r.id), "Đã hoàn phiếu về nháp", "Hoàn phiếu thất bại");
  }

  async function onCancelReceipt(r: Receipt) {
    const ok = await confirm({
      title: `Huỷ phiếu ${r.code}?`,
      message: "Phiếu nháp sẽ chuyển sang trạng thái đã huỷ.",
      confirmLabel: "Huỷ phiếu",
    });
    if (ok) await act(() => cancelReceipt(r.id), "Đã huỷ phiếu", "Huỷ phiếu thất bại");
  }

  function closeForm() {
    setEditing(null);
    onCreatingChange(false);
  }

  const totalPages = Math.max(1, Math.ceil(total / INVENTORY_PAGE_SIZE));

  return (
    <>
      {creating || editing ? (
        <ReceiptForm
          key={editing?.id ?? "new"}
          receipt={editing}
          onCancel={closeForm}
          onDone={() => {
            closeForm();
            setPage(0);
            void load();
          }}
        />
      ) : null}

      <div className="mb-4 flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReceiptStatus | "");
            setPage(0);
          }}
          aria-label="Trạng thái phiếu"
          className={`${selectClass} max-w-[200px]`}
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(RECEIPT_STATUS_LABEL) as ReceiptStatus[]).map((s) => (
            <option key={s} value={s}>
              {RECEIPT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <span className="text-[12.5px] text-muted-foreground">{total} phiếu</span>
      </div>

      <DataTable
        columns={[
          { label: "Mã phiếu" },
          { label: "Ngày tạo" },
          { label: "Số lượng", right: true },
          { label: "Giá trị", right: true },
          { label: "Trạng thái" },
          { label: "", right: true },
        ]}
      >
        {rows.map((r) => (
          <Fragment key={r.id}>
            <tr className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {r.code}
                </button>
                {r.note ? <div className="text-[12px] text-muted-foreground">{r.note}</div> : null}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {formatDateTime(r.createdAt)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{r.totalQuantity}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.totalCost)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 text-[11px] ${STATUS_STYLE[r.status]}`}>
                  {RECEIPT_STATUS_LABEL[r.status]}
                </span>
              </td>
              <td className="px-4 py-3">
                {r.status === "DRAFT" ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onCreatingChange(false);
                        setEditing(r);
                        window.scrollTo({ top: 0 });
                      }}
                      className="h-7 rounded-none text-[11px]"
                    >
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void onConfirm(r)}
                      className="h-7 rounded-none text-[11px]"
                    >
                      Nhập kho
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void onCancelReceipt(r)}
                      className="h-7 rounded-none text-[11px]"
                    >
                      Huỷ
                    </Button>
                  </div>
                ) : null}
                {r.status === "CONFIRMED" ? (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!r.canRevert}
                      title={
                        r.canRevert
                          ? "Hoàn phiếu về nháp, trừ lại số lượng đã nhập"
                          : "Chưa hoàn được: tồn hiện tại nhỏ hơn số lượng của phiếu"
                      }
                      onClick={() => void onRevert(r)}
                      className="h-7 rounded-none text-[11px]"
                    >
                      Hoàn về nháp
                    </Button>
                  </div>
                ) : null}
              </td>
            </tr>
            {openId === r.id ? (
              <tr className="border-b border-border bg-muted/40">
                <td colSpan={6} className="px-4 py-3">
                  {r.status === "CONFIRMED" && r.revertShortages.length > 0 ? (
                    <p className="mb-2 text-[12.5px] text-amber-700">
                      Chưa hoàn về nháp được:{" "}
                      {r.revertShortages
                        .map((s) => `${variantLabel(s)} (tồn ${s.available} < ${s.required})`)
                        .join("; ")}
                    </p>
                  ) : null}
                  <ul className="space-y-1 text-[12.5px]">
                    {r.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-4">
                        <span>
                          {variantLabel(i)} <span className="text-muted-foreground">· {i.sku}</span>
                        </span>
                        <span className="tabular-nums">
                          {i.quantity} × {formatMoney(i.unitCost)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
        {!loading && rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
              Chưa có phiếu nhập nào
            </td>
          </tr>
        ) : null}
      </DataTable>
      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      ) : null}
      {confirmDialog}
    </>
  );
}
