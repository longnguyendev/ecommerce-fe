"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, selectClass } from "@/components/admin/form-controls";
import { Pagination, SearchInput } from "@/components/admin/list-controls";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { formatDateTime, formatMoney } from "@/lib/admin/inventory";
import { ORDERS_CHANGED_EVENT, type OrdersChangedDetail } from "@/lib/admin/order-alerts";
import {
  listOrders,
  ORDER_PAGE_SIZE,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  orderErrorMessage,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/admin/orders";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] ${ORDER_STATUS_TONE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function OrderList() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  useAdminGuard(() => setReady(true));

  // Gõ số điện thoại: chờ 300ms rồi mới lọc.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(phone.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [phone]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders({ status: status || undefined, phone: query, page });
      setRows(res.nodes);
      setTotal(res.totalCount);
      setError(null);
    } catch (err) {
      setError(orderErrorMessage(err, "Tải danh sách đơn thất bại"));
    } finally {
      setLoading(false);
    }
  }, [status, query, page]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  // Có đơn mới (hoặc vừa kết nối lại, có thể đã lỡ đơn) thì tải lại và tô sáng dòng mới.
  useEffect(() => {
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<OrdersChangedDetail | null>).detail;
      void load();
      if (detail) {
        const id = detail.orderId;
        setFresh((prev) => new Set(prev).add(id));
        window.setTimeout(
          () =>
            setFresh((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            }),
          6000,
        );
      }
    };
    window.addEventListener(ORDERS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, onChanged);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE));

  return (
    <AdminShell
      title="Đơn hàng"
      subtitle="Đơn COD: xác nhận qua điện thoại → giao hàng → hoàn thành. Huỷ đơn sẽ hoàn lại tồn kho."
      error={error}
      maxWidth="1200px"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(0);
          }}
          aria-label="Trạng thái"
          className={`${selectClass} max-w-[200px]`}
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="min-w-[240px] flex-1 [&>div]:mb-0">
          <SearchInput
            value={phone}
            onChange={setPhone}
            placeholder="Tìm theo số điện thoại"
            summary={`${total} đơn`}
          />
        </div>
      </div>

      <DataTable
        columns={[
          { label: "Mã đơn" },
          { label: "Thời gian" },
          { label: "Khách hàng" },
          { label: "SL", right: true },
          { label: "Tổng tiền", right: true },
          { label: "Trạng thái" },
        ]}
      >
        {rows.map((o) => (
          <tr
            key={o.id}
            className={`border-b border-border transition-colors duration-1000 last:border-0 hover:bg-muted/40 ${
              fresh.has(o.id) ? "bg-amber-50" : ""
            }`}
          >
            <td className="px-4 py-3">
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {o.orderCode}
              </Link>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
              {formatDateTime(o.createdAt)}
            </td>
            <td className="px-4 py-3">
              <div>{o.shippingName}</div>
              <div className="text-[12px] text-muted-foreground">{o.contactPhone}</div>
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {o.items.reduce((n, i) => n + i.quantity, 0)}
            </td>
            <td className="px-4 py-3 text-right font-medium tabular-nums">
              {formatMoney(o.finalAmount)}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={o.status} />
            </td>
          </tr>
        ))}
        {!loading && rows.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
              Chưa có đơn hàng
            </td>
          </tr>
        ) : null}
      </DataTable>
      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      ) : null}
    </AdminShell>
  );
}
