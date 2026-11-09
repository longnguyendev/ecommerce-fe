"use client";

import { useCallback, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, Field, FormCard, RowActions } from "@/components/admin/form-controls";
import { AlertDialog } from "@/components/shared/alert-dialog";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminList } from "@/hooks/use-admin-list";
import { gql, type AdminCategory } from "@/lib/admin/client";
import { slugify } from "@/lib/slugify";

type CategoryRow = AdminCategory & { productCount: number };

export function CategoryManager() {
  const fetchCategories = useCallback(async (): Promise<CategoryRow[]> => {
    const { categories } = await gql<{ categories: { nodes: AdminCategory[] } }>(
      `query { categories(pagination: { take: 100 }) { nodes { id name slug } } }`,
    );
    const nodes = categories.nodes;
    if (nodes.length === 0) return [];

    // Một request đếm sản phẩm cho tất cả danh mục (alias theo chỉ số).
    const vars = nodes.map((_, i) => `$f${i}: ProductFilterInput`).join(", ");
    const fields = nodes
      .map((_, i) => `c${i}: products(pagination: { take: 1 }, filter: $f${i}) { totalCount }`)
      .join("\n");
    const variables = Object.fromEntries(nodes.map((c, i) => [`f${i}`, { categoryId: c.id }]));
    const counts = await gql<Record<string, { totalCount: number }>>(
      `query Counts(${vars}) { ${fields} }`,
      variables,
    );

    return nodes.map((c, i) => ({ ...c, productCount: counts[`c${i}`]?.totalCount ?? 0 }));
  }, []);
  const {
    items: categories,
    busy,
    error,
    run,
  } = useAdminList(fetchCategories, "Tải danh mục thất bại");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [confirm, confirmDialog] = useConfirm();
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  function reset() {
    setEditingId(null);
    setName("");
    setSlug("");
  }

  function openEdit(c: AdminCategory) {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    window.scrollTo({ top: 0 });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name, slug: slug || slugify(name) };
    const ok = await run(
      async () => {
        if (editingId) {
          await gql(
            `mutation UpdateCategory($input: UpdateCategoryInput!) { updateCategory(input: $input) { id } }`,
            { input: { id: editingId, ...input } },
          );
        } else {
          await gql(
            `mutation CreateCategory($input: CreateCategoryInput!) { createCategory(input: $input) { id } }`,
            { input },
          );
        }
      },
      "Lưu danh mục thất bại",
      true,
      editingId ? "Đã lưu danh mục" : "Đã tạo danh mục",
    );
    if (ok) reset();
  }

  async function onDelete(c: CategoryRow) {
    // Kiểm tra trước: danh mục đang chứa sản phẩm thì báo bằng popup, không hỏi xác nhận xoá.
    try {
      const { products } = await gql<{ products: { totalCount: number } }>(
        `query Count($filter: ProductFilterInput) { products(pagination: { take: 1 }, filter: $filter) { totalCount } }`,
        { filter: { categoryId: c.id } },
      );
      if (products.totalCount > 0) {
        setNotice({
          title: "Không thể xoá danh mục",
          message: `Danh mục "${c.name}" đã chứa ${products.totalCount} sản phẩm. Hãy chuyển các sản phẩm sang danh mục khác trước khi xoá.`,
        });
        return;
      }
    } catch {
      /* bỏ qua: để BE quyết định ở bước xoá */
    }

    if (
      !(await confirm({
        title: `Xoá danh mục "${c.name}"?`,
        message: "Thao tác này không thể hoàn tác.",
      }))
    )
      return;
    try {
      await run(
        async () => {
          try {
            await gql(`mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) }`, {
              id: c.id,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            throw new Error(
              msg.includes("conflict")
                ? `Không thể xoá "${c.name}": danh mục còn danh mục con hoặc còn sản phẩm.`
                : msg || "Xoá danh mục thất bại",
            );
          }
        },
        "Xoá danh mục thất bại",
        true,
        "Đã xoá danh mục",
      );
    } catch {
      /* run đã xử lý lỗi */
    }
  }

  return (
    <AdminShell
      title="Quản lý danh mục"
      subtitle={`${categories.length} danh mục`}
      error={error}
      action={
        <Button
          onClick={() => {
            reset();
            window.scrollTo({ top: 0 });
          }}
          className="h-11 rounded-none text-xs uppercase tracking-[0.1em]"
        >
          + Thêm danh mục
        </Button>
      }
    >
      <FormCard
        title={editingId ? "Sửa danh mục" : "Thêm danh mục"}
        busy={busy}
        onSubmit={onSubmit}
        onCancel={editingId ? reset : undefined}
      >
        <Field label="Tên *">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-none"
            placeholder="Bra"
          />
        </Field>
        <Field label="Slug (bỏ trống để tự sinh)">
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-none"
            placeholder="bra"
          />
        </Field>
      </FormCard>

      <DataTable
        columns={[
          { label: "Tên" },
          { label: "Slug" },
          { label: "Sản phẩm" },
          { label: "Thao tác", right: true },
        ]}
      >
        {categories.map((c) => (
          <tr key={c.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 font-medium">{c.name}</td>
            <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
            <td className="px-4 py-3">{c.productCount}</td>
            <td className="px-4 py-3 text-right">
              <RowActions onEdit={() => openEdit(c)} onDelete={() => onDelete(c)} />
            </td>
          </tr>
        ))}
      </DataTable>
      {confirmDialog}
      <AlertDialog
        open={notice !== null}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
    </AdminShell>
  );
}
