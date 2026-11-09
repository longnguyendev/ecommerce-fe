"use client";

import { Combobox } from "@base-ui/react/combobox";

import { normalizeVi, type AdminUnit } from "@/lib/storefront/address";

/** Chọn tỉnh / phường: gõ để lọc (không dấu vẫn khớp), điều hướng bằng bàn phím. */
export function AdminUnitCombobox({
  id,
  label,
  items,
  value,
  onChange,
  placeholder,
  disabled,
  loading,
  error,
}: {
  id: string;
  label: string;
  items: AdminUnit[];
  value: AdminUnit | null;
  onChange: (unit: AdminUnit | null) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11.5px] text-muted-foreground">
        {label}
      </label>
      <Combobox.Root
        items={items}
        value={value}
        onValueChange={(next) => onChange(next)}
        itemToStringLabel={(unit) => unit.name}
        itemToStringValue={(unit) => unit.code}
        isItemEqualToValue={(a, b) => a.code === b.code}
        filter={(unit, query) => normalizeVi(unit.name).includes(normalizeVi(query))}
        disabled={disabled || loading}
      >
        <div className="relative mt-1">
          <Combobox.Input
            id={id}
            placeholder={loading ? "Đang tải…" : placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-11 w-full border border-border bg-transparent pl-3 pr-9 text-[13px] outline-none focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted/40 aria-invalid:border-destructive"
          />
          <Combobox.Trigger
            aria-label={`Mở danh sách ${label.toLowerCase()}`}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </Combobox.Trigger>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="z-50">
            <Combobox.Popup className="max-h-72 w-(--anchor-width) overflow-y-auto border border-border bg-background py-1 text-[13px] shadow-lg">
              <Combobox.Empty className="px-3 py-2 text-muted-foreground empty:hidden">
                Không tìm thấy kết quả
              </Combobox.Empty>
              <Combobox.List>
                {(unit: AdminUnit) => (
                  <Combobox.Item
                    key={unit.code}
                    value={unit}
                    className="flex cursor-default items-center justify-between gap-2 px-3 py-2 outline-none select-none data-highlighted:bg-muted data-selected:font-medium"
                  >
                    {unit.name}
                    <Combobox.ItemIndicator className="text-[11px]">✓</Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11.5px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
