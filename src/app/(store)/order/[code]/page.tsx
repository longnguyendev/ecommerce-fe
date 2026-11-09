import type { Metadata } from "next";

import { OrderLookupView } from "@/components/order/order-lookup";

export const metadata: Metadata = { title: "Đơn hàng — OXI", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <OrderLookupView initialCode={decodeURIComponent(code).toUpperCase()} />;
}
