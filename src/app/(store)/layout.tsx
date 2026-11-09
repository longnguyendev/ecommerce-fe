import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader, type HeaderCollection } from "@/components/layout/site-header";
import { Toaster } from "@/components/shared/toaster";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import { fetchCollections } from "@/lib/storefront/api";

async function loadCollections(): Promise<HeaderCollection[]> {
  try {
    return (await fetchCollections()).map((c) => ({ slug: c.slug, name: c.name }));
  } catch {
    // API lỗi: menu "Cửa hàng" vẫn có "Tất cả" / "Mới", trang không sập.
    return [];
  }
}

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const collections = await loadCollections();
  return (
    <CartProvider>
      <WishlistProvider>
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <SiteHeader collections={collections} />
        <main>{children}</main>
        <SiteFooter />
        <Toaster />
      </WishlistProvider>
    </CartProvider>
  );
}
