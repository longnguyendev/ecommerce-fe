"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable } from "@/components/admin/form-controls";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { resolveImageUrl } from "@/lib/admin/client";
import { formatDateTime, formatMoney } from "@/lib/admin/inventory";
import { markOrderNotificationsRead } from "@/lib/admin/order-alerts";
import {
  getOrder,
  NEXT_STATUS,
  orderErrorMessage,
  PAYMENT_STATUS_LABEL,
  updateOrderStatus,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/admin/orders";
import { isLocalImage } from "@/lib/image-url";
import { toast } from "@/lib/toast";

import { StatusBadge } from "./order-list";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <h2 className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="space-y-1 text-[13px]">{children}</div>
    </section>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  useAdminGuard(() => setReady(true));

  const load = useCallback(async () => {
    try {
      setOrder(await getOrder(id));
      setError(null);
    } catch (err) {
      setError(orderErrorMessage(err, "Tải đơn hàng thất bại"));
    }
  }, [id]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  // Đã mở chi tiết đơn = đã xem thông báo của đơn này (dù vào từ chuông hay từ danh sách).
  useEffect(() => {
    if (ready) void markOrderNotificationsRead(id);
  }, [ready, id]);

  async function changeStatus(status: OrderStatus, label: string) {
    if (!order) return;
    const cancelling = status === "CANCELLED";
    const ok = await confirm({
      title: cancelling ? `Huỷ đơn ${order.orderCode}?` : `${label}?`,
      message: cancelling
        ? "Tồn kho của các sản phẩm sẽ được hoàn lại và lượt dùng mã giảm giá được trả lại. Không thể hoàn tác."
        : status === "COMPLETED" && order.paymentMethod === "COD"
          ? "Đơn COD sẽ được đánh dấu là đã thanh toán."
          : undefined,
      confirmLabel: label,
      destructive: cancelling,
    });
    if (!ok) return;

    setBusy(true);
    try {
      setOrder(await updateOrderStatus(order.id, status));
      toast.success("Đã cập nhật trạng thái đơn");
    } catch (err) {
      toast.error(orderErrorMessage(err, "Cập nhật trạng thái thất bại"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  const profit = order
    ? order.items.reduce((sum, i) => sum + (i.unitPrice - i.unitCost) * i.quantity, 0) -
      order.discountAmount
    : 0;

  return (
    <AdminShell
      title={order ? `Đơn ${order.orderCode}` : "Đơn hàng"}
      subtitle={order ? `Đặt lúc ${formatDateTime(order.createdAt)}` : undefined}
      error={error}
      maxWidth="1200px"
      action={
        <Link
          href="/admin/orders"
          className="text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          ← Danh sách đơn
        </Link>
      }
    >
      {order ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-[12.5px] text-muted-foreground">
                {order.paymentMethod} · {PAYMENT_STATUS_LABEL[order.paymentStatus]}
              </span>
            </div>
            <div className="flex gap-2">
              {NEXT_STATUS[order.status].map((next) => (
                <Button
                  key={next.status}
                  disabled={busy}
                  variant={next.status === "CANCELLED" ? "outline" : "default"}
                  onClick={() => void changeStatus(next.status, next.label)}
                  className={`h-10 rounded-none text-xs uppercase tracking-widest ${
                    next.status === "CANCELLED" ? "text-destructive" : ""
                  }`}
                >
                  {next.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Card title="Khách hàng">
              <p className="font-medium">{order.shippingName}</p>
              <p>
                <a href={`tel:${order.contactPhone}`} className="underline underline-offset-4">
                  {order.contactPhone}
                </a>
              </p>
              {order.contactEmail ? (
                <p className="text-muted-foreground">{order.contactEmail}</p>
              ) : null}
            </Card>
            <Card title="Giao hàng">
              <p>
                {order.shippingName} · {order.shippingPhone}
              </p>
              <p className="text-muted-foreground">
                {[
                  order.shippingAddress,
                  order.shippingWard,
                  order.shippingDistrict,
                  order.shippingProvince,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.note ? <p className="pt-1">Ghi chú: {order.note}</p> : null}
            </Card>
            <Card title="Thanh toán">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="tabular-nums">{formatMoney(order.totalAmount)}</span>
              </div>
              {order.discountAmount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm ({order.couponCode})</span>
                  <span className="tabular-nums">−{formatMoney(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vận chuyển</span>
                <span className="tabular-nums">{formatMoney(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <span>Khách trả</span>
                <span className="tabular-nums">{formatMoney(order.finalAmount)}</span>
              </div>
              <div className="flex justify-between text-[12px] text-muted-foreground">
                <span>Lãi gộp (trước phí ship)</span>
                <span className="tabular-nums">{formatMoney(profit)}</span>
              </div>
            </Card>
          </div>

          <DataTable
            columns={[
              { label: "Sản phẩm" },
              { label: "SKU" },
              { label: "Đơn giá", right: true },
              { label: "SL", right: true },
              { label: "Thành tiền", right: true },
            ]}
          >
            {order.items.map((item) => {
              const src = resolveImageUrl(item.image);
              return (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-muted">
                        {src ? (
                          <Image
                            src={src}
                            alt=""
                            fill
                            sizes="44px"
                            unoptimized={isLocalImage(src)}
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        {item.variantName ? (
                          <div className="text-[12px] text-muted-foreground">
                            {item.variantName}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatMoney(item.lineTotal)}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>
      ) : null}
      {confirmDialog}
    </AdminShell>
  );
}
