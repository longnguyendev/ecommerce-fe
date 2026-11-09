"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  DataTable,
  Field,
  FormCard,
  RowActions,
  selectClass,
  textareaClass,
} from "@/components/admin/form-controls";
import { Pagination, SearchInput } from "@/components/admin/list-controls";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  gql,
  isAuthenticated,
  resolveImageUrl,
  type AdminCategory,
  type AdminCollection,
  type AdminProduct,
  type ProductStatus,
} from "@/lib/admin/client";
import { slugify } from "@/lib/slugify";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 20;

export function ProductManager() {
  const router = useRouter();

  const [confirm, confirmDialog] = useConfirm();
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadCategories = useCallback(async () => {
    const data = await gql<{ categories: { nodes: AdminCategory[] } }>(
      `query { categories(pagination: { take: 100 }) { nodes { id name slug } } }`,
    );
    setCategories(data.categories.nodes);
    setCategoryId((prev) => prev || data.categories.nodes[0]?.id || "");
    const col = await gql<{ collections: AdminCollection[] }>(
      `query { collections { id name slug image sortOrder } }`,
    );
    setCollections(col.collections);
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
            nodes { id name slug thumbnail status category { name } variants { price } }
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
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setStatus("ACTIVE");
    setCollectionIds([]);
    setShowForm(true);
  }

  function openEdit(p: AdminProduct) {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setDescription("");
    setStatus(p.status);
    setCollectionIds([]);
    setShowForm(true);
    // Nạp các trường danh sách không có sẵn (danh mục, mô tả, collection).
    void gql<{
      product: {
        categoryId: string;
        description: string | null;
        collections: { id: string }[];
      };
    }>(`query P($id: ID!) { product(id: $id) { categoryId description collections { id } } }`, {
      id: p.id,
    })
      .then(({ product }) => {
        setCategoryId(product.categoryId);
        setDescription(product.description ?? "");
        setCollectionIds(product.collections.map((c) => c.id));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Tải sản phẩm thất bại"));
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
        collectionIds,
      };

      if (editingId) {
        await gql(
          `mutation UpdateProduct($input: UpdateProductInput!) { updateProduct(input: $input) { id } }`,
          { input: { id: editingId, ...baseInput } },
        );
      } else {
        const created = await gql<{ createProduct: { id: string } }>(
          `mutation CreateProduct($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
          { input: baseInput },
        );
        toast.success("Đã tạo sản phẩm. Thêm hình ảnh và biến thể tại đây.");
        // Hình ảnh + biến thể nhập ở trang riêng của sản phẩm vừa tạo.
        router.push(`/admin/products/${created.createProduct.id}/variants`);
        return;
      }

      await loadProducts();
      toast.success(editingId ? "Đã lưu sản phẩm" : "Đã tạo sản phẩm");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lưu sản phẩm thất bại";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(p: AdminProduct) {
    if (
      !(await confirm({
        title: `Xoá sản phẩm "${p.name}"?`,
        message: "Sản phẩm và các biến thể sẽ bị xoá.",
      }))
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await gql(`mutation DeleteProduct($id: ID!) { deleteProduct(id: $id) }`, {
        id: p.id,
      });
      await loadProducts();
      toast.success("Đã xoá sản phẩm");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xoá sản phẩm thất bại";
      setError(message);
      toast.error(message);
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
          className="h-11 rounded-none text-xs uppercase tracking-widest"
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
            {editingId ? (
              <p className="text-[12.5px] sm:col-span-2">
                <Link
                  href={`/admin/products/${editingId}/variants`}
                  className="underline underline-offset-4"
                >
                  Quản lý biến thể & hình ảnh →
                </Link>
              </p>
            ) : null}
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
            <Field label="Bộ sưu tập" className="sm:col-span-2">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {collections.length === 0 ? (
                  <span className="text-[12px] text-muted-foreground">Chưa có bộ sưu tập nào.</span>
                ) : null}
                {collections.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={collectionIds.includes(c.id)}
                      onChange={(e) =>
                        setCollectionIds((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                        )
                      }
                      className="h-4 w-4"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
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
        </div>
      ) : null}

      <DataTable
        columns={[
          { label: "Sản phẩm" },
          { label: "Danh mục" },
          { label: "Giá" },
          { label: "Biến thể" },
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
                  <p title={p.id} className="truncate font-mono text-[11px] text-muted-foreground">
                    {p.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{p.category.name}</td>
            <td className="px-4 py-3">
              {p.variants[0] ? `${p.variants[0].price.toLocaleString("vi-VN")} ₫` : "—"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              <Link
                href={`/admin/products/${p.id}/variants`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {p.variants.length > 0 ? `${p.variants.length} biến thể` : "Chưa có"}
              </Link>
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
              <RowActions editLabel="Sửa" onEdit={() => openEdit(p)} onDelete={() => onDelete(p)} />
            </td>
          </tr>
        ))}
      </DataTable>

      {!busy && products.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">
          {query ? `Không tìm thấy sản phẩm nào cho “${query}”.` : "Chưa có sản phẩm."}
        </p>
      ) : null}

      {busy && products.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-foreground">Đang tải…</p>
      ) : null}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      {confirmDialog}
    </AdminShell>
  );
}
