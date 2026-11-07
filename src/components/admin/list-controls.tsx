import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchInput({
  value,
  onChange,
  placeholder,
  summary,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  summary?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="relative w-full max-w-md">
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 rounded-none bg-background pr-9"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Xoá tìm kiếm"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[16px] leading-none text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        ) : null}
      </div>
      {summary ? <span className="text-[12.5px] text-muted-foreground">{summary}</span> : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <Button
        variant="outline"
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
        className="h-9 rounded-none text-xs"
      >
        ← Trước
      </Button>
      <span className="text-[12px] text-muted-foreground">
        Trang {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="h-9 rounded-none text-xs"
      >
        Sau →
      </Button>
    </div>
  );
}
