import Image from "next/image";

import { formatPrice } from "@/lib/catalog";
import { isLocalImage, resolveImageUrl } from "@/lib/image-url";
import type { OrderStatus, PublicOrder } from "@/lib/storefront/cart";

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

const STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED"];

function StatusSteps({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return <p className="text-[13px] text-destructive">Đơn hàng đã bị huỷ.</p>;
  }
  const current = STEPS.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, i) => (
        <li key={step}>
          <div className={`h-0.5 ${i <= current ? "bg-foreground" : "bg-border"}`} />
          <p
            className={`mt-2 text-[11px] ${i <= current ? "text-foreground" : "text-muted-foreground"}`}
            aria-current={i === current ? "step" : undefined}
          >
            {ORDER_STATUS_TEXT[step]}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Chi tiết đơn cho khách: trạng thái, sản phẩm, địa chỉ, tiền. */
export function OrderSummary({ order }: { order: PublicOrder }) {
  const address = [
    order.shippingAddress,
    order.shippingWard,
    order.shippingDistrict,
    order.shippingProvince,
  ]
    .filter(Boolean)
    .join(", ");
  const row = "flex items-center justify-between text-[12.5px]";

  return (
    <div className="space-y-8">
      <StatusSteps status={order.status} />

      <ul className="divide-y divide-border border-y border-border">
        {order.items.map((item) => {
          const src = resolveImageUrl(item.image);
          return (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-muted">
                {src ? (
                  <Image
                    src={src}
                    alt={item.productName}
                    fill
                    sizes="72px"
                    unoptimized={isLocalImage(src)}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px]">{item.productName}</p>
                  {item.variantName ? (
                    <p className="mt-1 text-[11.5px] text-muted-foreground">{item.variantName}</p>
                  ) : null}
                  <p className="mt-1 text-[11.5px] text-muted-foreground tabular-nums">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-[13px] tabular-nums">{formatPrice(item.lineTotal)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="space-y-1 text-[12.5px]">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Giao đến</p>
          <p className="pt-1">
            {order.shippingName} · {order.shippingPhone}
          </p>
          <p className="text-muted-foreground">{address}</p>
          {order.note ? <p className="text-muted-foreground">Ghi chú: {order.note}</p> : null}
          <p className="pt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Thanh toán
          </p>
          <p className="pt-1">
            Thanh toán khi nhận hàng (COD) ·{" "}
            {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
          </p>
        </div>
        <dl className="space-y-2">
          <div className={row}>
            <dt className="text-muted-foreground">Tạm tính</dt>
            <dd className="tabular-nums">{formatPrice(order.totalAmount)}</dd>
          </div>
          {order.discountAmount > 0 ? (
            <div className={row}>
              <dt className="text-muted-foreground">Giảm giá ({order.couponCode})</dt>
              <dd className="tabular-nums">−{formatPrice(order.discountAmount)}</dd>
            </div>
          ) : null}
          <div className={row}>
            <dt className="text-muted-foreground">Vận chuyển</dt>
            <dd className="tabular-nums">
              {order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-[14px]">
            <dt>Tổng cộng</dt>
            <dd className="font-medium tabular-nums">{formatPrice(order.finalAmount)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
