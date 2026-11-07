export function SectionHeading({
  title,
  aside,
  variant = "muted",
}: {
  title: string;
  aside?: string;
  variant?: "muted" | "line";
}) {
  if (variant === "line") {
    return (
      <div className="border-b border-border pb-2.5">
        <h2 className="text-[10.5px] uppercase tracking-[0.18em]">{title}</h2>
      </div>
    );
  }
  const cls = "text-[11px] font-normal uppercase tracking-[0.05em] text-[#767676]";
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className={cls}>{title}</h2>
      {aside ? <span className={cls}>{aside}</span> : null}
    </div>
  );
}
