"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, SearchInput } from "@/components/admin/list-controls";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  Field,
  FormCard,
  RowActions,
  selectClass,
  textareaClass,
  DataTable,
} from "@/components/admin/form-controls";
import { slugify } from "@/lib/slugify";
import { ProductImagesSection } from "@/components/admin/products/product-images-section";
import {
  ProductVariantSection,
  type DraftResult,
} from "@/components/admin/products/product-variant-section";
import {
  gql,
  isAuthenticated,
  resolveImageUrl,
  type AdminCategory,
  type AdminProduct,
  type ProductStatus,
} from "@/lib/admin/client";

const PAGE_SIZE = 20;

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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

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
    <AdminShell
      title="Quản lý sản phẩm"
      subtitle={`${total} sản phẩm · trang ${page + 1}/${totalPages}`}
      maxWidth="1200px"
      error={error}
      action={
        <Button
          onClick={openCreate}
          className="h-11 rounded-none text-xs uppercase tracking-[0.1em]"
        >
          + Thêm sản phẩm
        </Button>
      }
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tìm sản phẩm theo tên…"
        summary={query ? `${total} kết quả cho “${query}”` : undefined}
      />

      {showForm ? (
        <div className="mb-6 space-y-6">
          <FormCard
            title={editingId ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            busy={busy}
            submitLabel="Lưu sản phẩm"
            onSubmit={onSubmit}
            onCancel={() => setShowForm(false)}
          >
            <Field label="Tên sản phẩm *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-none"
                placeholder="Sculpt - Black (Đen) - Bra"
              />
            </Field>
            <Field label="Slug (bỏ trống để tự sinh)">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-none"
                placeholder="sculpt-black-den-bra"
              />
            </Field>
            <Field label="Danh mục *">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className={selectClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mô tả" className="sm:col-span-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={textareaClass}
                placeholder="Mô tả sản phẩm…"
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className={selectClass}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
          </FormCard>

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

      <DataTable
        columns={[
          { label: "Sản phẩm" },
          { label: "Danh mục" },
          { label: "Giá" },
          { label: "Trạng thái" },
          { label: "Thao tác", right: true },
        ]}
      >
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
                variant={p.status === "ACTIVE" ? "default" : "secondary"}
                className="rounded-none text-[10px] uppercase tracking-[0.08em]"
              >
                {p.status}
              </Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <RowActions
                editLabel="Sửa / Biến thể"
                onEdit={() => openEdit(p)}
                onDelete={() => onDelete(p)}
              />
            </td>
          </tr>
        ))}
      </DataTable>

      {!busy && products.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          {query
            ? `Không tìm thấy sản phẩm nào cho “${query}”.`
            : "Chưa có sản phẩm."}
        </p>
      ) : null}

      {busy && products.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          Đang tải…
        </p>
      ) : null}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </AdminShell>
  );
}
