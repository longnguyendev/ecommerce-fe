"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  gql,
  isAuthenticated,
  type AdminCategory,
} from "@/lib/admin/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await gql<{ categories: { nodes: AdminCategory[] } }>(
        `query { categories(pagination: { take: 100 }) { nodes { id name slug } } }`,
      );
      setCategories(data.categories.nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải danh mục thất bại");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }
    void load();
  }, [router, load]);

  function reset() {
    setEditingId(null);
    setName("");
    setSlug("");
  }

  function openEdit(c: AdminCategory) {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const finalSlug = slug || slugify(name);
      if (editingId) {
        await gql(
          `mutation UpdateCategory($input: UpdateCategoryInput!) { updateCategory(input: $input) { id } }`,
          { input: { id: editingId, name, slug: finalSlug } },
        );
      } else {
        await gql(
          `mutation CreateCategory($input: CreateCategoryInput!) { createCategory(input: $input) { id } }`,
          { input: { name, slug: finalSlug } },
        );
      }
      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu danh mục thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(c: AdminCategory) {
    if (!window.confirm(`Xoá danh mục "${c.name}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await gql(`mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) }`, {
        id: c.id,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xoá danh mục thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <AdminHeader />
      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Quản lý danh mục</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {categories.length} danh mục
            </p>
          </div>
          <Button
            onClick={() => {
              reset();
              window.scrollTo({ top: 0 });
            }}
            className="h-11 rounded-none text-xs uppercase tracking-[0.1em]"
          >
            + Thêm danh mục
          </Button>
        </div>

        {error ? (
          <p className="mb-4 border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="mb-6 rounded-lg border border-border bg-background p-6"
        >
          <h2 className="mb-4 text-[13px] uppercase tracking-[0.12em]">
            {editingId ? "Sửa danh mục" : "Thêm danh mục"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Tên *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-none"
                placeholder="Bra"
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
                placeholder="bra"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                className="h-10 rounded-none text-xs"
              >
                Huỷ
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={busy}
              className="h-10 rounded-none text-xs uppercase tracking-[0.1em]"
            >
              {busy ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </form>

        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-4 py-3 font-normal">Tên</th>
                <th className="px-4 py-3 font-normal">Slug</th>
                <th className="px-4 py-3 text-right font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(c)}
                        className="h-7 rounded-none text-[11px]"
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(c)}
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
      </main>
    </div>
  );
}
