"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ProductVariantSection } from "@/components/admin/products/product-variant-section";
import { gql, isAuthenticated } from "@/lib/admin/client";

/** Trang riêng: biến thể + hình ảnh của một sản phẩm, theo id. */
export function ProductVariantsPage({ productId }: { productId: string }) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    gql<{ product: { name: string } | null }>(`query P($id: ID!) { product(id: $id) { name } }`, {
      id: productId,
    })
      .then(({ product }) => {
        if (product) setName(product.name);
        else setError("Không tìm thấy sản phẩm.");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Tải sản phẩm thất bại"));
  }, [productId, router]);

  return (
    <AdminShell
      title={name ? `Biến thể: ${name}` : "Biến thể sản phẩm"}
      subtitle={productId.slice(0, 8)}
      maxWidth="1200px"
      error={error}
      action={
        <Link
          href="/admin/products"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Danh sách sản phẩm
        </Link>
      }
    >
      {name ? <ProductVariantSection productId={productId} /> : null}
    </AdminShell>
  );
}
