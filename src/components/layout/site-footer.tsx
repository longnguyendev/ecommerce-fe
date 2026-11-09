import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const COLUMNS = [
  {
    title: "Cửa hàng",
    links: [
      { label: "Tất cả sản phẩm", href: "/products" },
      { label: "Hàng mới", href: "/products?tag=new" },
      { label: "Tennis", href: "/products?activity=court" },
      { label: "Yoga", href: "/products?activity=studio" },
      { label: "Lounge", href: "/products?activity=lounge" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Câu hỏi thường gặp", href: "/faq" },
      { label: "Vận chuyển", href: "/shipping" },
      { label: "Đổi trả", href: "/returns" },
      { label: "Hướng dẫn chọn size", href: "/size-guide" },
      { label: "Chất liệu", href: "/fabric" },
    ],
  },
  {
    title: "Công ty",
    links: [
      { label: "Về chúng tôi", href: "/about" },
      { label: "Bán sỉ", href: "/portal" },
      { label: "Liên hệ", href: "/contact" },
      { label: "Tuyển dụng", href: "/careers" },
    ],
  },
];

const PAYMENTS = ["Visa", "Mastercard", "JCB", "VietQR", "COD"];

export function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-border bg-[#f4f4f4]">
      <div className="mx-auto max-w-360 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-10">
          <Link href="/" className="text-2xl tracking-[0.2em] text-foreground">
            OXI
          </Link>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-10">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-6 text-[11px] font-normal uppercase tracking-[0.2em] text-foreground">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-[#767676] transition-colors hover:opacity-70"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-6 text-[11px] font-normal uppercase tracking-[0.2em] text-foreground">
              Kết nối
            </h4>
            <p className="mb-4 text-[13px] text-[#767676]">Nhận thông tin mới nhất</p>
            <form className="flex max-w-md flex-col sm:flex-row">
              <Input
                type="email"
                placeholder="Nhập email của bạn"
                required
                className="min-w-0 flex-1 rounded-none border-border bg-transparent px-3 py-2.5 text-[16px] focus-visible:ring-1 focus-visible:ring-foreground"
              />
              <Button
                type="submit"
                variant="outline"
                className="mt-2 h-auto rounded-none border-foreground px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background sm:mt-0 sm:shrink-0"
              >
                Đăng ký
              </Button>
            </form>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pb-4 text-[#767676] sm:justify-start">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest">
            <span>Giao đến:</span>
            <span className="font-medium text-foreground">Vietnam</span>
            <span className="ml-1 text-[#999]">(VND)</span>
          </span>
          <span className="text-[#d0d0d0]">|</span>
          <div className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest">
            <span>Ngôn ngữ:</span>
            <button
              type="button"
              className="font-medium underline underline-offset-2 text-foreground"
            >
              Tiếng Việt
            </button>
            <span className="text-[#d0d0d0]">/</span>
            <button type="button" className="transition-colors hover:text-foreground">
              English
            </button>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
          <div className="flex items-center gap-3">
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="inline-flex h-6 items-center rounded-[4px] border-[0.5px] border-[#767676] bg-[#f5f3ef] px-2 text-[8px] font-semibold uppercase tracking-[0.06em] text-[#767676]"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[#767676]">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-opacity hover:opacity-70"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="transition-opacity hover:opacity-70"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.44a4.85 4.85 0 01-2.67-.81 4.83 4.83 0 01-1.33-4.46z" />
              </svg>
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition-opacity hover:opacity-70"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 pb-4 sm:gap-8">
          <span className="flex items-center gap-1.5 text-xs text-[#767676]">
            Thanh toán an toàn
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#767676]">Chính hãng 100%</span>
          <span className="flex items-center gap-1.5 text-xs text-[#767676]">Đổi hàng dễ dàng</span>
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
          <p className="text-xs text-[#767676]">© 2026 OXI Apparel. Đã đăng ký bản quyền.</p>
          <div className="flex items-center gap-4 text-xs text-[#767676]">
            <Link href="/privacy" className="transition-opacity hover:opacity-70">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="transition-opacity hover:opacity-70">
              Điều khoản
            </Link>
            <Link href="/accessibility" className="transition-opacity hover:opacity-70">
              Khả năng tiếp cận
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
