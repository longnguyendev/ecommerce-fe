import { Button } from "@/components/ui/button";

export const selectClass =
  "h-9 w-full rounded-none border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground";
export const textareaClass =
  "w-full rounded-none border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-foreground";

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Thẻ form có tiêu đề + nút Huỷ/Lưu. */
export function FormCard({
  title,
  busy,
  submitLabel = "Lưu",
  onSubmit,
  onCancel,
  children,
}: {
  title: string;
  busy: boolean;
  submitLabel?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-lg border border-border bg-background p-6"
    >
      <h2 className="mb-4 text-[13px] uppercase tracking-[0.12em]">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      <div className="mt-4 flex justify-end gap-3">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
          {busy ? "Đang lưu…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  editLabel = "Sửa",
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="h-7 rounded-none text-[11px]"
      >
        {editLabel}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="h-7 rounded-none text-[11px]"
      >
        Xoá
      </Button>
    </div>
  );
}

export function DataTable({
  columns,
  children,
}: {
  columns: { label: string; right?: boolean }[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {columns.map((c) => (
              <th
                key={c.label}
                className={`px-4 py-3 font-normal ${c.right ? "text-right" : ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
