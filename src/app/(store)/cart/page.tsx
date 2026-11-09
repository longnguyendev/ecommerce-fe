import type { Metadata } from "next";

import { CartPageView } from "@/components/cart/cart-page";

export const metadata: Metadata = { title: "Giỏ hàng — OXI" };

export default function CartPage() {
  return <CartPageView />;
}
