import { ProductVariantsPage } from "@/components/admin/products/product-variants-page";

export default async function AdminProductVariantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductVariantsPage productId={id} />;
}
