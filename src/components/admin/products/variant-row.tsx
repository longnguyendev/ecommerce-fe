import { formatVnd, type Combo, type RowData } from "@/components/admin/products/variant-logic";
import { Input } from "@/components/ui/input";
import { resolveImageUrl } from "@/lib/admin/client";

export function VariantRow({
  combo,
  row: r,
  uploading,
  uploadDisabled,
  onPatch,
  onPickImage,
}: {
  combo: Combo;
  row: RowData;
  uploading: boolean;
  uploadDisabled: boolean;
  onPatch: (patch: Partial<RowData>) => void;
  onPickImage: (file: File | undefined) => void;
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-2 py-3 sm:grid-cols-[56px_1.2fr_1.2fr_1fr_0.8fr]">
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
              onClick={() => onPatch({ image: "" })}
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
            {uploading ? "…" : "+ Ảnh"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadDisabled}
              onChange={(e) => {
                onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <div className="col-span-2 text-[13px] font-medium sm:col-span-1">
        {combo.label}
        {r.price ? (
          <span className="ml-2 text-[12px] font-normal text-muted-foreground">
            {formatVnd(r.price)}
          </span>
        ) : null}
      </div>
      <Input
        value={r.sku}
        onChange={(e) => onPatch({ sku: e.target.value })}
        placeholder="SKU (tự sinh nếu trống)"
        className="h-8 rounded text-[12.5px]"
      />
      <Input
        type="number"
        min={0}
        value={r.price}
        onChange={(e) => onPatch({ price: e.target.value })}
        placeholder="Giá (VND)"
        className="h-8 rounded text-[12.5px]"
      />
      <Input
        type="number"
        min={0}
        value={r.stock}
        onChange={(e) => onPatch({ stock: e.target.value })}
        placeholder="Tồn kho"
        className="h-8 rounded text-[12.5px]"
      />
    </div>
  );
}
