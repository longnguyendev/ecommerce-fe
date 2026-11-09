"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/catalog";
import { fetchProductDetail } from "@/lib/storefront/api";

import { useWishlist } from "./wishlist-provider";

type Loaded = { slug: string; product: Product | null; failed: boolean };

/** Trang /wishlist: tải thông tin mới nhất (giá, ảnh) của các sản phẩm đã lưu. */
export function WishlistView() {
  const { slugs, ready, remove } = useWishlist();
  const [loaded, setLoaded] = useState<Map<string, Loaded>>(new Map());

  useEffect(() => {
    if (!ready) return;
    const missing = slugs.filter((s) => !loaded.has(s));
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missing.map(async (slug): Promise<Loaded> => {
        try {
          const detail = await fetchProductDetail(slug);
          return { slug, product: detail?.product ?? null, failed: false };
        } catch {
          return { slug, product: null, failed: true };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setLoaded((prev) => {
        const next = new Map(prev);
        for (const r of results) next.set(r.slug, r);
        return next;
      });
      // Sản phẩm đã ngừng bán / bị xoá (API trả null, không phải lỗi mạng): bỏ khỏi danh sách.
      const gone = results.filter((r) => !r.product && !r.failed).map((r) => r.slug);
      if (gone.length > 0) remove(gone);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, slugs, loaded, remove]);

  const loading = !ready || slugs.some((s) => !loaded.has(s));
  const products = slugs.map((s) => loaded.get(s)?.product).filter((p): p is Product => Boolean(p));
  const failedCount = slugs.filter((s) => loaded.get(s)?.failed).length;

  return (
    <div className="container-page py-10 lg:py-14">
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">Yêu thích</p>
      <h1 className="mt-2.5 text-[clamp(22px,2.35vw,34px)] font-medium tracking-[-0.015em]">
        Sản phẩm bạn đã lưu{ready && slugs.length > 0 ? ` (${slugs.length})` : ""}
      </h1>

      {loading && products.length === 0 ? (
        <div
          className="mt-8 grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4"
          aria-busy="true"
        >
          {Array.from({ length: Math.min(Math.max(slugs.length, 4), 8) }, (_, i) => (
            <div key={i} className="aspect-3/4 animate-pulse bg-muted" />
          ))}
        </div>
      ) : ready && slugs.length === 0 ? (
        <div className="mt-10 max-w-md">
          <p className="text-[13.5px] text-muted-foreground">
            Chưa có sản phẩm nào. Bấm biểu tượng tim trên sản phẩm để lưu lại xem sau.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center bg-foreground px-8 text-[11.5px] uppercase tracking-[0.15em] text-background hover:opacity-85"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <>
          {failedCount > 0 ? (
            <p role="alert" className="mt-4 text-[12px] text-destructive">
              Không tải được {failedCount} sản phẩm. Vui lòng tải lại trang.
            </p>
          ) : null}
          <div className="mt-8 grid grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
