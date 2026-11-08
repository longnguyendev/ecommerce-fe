/** Homepage-only content, measured from https://oxi-apparel.com/ (2026-11-04). */

export const HERO = {
  h1: "OXI Apparel — Đồ thể thao cao cấp, thiết kế tại Việt Nam",
  image: "/images/hero/love-landscape.jpg",
  imageMobile: "/images/hero/love-portrait.jpg",
  alt: "Love has entered the room — Love Skirts by OXI Apparel",
  ctas: [
    { label: "Mua ngay", href: "/products?q=love+skirts", variant: "primary" as const },
    { label: "Khám phá", href: "/collections", variant: "outline" as const },
  ],
};

export const ACTIVITY_TILES = [
  { label: "Court", href: "/products?activity=tennis", image: "/images/activity/tennis.jpg" },
  { label: "Studio", href: "/products?activity=yoga", image: "/images/activity/yoga.jpg" },
  { label: "Tập luyện", href: "/products?activity=gym", image: "/images/activity/train.jpg" },
  { label: "Lounge", href: "/products?activity=lounge", image: "/images/activity/lounge.jpg" },
  { label: "Chạy bộ", href: "/products?activity=run", image: "/images/activity/run.jpg" },
];

export const INSTAGRAM = [
  {
    image: "/images/instagram/f5d90fdc63b1aa18.jpg",
    handle: "@huynnnhnhu",
    caption: "yoga day in my fav cream fit 🤍",
  },
  {
    image: "/images/instagram/3ab2e9470bef8d39.jpg",
    handle: "@vananhscarlet",
    caption: "Starting the month strong 💪",
  },
  {
    image: "/images/instagram/b17a05fc63a10d50.jpg",
    handle: "@tu_hhao",
    caption: "in my tennis girl era 🎾",
  },
  {
    image: "/images/instagram/86fd4077b67e64f6.jpg",
    handle: "@_hatmitmit_",
    caption: "Serving Valentine energy all day in our Celebre Collection ❤️",
  },
  {
    image: "/images/instagram/5624583597062e9b.jpg",
    handle: "@hmeuu",
    caption: "Doing my stretches, drinking my water, keeping my day quiet.",
  },
];

/** Hai tile cố định đầu dải bộ sưu tập ở /products; các tile còn lại lấy từ API (Collection). */
export const ALL_TILE = { slug: "", label: "Tất cả", image: "/images/collections/tat-ca.webp" };
export const NEW_TILE = { slug: "moi", label: "Mới", image: "/images/collections/moi.webp" };
export const NEW_PRODUCT_COUNT = 24;
