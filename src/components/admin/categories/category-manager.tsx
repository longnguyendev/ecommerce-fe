"use client";

import { useCallback, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, Field, FormCard, RowActions } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminList } from "@/hooks/use-admin-list";
import { gql, type AdminCategory } from "@/lib/admin/client";
import { slugify } from "@/lib/slugify";

export function CategoryManager() {
  const fetchCategories = useCallback(
    async () =>
      (
        await gql<{ categories: { nodes: AdminCategory[] } }>(
          `query { categories(pagination: { take: 100 }) { nodes { id name slug } } }`,
        )
      ).categories.nodes,
    [],
  );
  const {
    items: categories,
    busy,
    error,
    run,
  } = useAdminList(fetchCategories, "Tải danh mục thất bại");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

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
    const ok = await run(async () => {
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
    }, "Lưu danh mục thất bại");
    if (ok) reset();
  }

  async function onDelete(c: AdminCategory) {
    if (!window.confirm(`Xoá danh mục "${c.name}"?`)) return;
    await run(async () => {
      await gql(`mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) }`, { id: c.id });
    }, "Xoá danh mục thất bại");
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
        columns={[{ label: "Tên" }, { label: "Slug" }, { label: "Thao tác", right: true }]}
      >
        {categories.map((c) => (
          <tr key={c.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 font-medium">{c.name}</td>
            <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
            <td className="px-4 py-3 text-right">
              <RowActions onEdit={() => openEdit(c)} onDelete={() => onDelete(c)} />
            </td>
          </tr>
        ))}
      </DataTable>
    </AdminShell>
  );
}
