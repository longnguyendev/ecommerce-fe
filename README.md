# OXI App — homepage + catalog rebuild (Next.js + shadcn/ui)

Bản dựng lại **sạch** trang chủ `oxi-apparel.com/` (và nối sang `/products`) bằng
**Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui**, dùng design tokens đo
được từ bản clone (`DM Sans`, nền trắng/đen, type scale 13px/16px, max-width
1440px).

Khác với bản mirror tĩnh (241 MB), đây là **codebase component hóa, bảo trì được**.

## Chạy

```bash
cd app
npm install
npm run dev        # http://localhost:3400
```

Production: `npm run build && npm start`

## Cấu trúc

```
app/
├── public/images/
│   ├── products/*  collections/*   ← 630 ảnh sản phẩm + tile
│   ├── hero/ activity/ instagram/  ← ảnh trang chủ (từ bản mirror)
└── src/
    ├── lib/catalog.ts              ← types, formatPrice, colorName, filters
    ├── data/home.ts                ← nội dung trang chủ (hero, tiles, IG, thứ tự sản phẩm)
    ├── components/ui/              ← shadcn/ui (button, card, sheet, badge, input, separator)
    ├── components/                 ← site-header, hero, tiles, product-card, shop-the-look, footer…
    └── app/
        ├── page.tsx                ← trang chủ
        ├── products/page.tsx       ← catalog + filter + sort
        └── products/[slug]/page.tsx← 214 trang chi tiết (SSG)
```

## shadcn/ui đã dùng

- `Button` (CTA, thêm giỏ hàng, đăng ký) · `Sheet` (giỏ hàng drawer)
- `Badge` (nhãn giảm giá) · `Input` (newsletter) · `Separator` (footer)
- `Card` (sẵn sàng, chưa dùng trực tiếp — product card dùng cấu trúc `sf-card` gốc)

## Trang chủ — các section

| # | Section | Thành phần |
|---|---|---|
| 1 | Hero | `hero.tsx` — full-bleed ảnh "Love" + 2 CTA + h1 sr-only |
| 2 | 5 tile hoạt động | `collection-tiles.tsx` (Court/Studio/Tập luyện/Lounge/Chạy bộ) |
| 3 | Bộ sưu tập | product grid (collection lookbook) |
| 4 | Tất cả sản phẩm | product grid + nút "Xem tất cả" → `/products` |
| 5 | Shop the Look | `shop-the-look.tsx` (Instagram gallery) |
| 6 | Header + footer + cart drawer | `site-header.tsx`, `site-footer.tsx` |

## Đã kiểm tra

- `npm run build` → **220 trang** static/SSG, không lỗi type
- `/`, `/products`, `/products/[slug]` đều trả `200`
- Font **DM Sans** tải đúng (`next/font/google`), 0 ảnh vỡ sau khi cuộn
- 214 card sản phẩm render đúng, filter/sort hoạt động, trang chi tiết có chọn size + thêm giỏ

## Hạn chế (trung thực)

- **Catalog cũ hơn trang chủ**: `catalog.json` scrape 2026-10-31, thiếu ~21 sản phẩm
  collection mới (Balance, Courtney, Muse, Poise, Rally, Focus, Bare, Shape, Flow).
  Vì vậy section "Tất cả sản phẩm" trên trang chủ hiện ít sản phẩm hơn trang gốc.
- `/api/*` (giỏ hàng thật, tìm kiếm server) cần backend; giỏ hàng là drawer tĩnh.
- Logo là chữ "OXI" (text logo).

## Pháp lý

Logo, ảnh sản phẩm, tên sản phẩm, giá và nội dung là tài sản của OXI Apparel.
Bản sao **cục bộ** cho mục đích học kỹ thuật — không deploy công khai, không
dùng để bán hàng hay giả mạo thương hiệu.
