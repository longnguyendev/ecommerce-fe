import Link from "next/link";

import { CollectionTiles } from "@/components/home/collection-tiles";
import { Hero } from "@/components/home/hero";
import { ShopTheLook } from "@/components/home/shop-the-look";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { fetchAllProducts } from "@/lib/storefront/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = await fetchAllProducts();
  const collectionList = all.slice(0, 8);
  const allList = all.length > 8 ? all.slice(8, 48) : all;

  return (
    <>
      <Hero />
      <CollectionTiles />

      {/* Bộ sưu tập */}
      <section className="mx-auto max-w-[1440px] px-3 py-6 sm:px-6 lg:px-8 lg:py-10">
        <SectionHeading title="Bộ sưu tập" />
        <ProductGrid products={collectionList} />
      </section>

      {/* Tất cả sản phẩm */}
      <section className="mx-auto max-w-[1440px] px-3 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <SectionHeading title="Tất cả sản phẩm" />
        <ProductGrid products={allList} />
        <div className="mt-8 text-center">
          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            variant="default"
            className="h-12 rounded-none px-10 text-xs font-normal uppercase tracking-[0.15em] hover:bg-[#2c2c2c]"
          >
            Xem tất cả sản phẩm
          </Button>
        </div>
      </section>

      <ShopTheLook />
    </>
  );
}
