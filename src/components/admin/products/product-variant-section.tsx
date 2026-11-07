"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ValueCombobox } from "@/components/admin/products/value-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slugify";
import { gql, resolveImageUrl, uploadImage } from "@/lib/admin/client";
import {
  buildCombos,
  comboKey,
  DEFAULT_COMBO,
  formatVnd,
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

export type { DraftResult, DraftVariant };

/**
 * - Có `productId`: sửa sản phẩm đã tồn tại, lưu qua nút "Lưu biến thể".
 * - Không có `productId`: đang tạo sản phẩm mới, dữ liệu được báo ra ngoài qua
 *   `onDraftChange` (callback KHÔNG được setState) và lưu cùng sản phẩm.
 */
export function ProductVariantSection({
  productId,
  skuPrefix,
  onDraftChange,
}: {
  productId?: string | null;
  skuPrefix?: string;
  onDraftChange?: (result: DraftResult) => void;
}) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [rows, setRows] = useState<Record<string, RowData>>({});
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  /** Index của option đang mở danh sách gợi ý giá trị. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const attrData = await gql<{ attributes: { nodes: Attribute[] } }>(
        `query { attributes(pagination: { take: 50 }) { nodes { id name values { id value } } } }`,
      );
      setAttributes(attrData.attributes.nodes);
      if (!productId) return; // đang tạo mới: chưa có biến thể nào trong DB

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
          image: v.images[0]?.url ?? "",
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

  const combos = useMemo(
    () => (hasVariants ? buildCombos(options) : []),
    [hasVariants, options],
  );

  const usedAttributeIds = options.map((o) => o.attributeId);
  const canAddOption = attributes.some((a) => !usedAttributeIds.includes(a.id));

  function patchOption(index: number, patch: Partial<Option>) {
    setSaved(false);
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    );
  }

  function addOption() {
    const next = attributes.find((a) => !usedAttributeIds.includes(a.id));
    if (!next) return;
    setOptions((prev) => [
      ...prev,
      { attributeId: next.id, values: [], draft: "" },
    ]);
  }

  function removeOption(index: number) {
    setSaved(false);
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

  function removeValue(index: number, value: string) {
    patchOption(index, {
      values: options[index].values.filter((v) => v !== value),
    });
  }

  function patchRow(combo: Combo, patch: Partial<RowData>) {
    setSaved(false);
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

  async function onPickImage(combo: Combo, file: File | undefined) {
    if (!file) return;
    setUploadingKey(combo.key);
    setError(null);
    try {
      const url = await uploadImage(file);
      patchRow(combo, { image: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload ảnh thất bại");
    } finally {
      setUploadingKey(null);
    }
  }

  function applyBulk() {
    setSaved(false);
    setRows((prev) => {
      const next = { ...prev };
      for (const c of combos) {
        const cur = resolveRow(prev, c);
        next[c.key] = {
          ...cur,
          price: bulkPrice !== "" ? bulkPrice : cur.price,
          stock: bulkStock !== "" ? bulkStock : cur.stock,
        };
      }
      return next;
    });
  }

  function toggleHasVariants(checked: boolean) {
    setSaved(false);
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
    // Tạo mới + không biến thể + chưa nhập giá -> tạo sản phẩm chưa có giá bán.
    if (
      !productId &&
      !hasVariants &&
      resolveRow(rows, DEFAULT_COMBO).price === ""
    ) {
      return { variants: [] };
    }

    const prefix = (
      productId ? productId.slice(0, 6) : skuPrefix || "SKU"
    ).toUpperCase();

    const variants: DraftVariant[] = [];
    for (const c of list) {
      const r = resolveRow(rows, c);
      if (r.price === "") {
        return {
          error: c.label
            ? `Nhập giá cho biến thể ${c.label}`
            : "Nhập giá sản phẩm",
        };
      }
      const sku =
        r.sku.trim() || `${prefix}${c.label ? "-" + slugify(c.label) : ""}`;
      variants.push({
        sku,
        price: Number(r.price),
        stockQuantity: Number(r.stock) || 0,
        isActive: true,
        imageUrl: r.image || null,
        options: c.options,
      });
    }
    return { variants };
  }

  // Chế độ tạo mới: báo trạng thái hiện tại cho form cha mỗi lần render.
  useEffect(() => {
    if (!productId) onDraftChange?.(buildVariants());
  });

  async function save() {
    if (!productId) return;
    setError(null);
    setSaved(false);

    const result = buildVariants();
    if ("error" in result) {
      setError(result.error);
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
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu biến thể thất bại");
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
        Sản phẩm này có nhiều biến thể. Ví dụ như khác nhau về kích thước, màu
        sắc.
      </label>

      {error ? (
        <p className="mb-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      ) : null}

      {hasVariants ? (
        <>
          <div className="divide-y divide-border border-y border-border">
            {options.map((opt, i) => (
              <div
                key={opt.attributeId}
                className="grid gap-4 py-4 sm:grid-cols-[240px_1fr]"
              >
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Thuộc tính
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={opt.attributeId}
                      onChange={(e) =>
                        patchOption(i, { attributeId: e.target.value })
                      }
                      className="h-9 w-full rounded border border-border bg-background px-2 text-[13px] outline-none focus:border-foreground"
                    >
                      {attributes
                        .filter(
                          (a) =>
                            a.id === opt.attributeId ||
                            !usedAttributeIds.includes(a.id),
                        )
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-[12px] text-destructive hover:underline"
                    >
                      Xoá
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Giá trị
                  </div>
                  <div className="space-y-2">
                    {opt.values.map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <div className="h-9 flex-1 rounded border border-border px-3 text-[13px] leading-9">
                          {v}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeValue(i, v)}
                          aria-label={`Xoá ${v}`}
                          className="px-2 text-[16px] text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <ValueCombobox
                      draft={opt.draft}
                      open={openIndex === i}
                      suggestions={suggestionsFor(opt)}
                      onOpen={() => setOpenIndex(i)}
                      onClose={() =>
                        setOpenIndex((cur) => (cur === i ? null : cur))
                      }
                      onDraftChange={(draft) => patchOption(i, { draft })}
                      onPick={(value) => {
                        addValue(i, value);
                        setOpenIndex(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {canAddOption ? (
            <button
              type="button"
              onClick={addOption}
              className="my-3 text-[13px] text-blue-600 hover:underline"
            >
              + Thêm thuộc tính khác
            </button>
          ) : null}
        </>
      ) : null}

      <div className="mt-2 border-t border-border pt-4">
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
              <Input
                type="number"
                min={0}
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                placeholder="Tồn cho tất cả"
                className="h-8 w-36 rounded text-[12.5px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyBulk}
                className="h-8"
              >
                Áp dụng
              </Button>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-border">
          {displayCombos.map((c) => {
            const r = resolveRow(rows, c);
            return (
              <div
                key={c.key}
                className="grid grid-cols-2 items-center gap-2 py-3 sm:grid-cols-[56px_1.2fr_1.2fr_1fr_0.8fr]"
              >
                <div className="relative h-12 w-12">
                  {r.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(r.image)}
                        alt=""
                        className="h-12 w-12 rounded border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => patchRow(c, { image: "" })}
                        aria-label="Xoá ảnh biến thể"
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[11px] leading-none text-background"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <label
                      title="Thêm ảnh đại diện cho biến thể"
                      className="flex h-12 w-12 cursor-pointer items-center justify-center rounded border border-dashed border-border text-center text-[10px] leading-tight text-blue-600 hover:bg-muted"
                    >
                      {uploadingKey === c.key ? "…" : "+ Ảnh"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingKey !== null}
                        onChange={(e) => {
                          void onPickImage(c, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="col-span-2 text-[13px] font-medium sm:col-span-1">
                  {c.label}
                  {r.price ? (
                    <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                      {formatVnd(r.price)}
                    </span>
                  ) : null}
                </div>
                <Input
                  value={r.sku}
                  onChange={(e) => patchRow(c, { sku: e.target.value })}
                  placeholder="SKU (tự sinh nếu trống)"
                  className="h-8 rounded text-[12.5px]"
                />
                <Input
                  type="number"
                  min={0}
                  value={r.price}
                  onChange={(e) => patchRow(c, { price: e.target.value })}
                  placeholder="Giá (VND)"
                  className="h-8 rounded text-[12.5px]"
                />
                <Input
                  type="number"
                  min={0}
                  value={r.stock}
                  onChange={(e) => patchRow(c, { stock: e.target.value })}
                  placeholder="Tồn kho"
                  className="h-8 rounded text-[12.5px]"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px] text-muted-foreground">
            Tổng tồn kho: {totalStock} khả dụng
          </span>
          <div className="flex items-center gap-3">
            {productId ? (
              <>
                {saved ? (
                  <span className="text-[12px] text-green-600">Đã lưu</span>
                ) : null}
                <Button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="h-9 rounded text-xs"
                >
                  {busy ? "Đang lưu…" : "Lưu biến thể"}
                </Button>
              </>
            ) : (
              <span className="text-[12px] text-muted-foreground">
                Biến thể sẽ được lưu cùng sản phẩm.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

