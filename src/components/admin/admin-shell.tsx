import { AdminHeader } from "@/components/admin/admin-header";
import { Toaster } from "@/components/shared/toaster";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-4 border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
      {message}
    </p>
  );
}

/** Khung chung của mọi trang admin: header, tiêu đề, nút hành động, banner lỗi. */
export function AdminShell({
  title,
  subtitle,
  action,
  error,
  maxWidth = "900px",
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  error?: string | null;
  maxWidth?: "900px" | "1200px";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <AdminHeader />
      <main
        className={`mx-auto px-4 py-8 sm:px-6 ${maxWidth === "1200px" ? "max-w-[1200px]" : "max-w-[900px]"}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </div>
        <ErrorBanner message={error ?? null} />
        {children}
      </main>
      <Toaster />
    </div>
  );
}
