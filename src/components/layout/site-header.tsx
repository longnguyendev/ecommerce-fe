"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HeartIcon } from "@/components/wishlist/wishlist-button";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { NEW_TILE } from "@/data/home";

import { Announcement } from "./announcement";
import { CountBadge, HEADER_ICON_CLASS } from "./header-icon";

export interface HeaderCollection {
  slug: string;
  name: string;
}

type IconName = "search" | "user" | "menu" | "package" | "chevron";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "search":
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
      );
    case "user":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      );
    case "package":
      return (
        <svg {...p}>
          <path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" />
          <path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...p} strokeWidth={1.8}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
  }
}

/** Các mục của menu "Cửa hàng": tất cả, hàng mới, rồi từng bộ sưu tập. */
function shopLinks(collections: HeaderCollection[]) {
  return [
    { href: "/products", label: "Tất cả sản phẩm" },
    { href: `/products?collection=${NEW_TILE.slug}`, label: "Hàng mới" },
    ...collections.map((c) => ({
      href: `/products?collection=${encodeURIComponent(c.slug)}`,
      label: c.name,
    })),
  ];
}

function useSearchSubmit(onDone?: () => void) {
  const router = useRouter();
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    onDone?.();
  };
}

/** Nút "Cửa hàng": bấm để mở danh sách bộ sưu tập; đóng khi bấm ra ngoài, Esc hoặc chọn mục. */
function ShopMenu({ collections }: { collections: HeaderCollection[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="shop-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1 text-[13px] text-inherit transition-opacity hover:opacity-70"
      >
        Cửa hàng
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <Icon name="chevron" size={12} />
        </span>
      </button>
      {open ? (
        <div id="shop-menu" className="absolute left-0 top-full z-50 pt-3.5">
          <ul className="min-w-56 border border-border bg-background py-2 text-foreground shadow-sm">
            {shopLinks(collections).map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-[13px] transition-colors hover:bg-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Menu mobile (< md): tìm kiếm + toàn bộ liên kết điều hướng. */
function MobileMenu({ collections }: { collections: HeaderCollection[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const onSearch = useSearchSubmit(close);
  const item = "block py-2.5 text-[14px] text-foreground";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={`${HEADER_ICON_CLASS} -ml-2 md:hidden`} aria-label="Mở menu">
        <Icon name="menu" size={20} />
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col gap-0 overflow-y-auto">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-xs font-normal uppercase tracking-[0.08em] text-foreground">
            Menu
          </SheetTitle>
        </SheetHeader>
        <form role="search" onSubmit={onSearch} className="border-b border-border px-5 py-4">
          <label className="flex items-center gap-2 border-b border-border pb-1.5">
            <input
              type="search"
              name="q"
              placeholder="Tìm kiếm sản phẩm"
              aria-label="Tìm kiếm sản phẩm"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none"
            />
            <button type="submit" aria-label="Tìm" className="text-muted-foreground">
              <Icon name="search" size={16} />
            </button>
          </label>
        </form>
        <nav className="px-5 py-3">
          <p className="pt-2 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Cửa hàng
          </p>
          <ul>
            {shopLinks(collections).map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className={item}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <Link href="/wishlist" onClick={close} className={item}>
              Yêu thích
            </Link>
            <Link href="/order/lookup" onClick={close} className={item}>
              Tra cứu đơn hàng
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function WishlistLink({ active }: { active: boolean }) {
  const { slugs, ready } = useWishlist();
  const count = ready ? slugs.length : 0;
  return (
    <Link
      href="/wishlist"
      aria-label={`Yêu thích, ${count} sản phẩm`}
      aria-current={active ? "page" : undefined}
      title="Yêu thích"
      className={HEADER_ICON_CLASS}
    >
      <HeartIcon filled={active} />
      <CountBadge count={count} />
    </Link>
  );
}

export function SiteHeader({ collections = [] }: { collections?: HeaderCollection[] }) {
  // Trang chủ: header trong suốt đè lên hero (chữ trắng), cuộn qua ~50px thì
  // đổi sang nền trắng/chữ đen, transition-all 0.3s như bản gốc.
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const onSearch = useSearchSubmit();
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
  const navLink = (active: boolean) =>
    `flex h-9 items-center text-[13px] text-inherit transition-opacity hover:opacity-70 ${
      active ? "underline underline-offset-[6px]" : ""
    }`;

  return (
    <>
      <Announcement />

      <header className={`transition-all duration-300 ${headerClass}`}>
        <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <nav className="flex items-center gap-6" aria-label="Điều hướng chính">
            <MobileMenu collections={collections} />
            <div className="hidden md:block">
              <ShopMenu collections={collections} />
            </div>
            <Link
              href="/products"
              aria-current={pathname === "/products" ? "page" : undefined}
              className={`hidden md:flex ${navLink(pathname === "/products")}`}
            >
              Tất cả sản phẩm
            </Link>
          </nav>

          <Link
            href="/"
            className="justify-self-center text-[24px] font-medium tracking-[0.14em] text-inherit"
            aria-label="OXI Apparel"
          >
            OXI
          </Link>

          <div className="flex items-center justify-end gap-1 text-inherit">
            <form
              role="search"
              onSubmit={onSearch}
              className="mr-2 hidden h-9 items-center md:flex"
            >
              <label className="flex items-center gap-2 border-b border-current/30 pb-1">
                <input
                  type="search"
                  name="q"
                  placeholder="Tìm kiếm"
                  aria-label="Tìm kiếm sản phẩm"
                  className="w-23 bg-transparent text-[12.5px] text-inherit outline-none placeholder:text-inherit placeholder:opacity-60"
                />
                <button type="submit" aria-label="Tìm" className="opacity-60 hover:opacity-100">
                  <Icon name="search" size={16} />
                </button>
              </label>
            </form>

            <span className="mr-2 hidden text-[13px] text-inherit lg:block">Về chúng tôi</span>

            <WishlistLink active={pathname === "/wishlist"} />
            <Link
              href="/order/lookup"
              aria-label="Tra cứu đơn hàng"
              aria-current={pathname.startsWith("/order") ? "page" : undefined}
              title="Tra cứu đơn hàng"
              className={`${HEADER_ICON_CLASS} hidden sm:flex`}
            >
              <Icon name="package" />
            </Link>
            {/* Tài khoản: chức năng user sẽ làm sau, hiện chỉ giữ chỗ. */}
            <span
              className={`${HEADER_ICON_CLASS} hidden cursor-default opacity-40 hover:opacity-40 sm:flex`}
              title="Tài khoản (sắp ra mắt)"
              aria-hidden="true"
            >
              <Icon name="user" />
            </span>
            <CartDrawer />
          </div>
        </div>
      </header>
    </>
  );
}
