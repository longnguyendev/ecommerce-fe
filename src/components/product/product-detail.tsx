"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/catalog";
import { isLocalImage } from "@/lib/image-url";
import { colorHex, type StoreVariant } from "@/lib/storefront/api";

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-[13.5px] text-foreground">{title}</span>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="pb-4 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}

export function ProductDetail({
  product,
  variants = [],
  initialColor = null,
}: {
  product: Product;
  variants?: StoreVariant[];
  initialColor?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  // Giống thẻ sản phẩm: mặc định chọn sẵn màu đầu tiên (hoặc màu từ ?color=).
  const [color, setColor] = useState<string | null>(
    initialColor ?? variants.find((v) => v.color)?.color ?? null,
  );
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);

  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    [variants],
  );
  const colorNames = useMemo(
    () => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[],
    [variants],
  );

  const hasSize = sizes.length > 0;
  const hasColor = colorNames.length > 0;
  // Chỉ hiện các size thật của sản phẩm (theo màu đang chọn); hết hàng thì làm mờ.
  const sizeOptions = useMemo(() => {
    const byColor = hasColor ? variants.filter((v) => v.color === color) : variants;
    const map = new Map<string, boolean>();
    for (const v of byColor) {
      if (!v.size) continue;
      map.set(v.size, (map.get(v.size) ?? false) || v.stockQuantity > 0);
    }
    return [...map.entries()].map(([name, inStock]) => ({ name, inStock }));
  }, [variants, color, hasColor]);

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (v) => (hasSize ? v.size === size : true) && (hasColor ? v.color === color : true),
      ),
    [variants, size, color, hasSize, hasColor],
  );

  const displayName = color ? `${product.name} - ${color}` : product.name;
  const colorOption = product.colorOptions?.find((o) => o.name === color);
  const price = selectedVariant?.price ?? colorOption?.price ?? product.price;
  const compareAt =
    selectedVariant?.compareAtPrice ??
    (colorOption?.price !== undefined ? colorOption.compareAt : product.compareAt);

  // Gallery theo màu đang chọn (như thẻ sản phẩm); màu chưa có ảnh riêng -> ảnh chung.
  const gallery =
    colorOption && colorOption.images.length > 0 ? colorOption.images : product.images;
  const stock = selectedVariant?.stockQuantity;

  const swatches = hasColor
    ? colorNames.map((name) => ({ name, hex: colorHex(name) ?? "#cccccc" }))
    : product.colors.map((c, i) => ({ name: `Màu ${i + 1}`, hex: c }));

  const add = () => {
    if ((hasSize && !size) || (hasColor && !color)) {
      setError(true);
      return;
    }
    setError(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.12fr_1fr] lg:gap-16">
      <div>
        <div className="relative aspect-4/5 overflow-hidden bg-muted">
          <Image
            src={gallery[active] ?? gallery[0]}
            alt={displayName}
            fill
            priority
            sizes="(min-width:1024px) 55vw, 100vw"
            unoptimized={isLocalImage(gallery[active] ?? gallery[0])}
            className="object-cover"
          />
        </div>
        {gallery.length > 1 ? (
          <div className="mt-2 flex gap-2">
            {gallery.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ảnh ${i + 1}`}
                className={`relative h-20 w-16 overflow-hidden border ${
                  i === active ? "border-foreground" : "border-transparent"
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="64px"
                  unoptimized={isLocalImage(img)}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">
            Cửa hàng
          </Link>
          <span className="text-[#999]">/</span>
          <span className="text-foreground">{product.category}</span>
        </nav>

        <h1 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
          {displayName}
        </h1>

        <div className="mt-2.5 flex items-center gap-3">
          <p className="text-[17px]">{formatPrice(price)}</p>
          {compareAt ? (
            <p className="text-[13px] text-[#999] line-through">{formatPrice(compareAt)}</p>
          ) : null}
          {stock !== undefined && stock <= 5 ? (
            <p className="text-[11px] text-[#999]">Còn {stock} sản phẩm</p>
          ) : null}
        </div>

        {swatches.length > 0 ? (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Màu sắc{color ? ` · ${color}` : ""}
            </p>
            <div className="mt-2 flex gap-2">
              {swatches.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  title={s.name}
                  onClick={() => {
                    setColor(hasColor ? s.name : null);
                    if (hasColor) {
                      // Đồng bộ ?color= lên URL (không điều hướng, không tải lại trang).
                      const url = new URL(window.location.href);
                      url.searchParams.set("color", s.name);
                      window.history.replaceState(null, "", url);
                    }
                    setSize(null);
                    setActive(0);
                    setError(false);
                  }}
                  className={`h-6 w-6 rounded-full ring-1 ring-inset ring-black/15 ${
                    color === s.name ? "outline outline-1 outline-offset-2 outline-foreground" : ""
                  }`}
                  style={{ backgroundColor: s.hex }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {hasSize ? (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Kích thước{size ? ` · ${size}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizeOptions.map((o) => (
                <button
                  key={o.name}
                  type="button"
                  disabled={!o.inStock}
                  onClick={() => {
                    setSize(o.name);
                    setError(false);
                  }}
                  className={`h-9 min-w-[44px] border px-3 text-[12px] transition-colors disabled:cursor-not-allowed disabled:text-[#bbb] disabled:line-through ${
                    size === o.name
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground hover:border-foreground"
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="mt-2 text-[12px] text-destructive">
            Vui lòng chọn đầy đủ {hasSize ? "size" : ""}
            {hasSize && hasColor ? " / " : ""}
            {hasColor ? "màu" : ""}
          </p>
        ) : null}

        <div className="mt-6">
          <Button
            type="button"
            onClick={add}
            className="h-12 w-full rounded-none px-10 text-xs font-normal uppercase tracking-[0.15em]"
          >
            {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
          </Button>
        </div>

        <div className="mt-8">
          <Accordion title="Mô tả sản phẩm">
            <p>{product.description ?? `${product.name} — thuộc bộ sưu tập của OXI Apparel.`}</p>
          </Accordion>
          <Accordion title="Chất liệu &amp; bảo quản">
            <p>Giặt máy ở nhiệt độ thường, không sấy nóng, không dùng chất tẩy mạnh.</p>
          </Accordion>
          <Accordion title="Vận chuyển &amp; đổi trả">
            <p>Miễn phí vận chuyển đơn hàng trên 999.000 ₫. Đổi size trong 7 ngày.</p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
