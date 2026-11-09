import type { Metadata } from "next";

import { OrderLookupView } from "@/components/order/order-lookup";

export const metadata: Metadata = { title: "Tra cứu đơn hàng — OXI" };

export default function OrderLookupPage() {
  return <OrderLookupView />;
}
