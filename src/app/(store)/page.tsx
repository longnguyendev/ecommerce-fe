import Link from "next/link";
import { Hero } from "@/components/hero";
import { CollectionTiles } from "@/components/collection-tiles";
import { ProductCard } from "@/components/product-card";
import { ShopTheLook } from "@/components/shop-the-look";
import { Button } from "@/components/ui/button";
import { fetchAllProducts } from "@/lib/storefront/api";

export const dynamic = "force-dynamic";

function SectionHeading({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-[11px] font-normal uppercase tracking-[0.05em] text-[#767676]">
        {title}
      </h2>
      {aside ? (
        <span className="text-[11px] font-normal uppercase tracking-[0.05em] text-[#767676]">
          {aside}
        </span>
      ) : null}
    </div>
  );
}

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
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
          {collectionList.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Tất cả sản phẩm */}
      <section className="mx-auto max-w-[1440px] px-3 pb-10 sm:px-6 lg:px-8 lg:pb-14">
        <SectionHeading title="Tất cả sản phẩm" />
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
          {allList.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
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
