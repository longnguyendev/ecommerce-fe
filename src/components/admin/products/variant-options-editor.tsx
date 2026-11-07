import { ValueCombobox } from "@/components/admin/products/value-combobox";
import type {
  Attribute,
  Option,
} from "@/components/admin/products/variant-logic";

export function VariantOptionsEditor({
  options,
  attributes,
  openIndex,
  canAddOption,
  suggestionsFor,
  onOpenIndex,
  onPatchOption,
  onRemoveOption,
  onAddOption,
  onAddValue,
  onRemoveValue,
}: {
  options: Option[];
  attributes: Attribute[];
  openIndex: number | null;
  canAddOption: boolean;
  suggestionsFor: (opt: Option) => string[];
  onOpenIndex: (updater: (cur: number | null) => number | null) => void;
  onPatchOption: (index: number, patch: Partial<Option>) => void;
  onRemoveOption: (index: number) => void;
  onAddOption: () => void;
  onAddValue: (index: number, value: string) => void;
  onRemoveValue: (index: number, value: string) => void;
}) {
  const usedAttributeIds = options.map((o) => o.attributeId);
  return (
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
                    onPatchOption(i, { attributeId: e.target.value })
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
                  onClick={() => onRemoveOption(i)}
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
                      onClick={() => onRemoveValue(i, v)}
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
                  onOpen={() => onOpenIndex(() => i)}
                  onClose={() => onOpenIndex((cur) => (cur === i ? null : cur))}
                  onDraftChange={(draft) => onPatchOption(i, { draft })}
                  onPick={(value) => {
                    onAddValue(i, value);
                    onOpenIndex(() => null);
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
          onClick={onAddOption}
          className="my-3 text-[13px] text-blue-600 hover:underline"
        >
          + Thêm thuộc tính khác
        </button>
      ) : null}
    </>
  );
}
