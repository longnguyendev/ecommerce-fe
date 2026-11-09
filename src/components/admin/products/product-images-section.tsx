"use client";

import { useCallback, useEffect, useState } from "react";

import { SaveButton, SecondaryButton } from "@/components/admin/form-controls";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gql, resolveImageUrl, uploadImage } from "@/lib/admin/client";
import { toast } from "@/lib/toast";

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
const SHARED = "shared";

/** Một dải ảnh của một nhóm (Ảnh chung / một màu): thêm, xoá, kéo thả đổi thứ tự trong nhóm. */
function ImageStrip({
  title,
  hint,
  images,
  primaryId,
  busy,
  locked = false,
  dragging,
  onDragStartImage,
  onDragEndImage,
  onDropAt,
  onAddFiles,
  onAddUrl,
  onRemove,
}: {
  title: string;
  hint?: string;
  images: Img[];
  primaryId?: string;
  busy: boolean;
  /** Đang có dải khác tải ảnh: khoá thêm ảnh để tránh ghi chồng. */
  locked?: boolean;
  /** Ảnh đang được kéo (có thể đến từ dải khác). */
  dragging: Img | null;
  onDragStartImage: (img: Img) => void;
  onDragEndImage: () => void;
  /** Thả ảnh vào vị trí `index` của dải này; không truyền = dải không nhận ảnh thả vào. */
  onDropAt?: (index: number) => void;
  onAddFiles: (files: FileList) => void;
  onAddUrl: (url: string) => void;
  onRemove: (img: Img) => void | Promise<void>;
}) {
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [stripOver, setStripOver] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const canDrop = Boolean(onDropAt) && dragging !== null;

  function drop(index: number) {
    setOverIndex(null);
    setStripOver(false);
    onDropAt?.(index);
  }

  function submitUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    onAddUrl(url);
    setUrlDraft("");
    setShowUrl(false);
  }

  return (
    <div
      onDragOver={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        if (!stripOver) setStripOver(true);
      }}
      onDragLeave={() => setStripOver(false)}
      onDrop={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        drop(images.length);
      }}
      className={[
        "rounded border p-3",
        stripOver && canDrop ? "border-blue-500 bg-blue-50/40" : "border-border",
      ].join(" ")}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium">{title}</span>
        <span className="text-[11px] text-muted-foreground">
          {images.length === 0 && hint ? hint : `${images.length} ảnh`}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => onDragStartImage(img)}
            onDragEnd={() => {
              setOverIndex(null);
              setStripOver(false);
              onDragEndImage();
            }}
            onDragOver={(e) => {
              if (!canDrop) return;
              e.preventDefault();
              e.stopPropagation();
              if (overIndex !== i) setOverIndex(i);
            }}
            onDrop={(e) => {
              if (!canDrop) return;
              e.preventDefault();
              e.stopPropagation();
              drop(i);
            }}
            className={[
              "group relative h-20 w-20 cursor-grab overflow-hidden rounded border bg-background active:cursor-grabbing",
              img.id === primaryId ? "border-foreground/60" : "border-border",
              dragging?.id === img.id ? "opacity-40" : "",
              overIndex === i && canDrop && dragging?.id !== img.id ? "ring-2 ring-blue-500" : "",
            ].join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(img.url)}
              alt=""
              draggable={false}
              className="h-full w-full object-contain"
            />
            {img.id === primaryId ? (
              <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-0.5 text-center text-[9px] uppercase tracking-[0.06em] text-background">
                Đại diện
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onRemove(img)}
              aria-label="Xoá ảnh"
              className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-background/90 text-[13px] leading-none text-destructive shadow group-hover:flex"
            >
              ×
            </button>
          </div>
        ))}

        <div className="flex min-h-20 min-w-20 flex-col items-center justify-center gap-1 rounded border border-dashed border-border p-2 text-center text-[12px]">
          {showUrl ? (
            <div className="w-44 space-y-1.5">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitUrl();
                  }
                }}
                placeholder="https://…"
                className="h-7 rounded text-[11px]"
                autoFocus
              />
              <div className="flex justify-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={submitUrl}
                  disabled={busy || locked}
                  className="h-6 text-[11px]"
                >
                  Thêm
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUrl(false)}
                  className="h-6 text-[11px]"
                >
                  Huỷ
                </Button>
              </div>
            </div>
          ) : (
            <>
              <label className="cursor-pointer text-blue-600 hover:underline">
                {busy ? "Đang tải…" : "+ Thêm ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={busy || locked}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) onAddFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowUrl(true)}
                className="text-[11px] text-muted-foreground hover:underline"
              >
                từ URL
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Quản lý ảnh sản phẩm, nhóm theo màu (nằm trong mục Biến thể):
 * - "Ảnh chung": hiện cho mọi màu, và là ảnh của sản phẩm không có màu.
 * - Mỗi màu một dải ảnh: mọi biến thể cùng màu dùng chung (không phụ thuộc size).
 * - Có `productId`: ảnh tải lên / thêm từ URL được ghi vào DB NGAY (không để file mồ côi trong
 *   uploads). Xoá, kéo thả đổi thứ tự / chuyển màu chỉ chỉnh bản nháp trên màn hình; bấm
 *   "Lưu hình ảnh" mới ghi, "Hoàn tác" để bỏ các thay đổi đó.
 * - Không có `productId` (đang tạo mới): chỉ có "Ảnh chung", báo ra ngoài qua `onDraftChange`
 *   (callback KHÔNG được setState) và lưu cùng sản phẩm; sau đó mới thêm được ảnh theo màu.
 * Thứ tự lưu = ảnh chung, rồi từng màu; ảnh đầu tiên là ảnh đại diện sản phẩm.
 */
const NEW_PREFIX = "new-";
const signatureOf = (list: Img[]) =>
  list.map((i) => `${i.id}:${i.attributeValueId ?? ""}`).join("|");

export function ProductImagesSection({
  productId,
  onDraftChange,
  onChange,
  reloadToken = 0,
}: {
  productId?: string | null;
  onDraftChange?: (urls: string[]) => void;
  /** Gọi sau khi ảnh được lưu / nạp lại (để bảng biến thể cập nhật ảnh theo màu). */
  onChange?: () => void;
  /** Tăng giá trị này để nạp lại danh sách màu (sau khi lưu biến thể). */
  reloadToken?: number;
}) {
  /** Bản đã lưu trong DB. */
  const [saved, setSaved] = useState<Img[]>([]);
  /** Bản đang chỉnh trên màn hình. */
  const [images, setImages] = useState<Img[]>([]);
  const [colors, setColors] = useState<ColorChoice[]>([]);
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Img | null>(null);
  const [confirm, confirmDialog] = useConfirm();

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
      setSaved(data.productImages.nodes);
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

  const savedSignature = signatureOf(saved);
  useEffect(() => {
    if (productId) onChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, savedSignature]);

  useEffect(() => {
    if (!productId) onDraftChange?.(images.map((i) => i.url));
  });

  const dirty = Boolean(productId) && signatureOf(images) !== savedSignature;

  // Cảnh báo khi rời trang mà còn thay đổi ảnh chưa lưu.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const colorIds = new Set(colors.map((c) => c.id));
  const shared = images.filter((i) => !i.attributeValueId);
  const orphans = images.filter((i) => i.attributeValueId && !colorIds.has(i.attributeValueId));
  const listOf = (colorId: string) => images.filter((i) => i.attributeValueId === colorId);

  /** Ghép lại thứ tự toàn bộ: ảnh chung, từng màu (theo thứ tự màu), ảnh của màu không còn dùng. */
  function withGroup(key: string, list: Img[]): Img[] {
    return [
      ...(key === SHARED ? list : shared),
      ...colors.flatMap((c) => (key === c.id ? list : listOf(c.id))),
      ...orphans,
    ];
  }

  /**
   * Thả ảnh đang kéo vào dải `key` tại vị trí `index`: cùng dải thì đổi thứ tự, khác dải thì
   * chuyển ảnh sang màu của dải đó (dải "Ảnh chung" = bỏ gán màu). Chỉ chỉnh bản nháp.
   */
  function dropImage(key: string, index: number) {
    const img = dragging;
    setDragging(null);
    if (!img) return;
    const colorId = key === SHARED ? null : key;
    const group = key === SHARED ? shared : listOf(key);

    if (img.attributeValueId === colorId) {
      const from = group.findIndex((i) => i.id === img.id);
      if (from < 0 || from === index) return;
      const list = [...group];
      const [moved] = list.splice(from, 1);
      list.splice(index > from ? index - 1 : index, 0, moved);
      setImages(withGroup(key, list));
      return;
    }

    if (!productId) return; // tạo mới: chỉ có một dải
    const moved: Img = { ...img, attributeValueId: colorId };
    const rest = (list: Img[]) => list.filter((i) => i.id !== img.id);
    const target = rest(group);
    target.splice(Math.min(index, target.length), 0, moved);
    setImages([
      ...(key === SHARED ? target : rest(shared)),
      ...colors.flatMap((c) => (c.id === key ? target : rest(listOf(c.id)))),
      ...rest(orphans),
    ]);
  }

  /** Sắp lại toàn bộ: ảnh chung, từng màu (theo thứ tự màu), ảnh của màu không còn dùng. */
  function arrange(list: Img[]): Img[] {
    return [
      ...list.filter((i) => !i.attributeValueId),
      ...colors.flatMap((c) => list.filter((i) => i.attributeValueId === c.id)),
      ...list.filter((i) => i.attributeValueId && !colorIds.has(i.attributeValueId)),
    ];
  }

  /**
   * Thêm ảnh vào dải `key`. Tạo mới sản phẩm: chỉ giữ URL trong state (lưu cùng sản phẩm).
   * Sản phẩm đã có: tạo bản ghi ảnh ngay trong DB rồi lưu lại thứ tự, để mọi file đã tải lên
   * đều được theo dõi và xoá được ở giao diện.
   */
  async function addImages(key: string, urls: string[]) {
    if (!productId) {
      setImages((prev) => [
        ...prev,
        ...urls.map((url, i) => ({
          id: `${NEW_PREFIX}${Date.now()}-${i}`,
          url,
          attributeValueId: null,
        })),
      ]);
      return;
    }
    const attributeValueId = key === SHARED ? null : key;
    const created: Img[] = [];
    for (const url of urls) {
      const res = await gql<{ createProductImage: Img }>(
        `mutation Add($input: CreateProductImageInput!) {
          createProductImage(input: $input) { ${FIELDS} }
        }`,
        {
          input: {
            productId,
            url,
            attributeValueId,
            sortOrder: saved.length + created.length,
            isPrimary: false,
          },
        },
      );
      created.push(res.createProductImage);
    }
    // Thứ tự trên server = bản đã lưu + ảnh mới, sắp theo nhóm (ảnh đầu = ảnh đại diện).
    const savedNext = arrange([...saved, ...created]);
    await gql(
      `mutation Reorder($input: ReorderProductImagesInput!) {
        reorderProductImages(input: $input) { id }
      }`,
      { input: { productId, imageIds: savedNext.map((i) => i.id) } },
    );
    const wasDirty = signatureOf(images) !== signatureOf(saved);
    setSaved(savedNext);
    // Bản nháp: nếu chưa có thay đổi nào thì khớp bản đã lưu; còn không thì chèn thêm ảnh mới.
    setImages(wasDirty ? arrange([...images, ...created]) : savedNext);
  }

  function runAdd(key: string, task: () => Promise<void>, failMessage: string) {
    setBusyGroup(key);
    setError(null);
    void (async () => {
      try {
        await task();
      } catch (err) {
        const message = err instanceof Error ? err.message : failMessage;
        setError(message);
        toast.error(message);
      } finally {
        setBusyGroup(null);
      }
    })();
  }

  function onAddFiles(key: string, files: FileList) {
    runAdd(
      key,
      async () => {
        const urls: string[] = [];
        for (const f of Array.from(files)) urls.push(await uploadImage(f));
        await addImages(key, urls);
      },
      "Upload thất bại",
    );
  }

  function onAddUrl(key: string, url: string) {
    runAdd(key, () => addImages(key, [url]), "Thêm ảnh thất bại");
  }

  async function onRemove(img: Img) {
    const ok = await confirm({
      title: "Xoá ảnh này?",
      message: img.id.startsWith("new-")
        ? "Ảnh sẽ bị gỡ khỏi danh sách."
        : "Ảnh sẽ được xoá khỏi sản phẩm khi bạn bấm “Lưu hình ảnh”. Có thể bấm “Hoàn tác” trước đó.",
    });
    if (!ok) return;
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  }

  /** Ghi bản nháp vào DB: xoá, đổi màu, rồi lưu lại thứ tự (ảnh đầu = ảnh đại diện). */
  async function save() {
    if (!productId || saving) return;
    setSaving(true);
    setError(null);
    try {
      const keep = new Set(images.map((i) => i.id));
      for (const s of saved) {
        if (!keep.has(s.id)) {
          await gql(`mutation Del($id: ID!) { deleteProductImage(id: $id) }`, { id: s.id });
        }
      }
      const finalIds: string[] = [];
      for (const img of images) {
        const before = saved.find((s) => s.id === img.id);
        if (before && before.attributeValueId !== img.attributeValueId) {
          await gql(
            `mutation SetColor($input: UpdateProductImageInput!) { updateProductImage(input: $input) { id } }`,
            { input: { id: img.id, attributeValueId: img.attributeValueId } },
          );
        }
        finalIds.push(img.id);
      }
      if (finalIds.length > 0) {
        await gql(
          `mutation Reorder($input: ReorderProductImagesInput!) {
            reorderProductImages(input: $input) { id }
          }`,
          { input: { productId, imageIds: finalIds } },
        );
      }
      await load();
      toast.success("Đã lưu hình ảnh");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lưu hình ảnh thất bại";
      setError(message);
      toast.error(message);
      await load(); // đồng bộ lại với DB vì có thể đã ghi một phần
    } finally {
      setSaving(false);
    }
  }

  const primaryId = images[0]?.id;

  return (
    <div className="mt-2 border-t border-border pt-4">
      <h2 className="mb-1 text-[13px] font-medium">Hình ảnh</h2>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Ảnh chung hiện cho mọi màu (và cho sản phẩm không có màu). Ảnh của một màu dùng chung cho
        mọi size của màu đó; màu chưa có ảnh sẽ hiện ảnh chung. Kéo thả để đổi thứ tự hoặc chuyển
        ảnh sang màu khác (thả vào dải đích); ảnh đầu tiên là ảnh đại diện sản phẩm.
        {productId
          ? " Ảnh tải lên được lưu ngay; xoá, đổi thứ tự và chuyển màu chỉ có hiệu lực sau khi bấm “Lưu hình ảnh”."
          : " Sau khi lưu sản phẩm, bạn có thể thêm ảnh riêng cho từng màu."}
      </p>

      {error ? (
        <p className="mb-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <ImageStrip
          title="Ảnh chung"
          images={shared}
          primaryId={primaryId}
          busy={busyGroup === SHARED}
          locked={busyGroup !== null}
          onAddFiles={(files) => onAddFiles(SHARED, files)}
          onAddUrl={(url) => onAddUrl(SHARED, url)}
          onRemove={onRemove}
          dragging={dragging}
          onDragStartImage={setDragging}
          onDragEndImage={() => setDragging(null)}
          onDropAt={(index) => dropImage(SHARED, index)}
        />

        {productId
          ? colors.map((c) => (
              <ImageStrip
                key={c.id}
                title={`Màu ${c.name}`}
                hint="Chưa có ảnh — đang dùng ảnh chung"
                images={listOf(c.id)}
                primaryId={primaryId}
                busy={busyGroup === c.id}
                locked={busyGroup !== null}
                onAddFiles={(files) => onAddFiles(c.id, files)}
                onAddUrl={(url) => onAddUrl(c.id, url)}
                onRemove={onRemove}
                dragging={dragging}
                onDragStartImage={setDragging}
                onDragEndImage={() => setDragging(null)}
                onDropAt={(index) => dropImage(c.id, index)}
              />
            ))
          : null}

        {orphans.length > 0 ? (
          <ImageStrip
            title="Màu không còn dùng"
            images={orphans}
            primaryId={primaryId}
            busy={false}
            onAddFiles={() => undefined}
            onAddUrl={() => undefined}
            onRemove={onRemove}
            dragging={dragging}
            onDragStartImage={setDragging}
            onDragEndImage={() => setDragging(null)}
          />
        ) : null}
      </div>

      {productId ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span
            className={["text-[12px]", dirty ? "text-amber-600" : "text-muted-foreground"].join(
              " ",
            )}
          >
            {dirty
              ? "Có thay đổi chưa lưu"
              : "Màu mới thêm ở trên sẽ xuất hiện ở đây sau khi bấm “Lưu biến thể”."}
          </span>
          <div className="flex items-center gap-3">
            {dirty ? (
              <SecondaryButton onClick={() => setImages(saved)} disabled={saving}>
                Hoàn tác
              </SecondaryButton>
            ) : null}
            <SaveButton busy={saving} disabled={!dirty} onClick={() => void save()}>
              Lưu hình ảnh
            </SaveButton>
          </div>
        </div>
      ) : null}
      {confirmDialog}
    </div>
  );
}
