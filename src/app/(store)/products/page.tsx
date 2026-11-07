import Link from "next/link";
import { Catalog } from "@/components/catalog";
import { CATALOG } from "@/lib/catalog";
import { fetchAllProducts } from "@/lib/storefront/api";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await fetchAllProducts();
  const tiles = CATALOG.collections || [];

  return (
    <div className="pt-8">
      <div className="container-page">
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Tất cả sản phẩm
        </p>
        <h1 className="mt-2.5 max-w-[900px] text-[clamp(22px,2.35vw,34px)] font-medium leading-[1.2] tracking-[-0.015em]">
          {CATALOG.hero.h1 || "Đồ thể thao chuẩn form, đậm chất thời trang."}
        </h1>
        {CATALOG.hero.sub ? (
          <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-muted-foreground">
            {CATALOG.hero.sub}
          </p>
        ) : null}
      </div>

      {tiles.length ? (
        <div className="mt-6 border-y border-border">
          <div className="container-page no-bar flex gap-3 overflow-x-auto py-4">
            {tiles.map((t) => (
              <Link
                key={t.label}
                href="/products"
                className="group w-[104px] shrink-0 sm:w-auto sm:flex-1"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={t.image}
                    alt={t.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <span className="mt-1.5 block text-center text-[11.5px] text-foreground">
                  {t.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-7">
        <Catalog products={products} />
      </div>
    </div>
  );
}
