"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/admin/client";

const NAV = [
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/inventory", label: "Kho" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/collections", label: "Bộ sưu tập" },
  { href: "/admin/attributes", label: "Thuộc tính" },
];

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    clearToken();
    router.replace("/admin/login");
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="text-xl font-medium tracking-[0.14em]">OXI</span>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="h-9 rounded-none text-xs"
          >
            Xem storefront
          </Button>
          <Button variant="ghost" onClick={logout} className="h-9 rounded-none text-xs">
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
