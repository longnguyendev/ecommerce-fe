"use client";

import { useCallback, useEffect, useState } from "react";

import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gql, resolveImageUrl, uploadImage } from "@/lib/admin/client";

interface Img {
  id: string;
  url: string;
  /** Màu của ảnh (AttributeValue); null = ảnh chung của sản phẩm. */
  attributeValueId: string | null;
}

export interface ColorChoice {
  id: string;
  name: string;
}

const FIELDS = "id url attributeValueId";

/**
 * - Có `productId`: thao tác trực tiếp với API.
 * - Không có `productId` (đang tạo sản phẩm mới): giữ danh sách URL trong state và báo
 *   ra ngoài qua `onDraftChange` (callback KHÔNG được setState); ảnh đầu = ảnh đại diện.
 */
export function ProductImagesSection({
  productId,
  onDraftChange,
  onChange,
  reloadToken = 0,
}: {
  productId?: string | null;
  onDraftChange?: (urls: string[]) => void;
  /** Gọi khi danh sách ảnh / màu của ảnh thay đổi (để bảng biến thể cập nhật ảnh). */
  onChange?: () => void;
  /** Tăng giá trị này để nạp lại danh sách màu (sau khi lưu biến thể). */
  reloadToken?: number;
}) {
  const [confirm, confirmDialog] = useConfirm();
  const [images, setImages] = useState<Img[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorChoice[]>([]);

  const load = useCallback(async () => {
    if (!productId) return;
    try {
      const data = await gql<{ productImages: { nodes: Img[] } }>(
        `query Images($pid: ID!) {
          productImages(pagination: { take: 100 }, filter: { productId: $pid }) {
            nodes { ${FIELDS} }
          }
        }`,
        { pid: productId },
      );
      setImages(data.productImages.nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại");
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Các màu của sản phẩm = giá trị thuộc tính "Màu sắc" của các biến thể đã lưu.
  useEffect(() => {
    if (!productId) return;
    void gql<{
      product: {
        variants: {
          attributes: {
            attribute: { name: string };
            attributeValue: { id: string; value: string };
          }[];
        }[];
      };
    }>(
      `query Colors($id: ID!) { product(id: $id) { variants { attributes { attribute { name } attributeValue { id value } } } } }`,
      { id: productId },
    )
      .then(({ product }) => {
        const map = new Map<string, string>();
        for (const v of product.variants)
          for (const a of v.attributes)
            if (a.attribute.name === "Màu sắc")
              map.set(a.attributeValue.id, a.attributeValue.value);
        setColors([...map.entries()].map(([id, name]) => ({ id, name })));
      })
      .catch(() => setColors([]));
  }, [productId, reloadToken]);

  const signature = images.map((i) => `${i.id}:${i.attributeValueId ?? ""}`).join("|");
  useEffect(() => {
    if (productId) onChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, signature]);

  async function setImageColor(img: Img, attributeValueId: string | null) {
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, attributeValueId } : i)));
    try {
      await gql(
        `mutation SetColor($input: UpdateProductImageInput!) { updateProductImage(input: $input) { id } }`,
        { input: { id: img.id, attributeValueId } },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gán màu cho ảnh thất bại");
      await load();
    }
  }

  useEffect(() => {
    if (!productId) onDraftChange?.(images.map((i) => i.url));
  });

  async function persistOrder(next: Img[]) {
    setImages(next); // optimistic
    if (!productId) return;
    try {
      await gql(
        `mutation Reorder($input: ReorderProductImagesInput!) {
          reorderProductImages(input: $input) { id }
        }`,
        { input: { productId, imageIds: next.map((i) => i.id) } },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sắp xếp ảnh thất bại");
      await load();
    }
  }

  async function addImages(urls: string[]) {
    if (!productId) {
      setImages((prev) => [
        ...prev,
        ...urls.map((url, i) => ({
          id: `draft-${Date.now()}-${i}`,
          url,
          attributeValueId: null,
        })),
      ]);
      return;
    }
    // Ảnh mới nối vào cuối; nếu chưa có ảnh nào thì ảnh đầu là ảnh đại diện.
    const created: Img[] = [];
    for (const url of urls) {
      const isFirst = images.length + created.length === 0;
      const res = await gql<{ createProductImage: Img }>(
        `mutation Add($input: CreateProductImageInput!) {
          createProductImage(input: $input) { ${FIELDS} }
        }`,
        {
          input: {
            productId,
            url,
            sortOrder: images.length + created.length,
            isPrimary: isFirst,
          },
        },
      );
      created.push(res.createProductImage);
    }
    setImages((prev) => [...prev, ...created]);
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadImage(f));
      await addImages(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function onAddUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setUploading(true);
    setError(null);
    try {
      await addImages([url]);
      setUrlDraft("");
      setShowUrl(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thêm ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function onRemove(img: Img) {
    if (!(await confirm({ title: "Xoá ảnh này?" }))) return;
    setError(null);
    try {
      if (productId) {
        await gql(`mutation Del($id: ID!) { deleteProductImage(id: $id) }`, {
          id: img.id,
        });
      }
      const next = images.filter((i) => i.id !== img.id);
      // Nếu xoá ảnh đại diện thì ảnh kế tiếp lên làm đại diện.
      if (productId && images[0]?.id === img.id && next.length > 0) {
        await persistOrder(next);
      } else {
        setImages(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xoá ảnh thất bại");
    }
  }

  function onDrop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setDragIndex(null);
    setOverIndex(null);
    void persistOrder(next);
  }

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <h2 className="mb-1 text-[15px] font-medium">Hình ảnh sản phẩm</h2>
      <p className="mb-4 text-[12px] text-muted-foreground">
        Ảnh đầu tiên là ảnh đại diện. Kéo thả ảnh lên vị trí đầu để đặt làm ảnh đại diện.
        {productId
          ? " Gán mỗi ảnh cho một màu để khách chọn màu nào thấy đúng ảnh màu đó; ảnh “Chung” hiện cho mọi màu."
          : " Sau khi lưu sản phẩm, bạn có thể gán ảnh cho từng màu."}
      </p>

      {error ? (
        <p className="mb-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIndex !== i) setOverIndex(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(i);
            }}
            className={[
              "group relative cursor-grab overflow-hidden rounded border bg-background active:cursor-grabbing",
              i === 0
                ? "col-span-2 row-span-2 aspect-square border-foreground/40"
                : "aspect-square border-border",
              dragIndex === i ? "opacity-40" : "",
              overIndex === i && dragIndex !== null && dragIndex !== i
                ? "ring-2 ring-blue-500"
                : "",
            ].join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(img.url)}
              alt=""
              draggable={false}
              className="h-full w-full object-contain"
            />
            {i === 0 ? (
              <span className="absolute left-2 top-2 rounded bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-background">
                Ảnh đại diện
              </span>
            ) : null}
            {productId && colors.length > 0 ? (
              <select
                value={img.attributeValueId ?? ""}
                onChange={(e) => void setImageColor(img, e.target.value || null)}
                onMouseDown={(e) => e.stopPropagation()}
                draggable={false}
                aria-label="Màu của ảnh"
                className="absolute inset-x-1 bottom-1 h-7 rounded border border-border bg-background/95 px-1 text-[11px] outline-none"
              >
                <option value="">Chung (mọi màu)</option>
                {colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={() => onRemove(img)}
              aria-label="Xoá ảnh"
              className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-background/90 text-[14px] leading-none text-destructive shadow group-hover:flex"
            >
              ×
            </button>
          </div>
        ))}

        <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded border border-dashed border-border p-3 text-center text-[13px]">
          {showUrl ? (
            <div className="w-full space-y-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onAddUrl();
                  }
                }}
                placeholder="https://…"
                className="h-8 rounded text-[12px]"
                autoFocus
              />
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={onAddUrl}
                  disabled={uploading}
                  className="h-7 text-[11px]"
                >
                  Thêm
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUrl(false)}
                  className="h-7 text-[11px]"
                >
                  Huỷ
                </Button>
              </div>
            </div>
          ) : (
            <>
              <label className="cursor-pointer text-blue-600 hover:underline">
                {uploading ? "Đang tải…" : "Thêm ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => {
                    void onFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-muted-foreground">hoặc</span>
              <button
                type="button"
                onClick={() => setShowUrl(true)}
                className="text-blue-600 hover:underline"
              >
                Thêm từ URL
              </button>
            </>
          )}
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}
