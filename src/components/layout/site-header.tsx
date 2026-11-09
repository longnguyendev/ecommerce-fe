"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CartDrawer } from "@/components/cart/cart-drawer";

import { Announcement } from "./announcement";

function Icon({ name, size = 20 }: { name: "search" | "user" | "heart" | "menu"; size?: number }) {
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
  // Trang chủ: header trong suốt đè lên hero (chữ trắng), cuộn qua ~50px thì
  // đổi sang nền trắng/chữ đen, transition-all 0.3s như bản gốc.
  const isHome = usePathname() === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const overlay = isHome && !scrolled;
  const headerClass = isHome
    ? overlay
      ? "absolute inset-x-0 top-9 z-40 border-b border-transparent bg-transparent text-white"
      : "fixed inset-x-0 top-0 z-40 border-b border-border bg-white/95 text-foreground backdrop-blur-sm"
    : "sticky top-0 z-40 border-b border-border bg-background/95 text-foreground backdrop-blur-sm";

  return (
    <>
      <Announcement />

      <header className={`transition-all duration-300 ${headerClass}`}>
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <nav className="flex items-center gap-6">
            <Link
              href="/products"
              className="hidden text-[13px] text-inherit transition-colors hover:opacity-70 sm:block"
            >
              Cửa hàng
            </Link>
            <Link
              href="/products"
              className="hidden text-[13px] text-inherit transition-colors hover:opacity-70 md:block"
            >
              Tất cả sản phẩm
            </Link>
            <span className="text-inherit sm:hidden" aria-hidden="true">
              <Icon name="menu" />
            </span>
          </nav>

          <Link
            href="/"
            className="justify-self-center text-[24px] font-medium tracking-[0.14em] text-inherit"
            aria-label="OXI Apparel"
          >
            OXI
          </Link>

          <div className="flex items-center justify-end gap-3.5 text-inherit">
            <label className="hidden items-center gap-2 border-b border-border pb-1 lg:flex">
              <input
                type="search"
                placeholder="Tìm kiếm"
                aria-label="Tìm kiếm"
                className="w-23 bg-transparent text-[12.5px] text-inherit outline-none placeholder:text-inherit opacity-60"
              />
              <span className="text-inherit opacity-60" aria-hidden="true">
                <Icon name="search" size={16} />
              </span>
            </label>

            <span className="hidden text-[13px] text-inherit lg:block">Về chúng tôi</span>
            <span className="hidden text-inherit sm:block" aria-hidden="true">
              <Icon name="heart" size={18} />
            </span>
            <span className="hidden text-inherit sm:block" aria-hidden="true">
              <Icon name="user" size={18} />
            </span>

            <CartDrawer />
          </div>
        </div>
      </header>
    </>
  );
}
