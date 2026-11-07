import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/shared/section-heading";
import { kindOf } from "@/lib/catalog";
import { fetchAllProducts, fetchProductDetail } from "@/lib/storefront/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await fetchProductDetail(slug);
  return { title: detail ? `${detail.product.name} — OXI` : "Không tìm thấy — OXI" };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ color?: string | string[] }>;
}) {
  const { slug } = await params;
  const { color } = await searchParams;
  const colorParam = Array.isArray(color) ? color[0] : color;
  const detail = await fetchProductDetail(slug);
  if (!detail) notFound();

  const all = await fetchAllProducts();
  const related = all
    .filter((p) => p.slug !== slug && kindOf(p) === kindOf(detail.product))
    .slice(0, 4);

  return (
    <div className="container-page pt-6 pb-4">
      <ProductDetail
        product={detail.product}
        variants={detail.variants}
        initialColor={
          detail.variants.some((v) => v.color === colorParam)
            ? (colorParam ?? null)
            : null
        }
      />

      {related.length ? (
        <section className="mt-20">
          <SectionHeading title="Có thể bạn thích" variant="line" />
          <ProductGrid products={related} className="mt-6" />
        </section>
      ) : null}
    </div>
  );
}
