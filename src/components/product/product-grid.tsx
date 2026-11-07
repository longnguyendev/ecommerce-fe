import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/catalog";

export function ProductGrid({ products, className = "" }: { products: Product[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4 ${className}`}>
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
