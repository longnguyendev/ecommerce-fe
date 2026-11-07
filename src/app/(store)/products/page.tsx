import { Catalog } from "@/components/catalog";
import { fetchAllProducts } from "@/lib/storefront/api";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await fetchAllProducts();

  return (
    <div className="pt-8">
      <div className="container-page">
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Tất cả sản phẩm
        </p>
        <h1 className="mt-2.5 max-w-[900px] text-[clamp(22px,2.35vw,34px)] font-medium leading-[1.2] tracking-[-0.015em]">
          Đồ thể thao chuẩn form, đậm chất thời trang.
        </h1>
      </div>

      <div className="mt-7">
        <Catalog products={products} />
      </div>
    </div>
  );
}
