import type { Metadata } from "next";

import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = { title: "Yêu thích — OXI", robots: { index: false } };

export default function WishlistPage() {
  return <WishlistView />;
}
