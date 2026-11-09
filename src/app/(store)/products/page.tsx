import { Catalog } from "@/components/product/catalog";
import { CollectionTabs, type CollectionTab } from "@/components/product/collection-tabs";
import { ALL_TILE, NEW_PRODUCT_COUNT, NEW_TILE } from "@/data/home";
import { normalizeVi } from "@/lib/storefront/address";
import { fetchAllProducts, fetchCollections } from "@/lib/storefront/api";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string | string[]; q?: string | string[] }>;
}) {
  const { collection, q } = await searchParams;
  const active = (Array.isArray(collection) ? collection[0] : collection) ?? "";
  const query = ((Array.isArray(q) ? q[0] : q) ?? "").trim();

  const [products, collections] = await Promise.all([fetchAllProducts(), fetchCollections()]);

  const tabs: CollectionTab[] = [
    ALL_TILE,
    NEW_TILE,
    ...collections.map((c) => ({ slug: c.slug, label: c.name, image: c.image })),
  ];

  // "Mới" = các sản phẩm mới tạo nhất (API trả theo createdAt giảm dần).
  const inCollection =
    active === NEW_TILE.slug
      ? products.slice(0, NEW_PRODUCT_COUNT)
      : active
        ? products.filter((p) => p.collections?.includes(active))
        : products;

  // Tìm kiếm không dấu, mọi từ đều phải khớp tên hoặc loại sản phẩm ("ao bra den").
  const terms = normalizeVi(query).split(/\s+/).filter(Boolean);
  const visible =
    terms.length === 0
      ? inCollection
      : inCollection.filter((p) => {
          const haystack = normalizeVi(`${p.name} ${p.category}`);
          return terms.every((t) => haystack.includes(t));
        });

  return (
    <div className="pt-8">
      <div className="container-page">
        <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
          {query ? "Tìm kiếm" : "Tất cả sản phẩm"}
        </p>
        {query ? (
          <>
            <h1 className="mt-2.5 max-w-[900px] text-[clamp(22px,2.35vw,34px)] font-medium leading-[1.2] tracking-[-0.015em]">
              Kết quả cho “{query}”
            </h1>
            <p className="mt-3 text-[14.5px] text-muted-foreground">
              {visible.length > 0
                ? `${visible.length} sản phẩm`
                : "Không tìm thấy sản phẩm phù hợp. Thử từ khoá khác hoặc xem các bộ sưu tập bên dưới."}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2.5 max-w-[900px] text-[clamp(22px,2.35vw,34px)] font-medium leading-[1.2] tracking-[-0.015em]">
              Đồ thể thao chuẩn form, đậm chất thời trang.
            </h1>
            <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-muted-foreground">
              Thiết kế cho sân đấu, phòng tập và dạo phố — theo cách bạn vận động.
            </p>
          </>
        )}
      </div>

      <CollectionTabs tabs={tabs} active={active} />

      <div className="mt-7">
        <Catalog key={`${active || "all"}|${query}`} products={visible} />
      </div>
    </div>
  );
}
