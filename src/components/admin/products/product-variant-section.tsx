"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { SaveButton } from "@/components/admin/form-controls";
import { ProductImagesSection } from "@/components/admin/products/product-images-section";
import {
  buildCombos,
  comboKey,
  DEFAULT_COMBO,
  resolveRow,
  VARIANT_FIELDS,
  type Attribute,
  type Combo,
  type DraftResult,
  type DraftVariant,
  type Option,
  type RowData,
  type Variant,
} from "@/components/admin/products/variant-logic";
import { VariantOptionsEditor } from "@/components/admin/products/variant-options-editor";
import { VariantRow } from "@/components/admin/products/variant-row";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gql } from "@/lib/admin/client";
import { slugify } from "@/lib/slugify";
import { toast } from "@/lib/toast";

export type { DraftResult, DraftVariant };

/** Biến thể + hình ảnh của một sản phẩm đã tồn tại; lưu qua nút "Lưu biến thể". */
export function ProductVariantSection({ productId }: { productId: string }) {
  // Đồng bộ giữa mục ảnh (gán màu) và bảng biến thể (hiện ảnh theo màu).
  const [variantsVersion, setVariantsVersion] = useState(0);
  const [imagesToken, setImagesToken] = useState(0);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [rows, setRows] = useState<Record<string, RowData>>({});
  const [bulkPrice, setBulkPrice] = useState("");
  const [confirm, confirmDialog] = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ảnh của sản phẩm theo màu: attributeValueId -> url đầu tiên. */
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  /** Index của option đang mở danh sách gợi ý giá trị. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const attrData = await gql<{ attributes: { nodes: Attribute[] } }>(
        `query { attributes(pagination: { take: 50 }) { nodes { id name values { id value } } } }`,
      );
      setAttributes(attrData.attributes.nodes);

      const varData = await gql<{ productVariants: { nodes: Variant[] } }>(
        `query Variants($pid: ID!) {
          productVariants(pagination: { take: 100 }, filter: { productId: $pid }) {
            nodes { ${VARIANT_FIELDS} }
          }
        }`,
        { pid: productId },
      );

      const variants = [...varData.productVariants.nodes].reverse();
      const nextOptions: Option[] = [];
      const nextRows: Record<string, RowData> = {};
      for (const v of variants) {
        const opts = v.attributes.map((a) => ({
          attributeId: a.attribute.id,
          value: a.attributeValue.value,
        }));
        for (const o of opts) {
          let opt = nextOptions.find((x) => x.attributeId === o.attributeId);
          if (!opt) {
            opt = { attributeId: o.attributeId, values: [], draft: "" };
            nextOptions.push(opt);
          }
          if (!opt.values.includes(o.value)) opt.values.push(o.value);
        }
        nextRows[comboKey(opts)] = {
          sku: v.sku,
          price: String(v.price),
          stock: String(v.stockQuantity),
          stockLocked: true,
        };
      }
      setOptions(nextOptions);
      setRows(nextRows);
      setHasVariants(nextOptions.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải biến thể thất bại");
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const combos = useMemo(() => (hasVariants ? buildCombos(options) : []), [hasVariants, options]);

  const usedAttributeIds = options.map((o) => o.attributeId);
  const canAddOption = attributes.some((a) => !usedAttributeIds.includes(a.id));

  function patchOption(index: number, patch: Partial<Option>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function addOption() {
    const next = attributes.find((a) => !usedAttributeIds.includes(a.id));
    if (!next) return;
    setOptions((prev) => [...prev, { attributeId: next.id, values: [], draft: "" }]);
  }

  async function removeOption(index: number) {
    const name = attributes.find((a) => a.id === options[index]?.attributeId)?.name;
    const ok = await confirm({
      title: `Xoá nhóm biến thể${name ? ` "${name}"` : ""}?`,
      message: "Các tổ hợp biến thể liên quan sẽ bị gỡ khi bạn bấm “Lưu biến thể”.",
    });
    if (!ok) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function addValue(index: number, text?: string) {
    const opt = options[index];
    const typed = (text ?? opt.draft).trim();
    if (!typed) return;
    // Trùng với giá trị có sẵn của thuộc tính -> dùng đúng cách viết đã có.
    const existing = attributes
      .find((a) => a.id === opt.attributeId)
      ?.values.find((v) => v.value.toLowerCase() === typed.toLowerCase());
    const value = existing?.value ?? typed;
    if (opt.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      patchOption(index, { draft: "" });
      return;
    }
    patchOption(index, { values: [...opt.values, value], draft: "" });
  }

  async function removeValue(index: number, value: string) {
    const ok = await confirm({
      title: `Xoá giá trị "${value}"?`,
      message: "Các biến thể dùng giá trị này sẽ bị gỡ khi bạn bấm “Lưu biến thể”.",
    });
    if (!ok) return;
    patchOption(index, {
      values: options[index].values.filter((v) => v !== value),
    });
  }

  function patchRow(combo: Combo, patch: Partial<RowData>) {
    setRows((prev) => ({
      ...prev,
      [combo.key]: { ...resolveRow(prev, combo), ...patch },
    }));
  }

  /** Giá trị có sẵn của thuộc tính, chưa được chọn, lọc theo chữ đang gõ. */
  function suggestionsFor(opt: Option): string[] {
    const attr = attributes.find((a) => a.id === opt.attributeId);
    if (!attr) return [];
    const q = opt.draft.trim().toLowerCase();
    const chosen = new Set(opt.values.map((v) => v.toLowerCase()));
    return attr.values
      .map((v) => v.value)
      .filter((v) => !chosen.has(v.toLowerCase()))
      .filter((v) => !q || v.toLowerCase().includes(q));
  }

  // Ảnh theo màu: nạp lại khi ảnh sản phẩm đổi.
  useEffect(() => {
    if (!productId) return;
    void gql<{ productImages: { nodes: { url: string; attributeValueId: string | null }[] } }>(
      `query ColorImages($pid: ID!) {
        productImages(pagination: { take: 100 }, filter: { productId: $pid }) {
          nodes { url attributeValueId }
        }
      }`,
      { pid: productId },
    )
      .then(({ productImages }) => {
        const map: Record<string, string> = {};
        for (const i of productImages.nodes) {
          if (i.attributeValueId && !map[i.attributeValueId]) map[i.attributeValueId] = i.url;
        }
        setColorImages(map);
      })
      .catch(() => setColorImages({}));
  }, [productId, imagesToken]);

  const colorAttributeId = attributes.find((a) => a.name === "Màu sắc")?.id;

  /** Id giá trị màu của một tổ hợp (null nếu tổ hợp không có màu / màu chưa tồn tại). */
  function colorValueId(combo: Combo): string | null {
    const text = combo.options.find((o) => o.attributeId === colorAttributeId)?.value;
    if (!text) return null;
    const attr = attributes.find((a) => a.id === colorAttributeId);
    return attr?.values.find((v) => v.value === text)?.id ?? null;
  }

  function imageFor(combo: Combo): string | null {
    const id = colorValueId(combo);
    return id ? (colorImages[id] ?? null) : null;
  }

  function applyBulk() {
    setRows((prev) => {
      const next = { ...prev };
      for (const c of combos) {
        const cur = resolveRow(prev, c);
        next[c.key] = {
          ...cur,
          price: bulkPrice !== "" ? bulkPrice : cur.price,
        };
      }
      return next;
    });
  }

  function toggleHasVariants(checked: boolean) {
    setHasVariants(checked);
    if (checked && options.length === 0 && attributes.length > 0) {
      setOptions([{ attributeId: attributes[0].id, values: [], draft: "" }]);
    }
  }

  function buildVariants(): DraftResult {
    const list = hasVariants ? combos : [{ ...DEFAULT_COMBO, label: "" }];

    if (hasVariants && list.length === 0) {
      return { error: "Thêm ít nhất một giá trị cho thuộc tính." };
    }

    const prefix = productId.slice(0, 6).toUpperCase();

    const variants: DraftVariant[] = [];
    for (const c of list) {
      const r = resolveRow(rows, c);
      if (r.price === "") {
        return {
          error: c.label ? `Nhập giá cho biến thể ${c.label}` : "Nhập giá sản phẩm",
        };
      }
      const sku = r.sku.trim() || `${prefix}${c.label ? "-" + slugify(c.label) : ""}`;
      variants.push({
        sku,
        price: Number(r.price),
        // Không gửi tồn: tồn chỉ đổi qua phiếu nhập / điều chỉnh ở trang Kho.
        isActive: true,
        options: c.options,
      });
    }
    return { variants };
  }

  async function save() {
    setError(null);

    const result = buildVariants();
    if ("error" in result) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setBusy(true);
    try {
      await gql(
        `mutation Sync($input: SyncProductVariantsInput!) {
          syncProductVariants(input: $input) { id }
        }`,
        { input: { productId, variants: result.variants } },
      );
      await load();
      toast.success("Đã lưu biến thể");
      setVariantsVersion((v) => v + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lưu biến thể thất bại";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const displayCombos = hasVariants ? combos : [DEFAULT_COMBO];
  const totalStock = displayCombos
    .map((c) => Number(resolveRow(rows, c).stock) || 0)
    .reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <label className="mb-4 flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => toggleHasVariants(e.target.checked)}
          className="h-4 w-4"
        />
        Sản phẩm này có nhiều biến thể. Ví dụ như khác nhau về kích thước, màu sắc.
      </label>

      {error ? (
        <p className="mb-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      ) : null}

      {hasVariants ? (
        <VariantOptionsEditor
          options={options}
          attributes={attributes}
          openIndex={openIndex}
          canAddOption={canAddOption}
          suggestionsFor={suggestionsFor}
          onOpenIndex={setOpenIndex}
          onPatchOption={patchOption}
          onRemoveOption={removeOption}
          onAddOption={addOption}
          onAddValue={addValue}
          onRemoveValue={removeValue}
        />
      ) : null}

      <ProductImagesSection
        productId={productId}
        reloadToken={variantsVersion}
        onChange={() => setImagesToken((v) => v + 1)}
      />

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-medium">
            {hasVariants ? `${combos.length} biến thể` : "Giá & tồn kho"}
          </h2>
          {hasVariants && combos.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <Input
                type="number"
                min={0}
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Giá cho tất cả"
                className="h-8 w-36 rounded text-[12.5px]"
              />
              <Button type="button" variant="outline" size="sm" onClick={applyBulk} className="h-8">
                Áp dụng
              </Button>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-border">
          {displayCombos.map((c) => (
            <VariantRow
              key={c.key}
              combo={c}
              row={resolveRow(rows, c)}
              imageUrl={imageFor(c)}
              missingImage={colorValueId(c) !== null && !imageFor(c)}
              onPatch={(patch) => patchRow(c, patch)}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px] text-muted-foreground">
            Tổng tồn kho: {totalStock} khả dụng ·{" "}
            <Link href="/admin/inventory" className="underline underline-offset-2">
              Nhập hàng / điều chỉnh ở trang Kho
            </Link>
          </span>
          <div className="flex items-center gap-3">
            <SaveButton busy={busy} onClick={save}>
              Lưu biến thể
            </SaveButton>
          </div>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}
