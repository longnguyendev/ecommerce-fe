"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gql, isAuthenticated } from "@/lib/admin/client";

interface AttributeValue {
  id: string;
  value: string;
}
interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export function AttributeManager() {
  const router = useRouter();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [values, setValues] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newValueByAttr, setNewValueByAttr] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await gql<{ attributes: { nodes: Attribute[] } }>(
        `query { attributes(pagination: { take: 100 }) { nodes { id name values { id value } } } }`,
      );
      setAttributes(data.attributes.nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải thuộc tính thất bại");
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
    setName("");
    setValues("");
    setEditingId(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const valueList = values
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (editingId) {
        await gql(
          `mutation UpdateAttribute($input: UpdateAttributeInput!) { updateAttribute(input: $input) { id } }`,
          { input: { id: editingId, name, values: valueList } },
        );
      } else {
        await gql(
          `mutation CreateAttribute($input: CreateAttributeInput!) { createAttribute(input: $input) { id } }`,
          { input: { name, values: valueList } },
        );
      }
      reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thuộc tính thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function addValue(attr: Attribute) {
    const value = (newValueByAttr[attr.id] ?? "").trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await gql(
        `mutation AddValue($input: CreateAttributeValueInput!) { addAttributeValue(input: $input) { id } }`,
        { input: { attributeId: attr.id, value } },
      );
      setNewValueByAttr((prev) => ({ ...prev, [attr.id]: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm giá trị thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function deleteValue(v: AttributeValue) {
    if (!window.confirm(`Xoá giá trị "${v.value}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await gql(
        `mutation DeleteValue($id: ID!) { deleteAttributeValue(id: $id) }`,
        { id: v.id },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xoá giá trị thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAttr(a: Attribute) {
    if (!window.confirm(`Xoá thuộc tính "${a.name}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await gql(`mutation DeleteAttr($id: ID!) { deleteAttribute(id: $id) }`, {
        id: a.id,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xoá thuộc tính thất bại");
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
            <h1 className="text-2xl font-medium tracking-tight">Quản lý thuộc tính</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {attributes.length} thuộc tính
            </p>
          </div>
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
            {editingId ? "Sửa thuộc tính" : "Thêm thuộc tính"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Tên thuộc tính *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-none"
                placeholder="Màu sắc"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Giá trị (phân cách bằng dấu phẩy)
              </label>
              <Input
                value={values}
                onChange={(e) => setValues(e.target.value)}
                className="rounded-none"
                placeholder="Đen, Trắng, Be"
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

        <div className="space-y-4">
          {attributes.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] uppercase tracking-[0.1em]">{a.name}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(a.id);
                      setName(a.name);
                      setValues(a.values.map((v) => v.value).join(", "));
                      window.scrollTo({ top: 0 });
                    }}
                    className="h-7 rounded-none text-[11px]"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAttr(a)}
                    className="h-7 rounded-none text-[11px]"
                  >
                    Xoá
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.values.map((v) => (
                  <Badge
                    key={v.id}
                    variant="secondary"
                    className="group/value rounded-none text-[12px]"
                  >
                    {v.value}
                    <button
                      type="button"
                      onClick={() => deleteValue(v)}
                      aria-label={`Xoá ${v.value}`}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={newValueByAttr[a.id] ?? ""}
                  onChange={(e) =>
                    setNewValueByAttr((prev) => ({ ...prev, [a.id]: e.target.value }))
                  }
                  className="h-8 rounded-none text-[13px]"
                  placeholder="Thêm giá trị mới…"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addValue(a)}
                  disabled={busy}
                  className="h-8 shrink-0 rounded-none text-[11px]"
                >
                  Thêm
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
