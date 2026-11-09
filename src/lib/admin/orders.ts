import { gql } from "./client";
import type { Page } from "./inventory";

export const ORDER_PAGE_SIZE = 20;

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "COD" | "BANK_TRANSFER" | "GATEWAY";

export interface AdminOrderItem {
  id: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

export interface AdminOrder {
  id: string;
  orderCode: string;
  contactEmail: string | null;
  contactPhone: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingWard: string;
  shippingDistrict: string | null;
  shippingProvince: string;
  note: string | null;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  SHIPPING: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-zinc-200 text-zinc-600",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán lỗi",
  REFUNDED: "Đã hoàn tiền",
};

/** Bước tiếp theo hợp lệ — khớp TRANSITIONS ở BE (order.service.ts). */
export const NEXT_STATUS: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  PENDING: [
    { status: "CONFIRMED", label: "Xác nhận đơn" },
    { status: "CANCELLED", label: "Huỷ đơn" },
  ],
  CONFIRMED: [
    { status: "SHIPPING", label: "Bắt đầu giao" },
    { status: "CANCELLED", label: "Huỷ đơn" },
  ],
  SHIPPING: [{ status: "COMPLETED", label: "Đã giao thành công" }],
  COMPLETED: [],
  CANCELLED: [],
};

const ORDER_FIELDS = `
  id orderCode contactEmail contactPhone shippingName shippingPhone shippingAddress
  shippingWard shippingDistrict shippingProvince note totalAmount discountAmount shippingFee
  finalAmount couponCode status paymentStatus paymentMethod createdAt updatedAt
  items { id variantId productName variantName sku image quantity unitPrice unitCost lineTotal }
`;

export async function listOrders(opts: {
  status?: OrderStatus;
  phone?: string;
  page: number;
}): Promise<Page<AdminOrder>> {
  const { orders } = await gql<{ orders: Page<AdminOrder> }>(
    `query Orders($pagination: PaginationArgs, $filter: OrderFilterInput) {
      orders(pagination: $pagination, filter: $filter) { totalCount nodes { ${ORDER_FIELDS} } }
    }`,
    {
      pagination: { take: ORDER_PAGE_SIZE, skip: opts.page * ORDER_PAGE_SIZE },
      filter: { status: opts.status, contactPhone: opts.phone || undefined },
    },
  );
  return orders;
}

export async function getOrder(id: string): Promise<AdminOrder> {
  const { order } = await gql<{ order: AdminOrder }>(
    `query Order($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`,
    { id },
  );
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  const { updateOrderStatus: order } = await gql<{ updateOrderStatus: AdminOrder }>(
    `mutation Status($input: UpdateOrderStatusInput!) {
      updateOrderStatus(input: $input) { ${ORDER_FIELDS} }
    }`,
    { input: { id, status } },
  );
  return order;
}

const ERROR_TEXT: Record<string, string> = {
  "errors.business.order.notFound": "Không tìm thấy đơn hàng.",
  "errors.business.order.invalidStatusTransition": "Không thể chuyển sang trạng thái này.",
  "errors.business.order.statusChanged":
    "Đơn vừa được cập nhật ở nơi khác. Đã tải lại trạng thái mới.",
};

export function orderErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  return ERROR_TEXT[raw] ?? (raw || fallback);
}
