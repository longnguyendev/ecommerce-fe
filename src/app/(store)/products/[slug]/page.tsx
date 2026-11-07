import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
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
  return { title: detail ? `${detail.product.name} — EQL` : "Không tìm thấy — EQL" };
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
          <div className="border-b border-border pb-2.5">
            <h2 className="text-[10.5px] uppercase tracking-[0.18em]">
              Có thể bạn thích
            </h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
