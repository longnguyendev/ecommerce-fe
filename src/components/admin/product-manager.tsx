"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductImagesSection } from "@/components/admin/product-images-section";
import {
  ProductVariantSection,
  type DraftResult,
} from "@/components/admin/product-variant-section";
import {
  gql,
  isAuthenticated,
  resolveImageUrl,
  type AdminCategory,
  type AdminProduct,
  type ProductStatus,
} from "@/lib/admin/client";

const PAGE_SIZE = 20;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductManager() {
  const router = useRouter();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // search đã debounce, dùng để gọi API
  const queryRef = useRef("");
  const requestId = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");

  // Dữ liệu ảnh/biến thể nhập khi tạo sản phẩm mới (lưu cùng lúc với sản phẩm).
  const [formKey, setFormKey] = useState(0);
  const draftImages = useRef<string[]>([]);
  const draftVariants = useRef<DraftResult | null>(null);
  const onDraftImages = useCallback((urls: string[]) => {
    draftImages.current = urls;
  }, []);
  const onDraftVariants = useCallback((r: DraftResult) => {
    draftVariants.current = r;
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadCategories = useCallback(async () => {
    const data = await gql<{ categories: { nodes: AdminCategory[] } }>(
      `query { categories(pagination: { take: 100 }) { nodes { id name slug } } }`,
    );
    setCategories(data.categories.nodes);
    setCategoryId((prev) => prev || data.categories.nodes[0]?.id || "");
  }, []);

  const loadProducts = useCallback(async () => {
    const id = ++requestId.current;
    setBusy(true);
    setError(null);
    try {
      const data = await gql<{
        products: { totalCount: number; nodes: AdminProduct[] };
      }>(
        `query Products($take: Int!, $skip: Int!, $filter: ProductFilterInput) {
          products(pagination: { take: $take, skip: $skip }, filter: $filter) {
            totalCount
            nodes { id name slug thumbnail status category { name } variants { price sku } }
          }
        }`,
        {
          take: PAGE_SIZE,
          skip: page * PAGE_SIZE,
          filter: query ? { search: query } : null,
        },
      );
      if (id !== requestId.current) return; // đã có yêu cầu mới hơn
      setProducts(data.products.nodes);
      setTotal(data.products.totalCount);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Tải sản phẩm thất bại");
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, [page, query]);

  // Debounce ô tìm kiếm: ngừng gõ 300ms mới tìm, và quay về trang đầu.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = search.trim();
      if (next !== queryRef.current) {
        queryRef.current = next;
        setQuery(next);
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    void loadCategories();
  }, [router, loadCategories]);

  useEffect(() => {
    if (isAuthenticated()) void loadProducts();
  }, [loadProducts]);

  function openCreate() {
    setFormKey((k) => k + 1);
    draftImages.current = [];
    draftVariants.current = null;
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setStatus("ACTIVE");
    setShowForm(true);
  }

  function openEdit(p: AdminProduct) {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setDescription("");
    setStatus(p.status);
    setShowForm(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const finalSlug = slug || slugify(name);
      const baseInput = {
        categoryId,
        name,
        slug: finalSlug,
        description: description || undefined,
        status,
      };

      if (editingId) {
        await gql(
          `mutation UpdateProduct($input: UpdateProductInput!) { updateProduct(input: $input) { id } }`,
          { input: { id: editingId, ...baseInput } },
        );
      } else {
        const draft = draftVariants.current;
        if (draft && "error" in draft) {
          setError(draft.error);
          return;
        }

        const created = await gql<{ createProduct: { id: string } }>(
          `mutation CreateProduct($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
          { input: baseInput },
        );
        const newId = created.createProduct.id;

        try {
          // Ảnh: ảnh đầu tiên là ảnh đại diện.
          const urls = draftImages.current;
          for (const [i, url] of urls.entries()) {
            await gql(
              `mutation AddImage($input: CreateProductImageInput!) { createProductImage(input: $input) { id } }`,
              {
                input: {
                  productId: newId,
                  url,
                  sortOrder: i,
                  isPrimary: i === 0,
                },
              },
            );
          }
          // Biến thể
          if (draft && draft.variants.length > 0) {
            await gql(
              `mutation Sync($input: SyncProductVariantsInput!) { syncProductVariants(input: $input) { id } }`,
              { input: { productId: newId, variants: draft.variants } },
            );
          }
        } finally {
          // Dù bước phụ lỗi, sản phẩm đã được tạo: chuyển sang chế độ sửa để người
          // dùng thấy phần đã lưu và sửa tiếp.
          setEditingId(newId);
          setSlug(finalSlug);
        }
      }

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu sản phẩm thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(p: AdminProduct) {
    if (!window.confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await gql(`mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`, {
        id: p.id,
      });
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xoá sản phẩm thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <AdminHeader />

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">
              Quản lý sản phẩm
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {total} sản phẩm · trang {page + 1}/{totalPages}
            </p>
          </div>
          <Button onClick={openCreate} className="h-11 rounded-none text-xs uppercase tracking-[0.1em]">
            + Thêm sản phẩm
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm theo tên…"
              aria-label="Tìm sản phẩm theo tên"
              className="h-10 rounded-none bg-background pr-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Xoá tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[16px] leading-none text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            ) : null}
          </div>
          {query ? (
            <span className="text-[12.5px] text-muted-foreground">
              {total} kết quả cho “{query}”
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mb-4 border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
            {error}
          </p>
        ) : null}

        {showForm ? (
          <div className="mb-6 space-y-6">
            <form
              onSubmit={onSubmit}
              className="rounded-lg border border-border bg-background p-6"
            >
              <h2 className="mb-4 text-[13px] uppercase tracking-[0.12em] text-foreground">
                {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  Tên sản phẩm *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-none"
                  placeholder="Sculpt - Black (Đen) - Bra"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  Slug (bỏ trống để tự sinh)
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-none"
                  placeholder="sculpt-black-den-bra"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  Danh mục *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="h-9 w-full rounded-none border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-none border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-foreground"
                  placeholder="Mô tả sản phẩm…"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  Trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="h-9 w-full rounded-none border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-10 rounded-none text-xs"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="h-10 rounded-none text-xs uppercase tracking-[0.1em]"
              >
                {busy ? "Đang lưu…" : "Lưu sản phẩm"}
              </Button>
            </div>
          </form>

            <ProductImagesSection
              key={`img-${editingId ?? `new-${formKey}`}`}
              productId={editingId}
              onDraftChange={onDraftImages}
            />
            <ProductVariantSection
              key={`var-${editingId ?? `new-${formKey}`}`}
              productId={editingId}
              skuPrefix={slug || slugify(name)}
              onDraftChange={onDraftVariants}
            />
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-4 py-3 font-normal">Sản phẩm</th>
                <th className="px-4 py-3 font-normal">Danh mục</th>
                <th className="px-4 py-3 font-normal">Giá</th>
                <th className="px-4 py-3 font-normal">Trạng thái</th>
                <th className="px-4 py-3 text-right font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(p.thumbnail)}
                        alt=""
                        className="h-12 w-12 rounded border border-border object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          /{p.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category.name}
                  </td>
                  <td className="px-4 py-3">
                    {p.variants[0]
                      ? `${p.variants[0].price.toLocaleString("vi-VN")} ₫`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        p.status === "ACTIVE" ? "default" : "secondary"
                      }
                      className="rounded-none text-[10px] uppercase tracking-[0.08em]"
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(p)}
                        className="h-7 rounded-none text-[11px]"
                      >
                        Sửa / Biến thể
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(p)}
                        className="h-7 rounded-none text-[11px]"
                      >
                        Xoá
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!busy && products.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            {query ? `Không tìm thấy sản phẩm nào cho “${query}”.` : "Chưa có sản phẩm."}
          </p>
        ) : null}

        {busy && products.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            Đang tải…
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="h-9 rounded-none text-xs"
          >
            ← Trước
          </Button>
          <span className="text-[12px] text-muted-foreground">
            Trang {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 rounded-none text-xs"
          >
            Sau →
          </Button>
        </div>
      </main>
    </div>
  );
}
