import { formatVnd, type Combo, type RowData } from "@/components/admin/products/variant-logic";
import { Input } from "@/components/ui/input";
import { resolveImageUrl } from "@/lib/admin/client";

/** Một dòng biến thể. Ảnh hiển thị là ảnh theo MÀU của biến thể (quản lý ở mục Hình ảnh sản phẩm). */
export function VariantRow({
  combo,
  row: r,
  imageUrl,
  missingImage,
  onPatch,
}: {
  combo: Combo;
  row: RowData;
  /** Ảnh của màu biến thể này (nếu có). */
  imageUrl: string | null;
  /** Biến thể có màu nhưng màu đó chưa có ảnh nào. */
  missingImage: boolean;
  onPatch: (patch: Partial<RowData>) => void;
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-2 py-3 sm:grid-cols-[56px_1.2fr_1.2fr_1fr_0.8fr]">
      <div
        className="h-12 w-12"
        title={
          imageUrl
            ? "Ảnh theo màu (đổi ở mục Hình ảnh sản phẩm)"
            : missingImage
              ? "Màu này chưa có ảnh — gán ảnh cho màu ở mục Hình ảnh sản phẩm"
              : undefined
        }
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(imageUrl)}
            alt=""
            className="h-12 w-12 rounded border border-border object-cover"
          />
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded border border-dashed text-center text-[9px] leading-tight ${
              missingImage
                ? "border-amber-500 text-amber-600"
                : "border-border text-muted-foreground"
            }`}
          >
            {missingImage ? "Chưa có ảnh" : "—"}
          </div>
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
