import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = { title: "Thanh toán — OXI" };

export default function CheckoutPage() {
  return <CheckoutView />;
}
