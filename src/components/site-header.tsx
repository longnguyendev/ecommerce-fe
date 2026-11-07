"use client";

import Link from "next/link";
import { Announcement } from "./announcement";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function Icon({
  name,
  size = 20,
}: {
  name: "search" | "user" | "bag" | "heart" | "menu";
  size?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "search")
    return (
      <svg {...p} aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.6-3.6" />
      </svg>
    );
  if (name === "user")
    return (
      <svg {...p} aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    );
  if (name === "bag")
    return (
      <svg {...p} aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg {...p} aria-hidden="true">
        <path d="M12 20s-7-4.6-7-9.4A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 3C19 15.4 12 20 12 20Z" />
      </svg>
    );
  return (
    <svg {...p} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <>
      <Announcement />

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <nav className="flex items-center gap-6">
            <Link
              href="/products"
              className="hidden text-[13px] text-foreground transition-colors hover:text-muted-foreground sm:block"
            >
              Cửa hàng
            </Link>
            <Link
              href="/products"
              className="hidden text-[13px] text-foreground transition-colors hover:text-muted-foreground md:block"
            >
              Tất cả sản phẩm
            </Link>
            <span className="text-foreground sm:hidden" aria-hidden="true">
              <Icon name="menu" />
            </span>
          </nav>

          <Link
            href="/"
            className="justify-self-center text-[24px] font-medium tracking-[0.14em] text-foreground"
            aria-label="OXI Apparel"
          >
            OXI
          </Link>

          <div className="flex items-center justify-end gap-3.5 text-foreground">
            <label className="hidden items-center gap-2 border-b border-border pb-1 lg:flex">
              <input
                type="search"
                placeholder="Tìm kiếm"
                aria-label="Tìm kiếm"
                className="w-[92px] bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <span className="text-muted-foreground" aria-hidden="true">
                <Icon name="search" size={16} />
              </span>
            </label>

            <span className="hidden text-[11.5px] tracking-wide text-foreground lg:block">
              EN
            </span>
            <span className="hidden text-[13px] text-foreground lg:block">
              Về chúng tôi
            </span>
            <span className="hidden text-foreground sm:block" aria-hidden="true">
              <Icon name="heart" size={18} />
            </span>
            <span className="hidden text-foreground sm:block" aria-hidden="true">
              <Icon name="user" size={18} />
            </span>

            <Sheet>
              <SheetTrigger
                className="flex items-center gap-1 text-foreground"
                aria-label="Mở giỏ hàng"
              >
                <Icon name="bag" size={18} />
                <span className="text-[10.5px] tabular-nums">0</span>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-[448px]">
                <SheetHeader className="border-b border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xs font-normal uppercase tracking-[0.08em] text-foreground">
                      Giỏ hàng (0)
                    </SheetTitle>
                  </div>
                </SheetHeader>
                <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
                  <svg
                    className="mb-4 text-[#999]"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="mb-4 text-xs text-foreground">Giỏ hàng trống</p>
                  <Button
                    variant="outline"
                    className="h-10 rounded-none border-foreground px-6 text-xs"
                  >
                    Tiếp tục mua sắm
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
