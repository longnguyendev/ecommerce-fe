import { ProductCardView } from "@/components/product-card-view";
import { colorName, formatPrice, SWATCH_HEX, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  // Màu lấy từ biến thể (kèm ảnh riêng); dữ liệu catalog tĩnh cũ thì suy ra từ mã màu.
  const discount = (price: number, compareAt: number | null | undefined) =>
    compareAt ? Math.round((1 - price / compareAt) * 100) : null;

  const swatches =
    product.colorOptions && product.colorOptions.length > 0
      ? product.colorOptions.map((o) => {
          const price = o.price ?? product.price;
          const compareAt = o.price !== undefined ? o.compareAt : product.compareAt;
          return {
            name: o.name,
            hex: o.hex,
            images: o.images,
            priceText: formatPrice(price),
            compareAtText: compareAt ? formatPrice(compareAt) : null,
            discountPercent: discount(price, compareAt),
          };
        })
      : product.colors.map((c) => {
          const name = colorName(c);
          return {
            name,
            hex: SWATCH_HEX[name] || c,
            images: [] as string[],
            priceText: formatPrice(product.price),
            compareAtText: product.compareAt ? formatPrice(product.compareAt) : null,
            discountPercent: discount(product.price, product.compareAt),
          };
        });

  return (
    <ProductCardView
      slug={product.slug}
      name={product.name}
      images={product.images}
      badge={product.badge}
      discountPercent={
        product.compareAt
          ? Math.round((1 - product.price / product.compareAt) * 100)
          : null
      }
      priceText={formatPrice(product.price)}
      compareAtText={product.compareAt ? formatPrice(product.compareAt) : null}
      swatches={swatches}
    />
  );
}
