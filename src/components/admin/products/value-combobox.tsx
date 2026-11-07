import { Input } from "@/components/ui/input";

/**
 * Ô nhập giá trị: bấm vào để chọn từ các giá trị có sẵn của thuộc tính, hoặc gõ chữ mới
 * rồi Enter / chọn "Tạo mới" để thêm giá trị chưa có.
 */
export function ValueCombobox({
  draft,
  open,
  suggestions,
  onOpen,
  onClose,
  onDraftChange,
  onPick,
}: {
  draft: string;
  open: boolean;
  suggestions: string[];
  onOpen: () => void;
  onClose: () => void;
  onDraftChange: (draft: string) => void;
  onPick: (value: string) => void;
}) {
  const typed = draft.trim();
  const exact = suggestions.some(
    (v) => v.toLowerCase() === typed.toLowerCase(),
  );

  return (
    <div className="relative">
      <Input
        value={draft}
        placeholder="Chọn hoặc nhập giá trị mới"
        onFocus={onOpen}
        onBlur={onClose}
        onChange={(e) => {
          onDraftChange(e.target.value);
          onOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (typed) onPick(typed);
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        className="h-9 rounded text-[13px]"
      />
      {open && (suggestions.length > 0 || (typed && !exact)) ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-border bg-background py-1 text-[13px] shadow-md">
          {suggestions.map((v) => (
            <li key={v}>
              <button
                type="button"
                // mousedown + preventDefault: chọn xong trước khi ô nhập mất focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(v);
                }}
                className="block w-full px-3 py-1.5 text-left hover:bg-muted"
              >
                {v}
              </button>
            </li>
          ))}
          {typed && !exact ? (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(typed);
                }}
                className="block w-full border-t border-border px-3 py-1.5 text-left text-blue-600 hover:bg-muted"
              >
                + Tạo mới “{typed}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
