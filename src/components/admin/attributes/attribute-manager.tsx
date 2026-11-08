"use client";

import { useCallback, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Field, FormCard, RowActions } from "@/components/admin/form-controls";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminList } from "@/hooks/use-admin-list";
import { gql } from "@/lib/admin/client";

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
  const fetchAttributes = useCallback(
    async () =>
      (
        await gql<{ attributes: { nodes: Attribute[] } }>(
          `query { attributes(pagination: { take: 100 }) { nodes { id name values { id value } } } }`,
        )
      ).attributes.nodes,
    [],
  );
  const {
    items: attributes,
    busy,
    error,
    run,
  } = useAdminList(fetchAttributes, "Tải thuộc tính thất bại");

  const [confirm, confirmDialog] = useConfirm();
  const [name, setName] = useState("");
  const [values, setValues] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newValueByAttr, setNewValueByAttr] = useState<Record<string, string>>({});

  function reset() {
    setName("");
    setValues("");
    setEditingId(null);
  }

  function openEdit(a: Attribute) {
    setEditingId(a.id);
    setName(a.name);
    setValues(a.values.map((v) => v.value).join(", "));
    window.scrollTo({ top: 0 });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valueList = values
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const ok = await run(async () => {
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
    }, "Lưu thuộc tính thất bại");
    if (ok) reset();
  }

  async function addValue(attr: Attribute) {
    const value = (newValueByAttr[attr.id] ?? "").trim();
    if (!value) return;
    const ok = await run(async () => {
      await gql(
        `mutation AddValue($input: CreateAttributeValueInput!) { addAttributeValue(input: $input) { id } }`,
        { input: { attributeId: attr.id, value } },
      );
    }, "Thêm giá trị thất bại");
    if (ok) setNewValueByAttr((prev) => ({ ...prev, [attr.id]: "" }));
  }

  async function deleteValue(v: AttributeValue) {
    if (!(await confirm({ title: `Xoá giá trị "${v.value}"?` }))) return;
    await run(async () => {
      await gql(`mutation DeleteValue($id: ID!) { deleteAttributeValue(id: $id) }`, { id: v.id });
    }, "Xoá giá trị thất bại");
  }

  async function deleteAttr(a: Attribute) {
    if (
      !(await confirm({
        title: `Xoá thuộc tính "${a.name}"?`,
        message: "Các giá trị của thuộc tính cũng bị xoá.",
      }))
    )
      return;
    await run(async () => {
      await gql(`mutation DeleteAttr($id: ID!) { deleteAttribute(id: $id) }`, {
        id: a.id,
      });
    }, "Xoá thuộc tính thất bại");
  }

  return (
    <AdminShell
      title="Quản lý thuộc tính"
      subtitle={`${attributes.length} thuộc tính`}
      error={error}
    >
      <FormCard
        title={editingId ? "Sửa thuộc tính" : "Thêm thuộc tính"}
        busy={busy}
        onSubmit={onSubmit}
        onCancel={editingId ? reset : undefined}
      >
        <Field label="Tên thuộc tính *">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-none"
            placeholder="Màu sắc"
          />
        </Field>
        <Field label="Giá trị (phân cách bằng dấu phẩy)">
          <Input
            value={values}
            onChange={(e) => setValues(e.target.value)}
            className="rounded-none"
            placeholder="Đen, Trắng, Be"
          />
        </Field>
      </FormCard>

      <div className="space-y-4">
        {attributes.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] uppercase tracking-[0.1em]">{a.name}</h2>
              <RowActions onEdit={() => openEdit(a)} onDelete={() => deleteAttr(a)} />
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
                  setNewValueByAttr((prev) => ({
                    ...prev,
                    [a.id]: e.target.value,
                  }))
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
      {confirmDialog}
    </AdminShell>
  );
}
