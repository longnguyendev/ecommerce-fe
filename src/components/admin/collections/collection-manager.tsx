"use client";

import { useCallback, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, Field, FormCard, RowActions } from "@/components/admin/form-controls";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminList } from "@/hooks/use-admin-list";
import { gql, resolveImageUrl, uploadImage, type AdminCollection } from "@/lib/admin/client";
import { slugify } from "@/lib/slugify";

export function CollectionManager() {
  const fetchCollections = useCallback(
    async () =>
      (
        await gql<{ collections: AdminCollection[] }>(
          `query { collections { id name slug image sortOrder } }`,
        )
      ).collections,
    [],
  );
  const {
    items: collections,
    busy,
    error,
    setError,
    run,
  } = useAdminList(fetchCollections, "Tải bộ sưu tập thất bại");

  const [confirm, confirmDialog] = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [uploading, setUploading] = useState(false);

  function reset() {
    setEditingId(null);
    setName("");
    setSlug("");
    setImage("");
    setSortOrder("0");
  }

  function openEdit(c: AdminCollection) {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setImage(c.image ?? "");
    setSortOrder(String(c.sortOrder));
    window.scrollTo({ top: 0 });
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      setImage(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      name,
      slug: slug || slugify(name),
      image: image || undefined,
      sortOrder: Number(sortOrder) || 0,
    };
    const ok = await run(
      async () => {
        if (editingId) {
          await gql(
            `mutation UpdateCollection($input: UpdateCollectionInput!) { updateCollection(input: $input) { id } }`,
            { input: { id: editingId, ...input } },
          );
        } else {
          await gql(
            `mutation CreateCollection($input: CreateCollectionInput!) { createCollection(input: $input) { id } }`,
            { input },
          );
        }
      },
      "Lưu bộ sưu tập thất bại",
      true,
      editingId ? "Đã lưu bộ sưu tập" : "Đã tạo bộ sưu tập",
    );
    if (ok) reset();
  }

  async function onDelete(c: AdminCollection) {
    if (
      !(await confirm({
        title: `Xoá bộ sưu tập "${c.name}"?`,
        message: "Các sản phẩm trong bộ sưu tập không bị xoá.",
      }))
    )
      return;
    await run(
      async () => {
        await gql(`mutation DeleteCollection($id: ID!) { deleteCollection(id: $id) }`, {
          id: c.id,
        });
      },
      "Xoá bộ sưu tập thất bại",
      true,
      "Đã xoá bộ sưu tập",
    );
  }

  return (
    <AdminShell
      title="Quản lý bộ sưu tập"
      subtitle={`${collections.length} bộ sưu tập`}
      error={error}
      action={
        <Button
          onClick={() => {
            reset();
            window.scrollTo({ top: 0 });
          }}
          className="h-11 rounded-none text-xs uppercase tracking-[0.1em]"
        >
          + Thêm bộ sưu tập
        </Button>
      }
    >
      <FormCard
        title={editingId ? "Sửa bộ sưu tập" : "Thêm bộ sưu tập"}
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
            placeholder="Studio"
          />
        </Field>
        <Field label="Slug (bỏ trống để tự sinh)">
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-none"
            placeholder="studio"
          />
        </Field>
        <Field label="Ảnh đại diện (URL hoặc tải lên)">
          <div className="flex items-center gap-2">
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="rounded-none"
              placeholder="/images/collections/studio.webp"
            />
            <label className="flex h-9 shrink-0 cursor-pointer items-center border border-border px-3 text-[12px] hover:bg-muted">
              {uploading ? "…" : "Tải ảnh"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void onPickImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </Field>
        <Field label="Thứ tự hiển thị">
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-none"
          />
        </Field>
      </FormCard>

      <DataTable
        columns={[
          { label: "Bộ sưu tập" },
          { label: "Slug" },
          { label: "Thứ tự" },
          { label: "Thao tác", right: true },
        ]}
      >
        {collections.map((c) => (
          <tr key={c.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageUrl(c.image)}
                    alt=""
                    className="h-12 w-10 border border-border object-cover"
                  />
                ) : (
                  <div className="h-12 w-10 border border-dashed border-border" />
                )}
                <span className="font-medium">{c.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-muted-foreground">/{c.slug}</td>
            <td className="px-4 py-3">{c.sortOrder}</td>
            <td className="px-4 py-3 text-right">
              <RowActions onEdit={() => openEdit(c)} onDelete={() => onDelete(c)} />
            </td>
          </tr>
        ))}
      </DataTable>
      {confirmDialog}
    </AdminShell>
  );
}
