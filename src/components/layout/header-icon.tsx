/** Khung chung cho mọi nút icon trên header: cùng kích thước 36×36, icon căn giữa. */
export const HEADER_ICON_CLASS =
  "relative flex h-9 w-9 shrink-0 items-center justify-center text-inherit transition-opacity hover:opacity-70";

/** Badge số lượng góc trên phải của nút icon (giỏ hàng, yêu thích). */
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9.5px] leading-none tabular-nums text-background"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
