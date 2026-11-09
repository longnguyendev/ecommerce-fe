"use client";

import { useEffect, useState } from "react";

import {
  Field,
  SaveButton,
  SecondaryButton,
  textareaClass,
} from "@/components/admin/form-controls";
import { Input } from "@/components/ui/input";
import {
  confirmReceipt,
  createReceipt,
  formatMoney,
  inventoryErrorMessage,
  listInventory,
  updateReceipt,
  variantLabel,
  type InventoryVariant,
  type Receipt,
} from "@/lib/admin/inventory";
import { toast } from "@/lib/toast";

interface Line {
  variantId: string;
  label: string;
  sku: string;
  quantity: string;
  unitCost: string;
}

function lineFrom(v: InventoryVariant): Line {
  return {
    variantId: v.variantId,
    label: variantLabel(v),
    sku: v.sku,
    quantity: "1",
    unitCost: String(v.costPrice),
  };
}

/** Tạo / sửa phiếu nhập nháp. "Lưu & nhập kho" xác nhận ngay: cộng tồn + cập nhật giá vốn. */
export function ReceiptForm({
  receipt,
  onDone,
  onCancel,
}: {
  receipt: Receipt | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState(receipt?.note ?? "");
  const [lines, setLines] = useState<Line[]>(
    () =>
      receipt?.items.map((i) => ({
        variantId: i.variantId,
        label: variantLabel(i),
        sku: i.sku,
        quantity: String(i.quantity),
        unitCost: String(i.unitCost),
      })) ?? [],
  );
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<InventoryVariant[]>([]);
  const [busy, setBusy] = useState<"draft" | "confirm" | null>(null);

  // Gợi ý biến thể theo từ khoá (debounce).
  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await listInventory({ search: q, page: 0, take: 8 });
        if (!cancelled) setResults(res.nodes);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  function add(v: InventoryVariant) {
    setLines((prev) =>
      prev.some((l) => l.variantId === v.variantId) ? prev : [...prev, lineFrom(v)],
    );
    setSearch("");
    setResults([]);
  }

  function patch(i: number, p: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...p } : l)));
  }

  const items = lines.map((l) => ({
    variantId: l.variantId,
    quantity: Number(l.quantity),
    unitCost: Number(l.unitCost),
  }));
  // Chỉ cần có dòng; số lượng/giá hợp lệ do BE kiểm tra và trả lỗi.
  const valid = items.length > 0;
  const total = items.reduce(
    (s, i) => s + (Number.isFinite(i.quantity * i.unitCost) ? i.quantity * i.unitCost : 0),
    0,
  );

  async function save(confirm: boolean) {
    if (!valid) return;
    setBusy(confirm ? "confirm" : "draft");
    try {
      const input = { note: note.trim() || undefined, items };
      const saved = receipt
        ? await updateReceipt({ id: receipt.id, ...input })
        : await createReceipt(input);
      if (confirm) await confirmReceipt(saved.id);
      toast.success(confirm ? "Đã nhập kho" : "Đã lưu phiếu nháp");
      onDone();
    } catch (err) {
      toast.error(inventoryErrorMessage(err, "Lưu phiếu thất bại"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-background p-6">
      <h2 className="mb-4 text-[13px] uppercase tracking-[0.12em]">
        {receipt ? `Sửa phiếu ${receipt.code}` : "Tạo phiếu nhập hàng"}
      </h2>

      <Field label="Ghi chú">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Nhà cung cấp, số chứng từ…"
          className={textareaClass}
        />
      </Field>

      <div className="relative mt-4">
        <Field label="Thêm biến thể">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value.trim()) setResults([]);
            }}
            placeholder="Tìm theo tên sản phẩm hoặc SKU"
            className="rounded-none"
          />
        </Field>
        {results.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto border border-border bg-background shadow-md">
            {results.map((v) => (
              <li key={v.variantId}>
                <button
                  type="button"
                  onClick={() => add(v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-muted"
                >
                  <span>
                    {variantLabel(v)}
                    <span className="ml-2 text-[12px] text-muted-foreground">{v.sku}</span>
                  </span>
                  <span className="text-[12px] text-muted-foreground">Tồn {v.stockQuantity}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              <th className="py-2 pr-3 font-normal">Biến thể</th>
              <th className="w-28 px-2 py-2 font-normal">Số lượng</th>
              <th className="w-36 px-2 py-2 font-normal">Giá nhập (₫)</th>
              <th className="w-32 px-2 py-2 text-right font-normal">Thành tiền</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.variantId} className="border-b border-border last:border-0">
                <td className="py-2 pr-3">
                  <div className="font-medium">{l.label}</div>
                  <div className="text-[12px] text-muted-foreground">{l.sku}</div>
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => patch(i, { quantity: e.target.value })}
                    className="h-8 rounded text-[12.5px]"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={l.unitCost}
                    onChange={(e) => patch(i, { unitCost: e.target.value })}
                    className="h-8 rounded text-[12.5px]"
                  />
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatMoney((Number(l.quantity) || 0) * (Number(l.unitCost) || 0))}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    aria-label="Bỏ dòng"
                    onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                    className="px-1 text-[16px] text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có biến thể nào. Tìm và thêm ở ô phía trên.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px]">
          Tổng giá trị: <span className="font-medium">{formatMoney(total)}</span>
        </p>
        <div className="flex gap-3">
          <SecondaryButton onClick={onCancel} disabled={busy !== null}>
            Huỷ
          </SecondaryButton>
          <SecondaryButton onClick={() => void save(false)} disabled={!valid || busy !== null}>
            {busy === "draft" ? "Đang lưu…" : "Lưu nháp"}
          </SecondaryButton>
          <SaveButton
            busy={busy === "confirm"}
            disabled={!valid || busy !== null}
            onClick={() => void save(true)}
          >
            Lưu & nhập kho
          </SaveButton>
        </div>
      </div>
    </div>
  );
}
