/** Homepage-only content, measured from https://eql-apparel.com/ (2026-11-04). */

export const HERO = {
  h1: "EQL Apparel — Đồ thể thao cao cấp, thiết kế tại Việt Nam",
  image: "/images/hero/love-landscape.jpg",
  imageMobile: "/images/hero/love-portrait.jpg",
  alt: "Love has entered the room — Love Skirts by EQL Apparel",
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
  { image: "/images/instagram/f5d90fdc63b1aa18.jpg", handle: "@huynnnhnhu", caption: "yoga day in my fav cream fit 🤍" },
  { image: "/images/instagram/3ab2e9470bef8d39.jpg", handle: "@vananhscarlet", caption: "Starting the month strong 💪" },
  { image: "/images/instagram/b17a05fc63a10d50.jpg", handle: "@tu_hhao", caption: "in my tennis girl era 🎾" },
  { image: "/images/instagram/86fd4077b67e64f6.jpg", handle: "@_hatmitmit_", caption: "Serving Valentine energy all day in our Celebre Collection ❤️" },
  { image: "/images/instagram/5624583597062e9b.jpg", handle: "@hmeuu", caption: "Doing my stretches, drinking my water, keeping my day quiet." },
];

/** Product slug order for the two homepage grids, as rendered on the live page. */
export const COLLECTION_SLUGS = [
  "contour-bra-smoky-navy-xanh-navy-khoi", "contour-capri-smoky-navy-xanh-navy-khoi",
  "contour-bra-kaki-nau-kaki", "contour-capri-kaki-nau-kaki",
  "track-bra-green-white-xanh-trang", "track-jacket-green-white-xanh-trang", "track-skirts-green-white-xanh-trang",
  "track-bra-white-brown-trang-nau", "track-jacket-white-brown-trang-nau", "track-skirts-white-brown-trang-nau",
  "serene-bra-nau-brown", "serene-shorts-nau-brown",
  "serene-bra-buttermilk-vang-kem", "serene-shorts-buttermilk-vang-kem",
  "serene-bra-baby-blue-xanh-baby", "serene-shorts-baby-blue-xanh-baby",
  "serene-bra-tangerine-cam", "serene-bra-coconut-trang-kem",
  "smash-top-lilac-tim-ca", "smash-skirts-lilac-tim-ca",
  "off-duty-cover-white-trang", "off-duty-cover-black-den",
  "air-tank-sky-xanh-lo", "air-bra-sky-xanh-lo", "air-leggings-sky-xanh-lo",
  "air-tank-navy", "air-bra-navy", "air-leggings-navy",
  "serene-2-0-bra-buttermilk-vang-kem", "serene-2-0-bra-baby-blue-xanh-baby",
  "form-bra-purple-tim-dam", "form-leggings-purple-tim-dam",
];

export const ALL_SLUGS = [
  "sculpt-black-den-bra", "sculpt-black-den-short-sleeve-ao-coc-tay", "sculpt-black-den-standard-leggings-thuong", "sculpt-black-den-flare-leggings-loe",
  "sculpt-azure-xanh-thanh-thien-bra", "sculpt-azure-xanh-thanh-thien-short-sleeve-ao-coc-tay", "sculpt-azure-xanh-thanh-thien-standard-leggings-thuong", "sculpt-azure-xanh-thanh-thien-flare-leggings-loe",
  "femme-long-leggings-black", "femme-long-bra-cream", "femme-long-leggings-cream",
  "balance-bra-brown", "balance-leggings-grey", "balance-bra-yellow",
  "courtney-bra-green", "courtney-skirts-green", "courtney-skirts-black", "courtney-bra-cobalt", "courtney-skirts-cobalt",
  "shape-leggings-orange",
  "track-jacket-green-white-xanh-trang", "track-bra-green-white-xanh-trang", "track-skirts-green-white-xanh-trang", "track-bra-white-brown-trang-nau",
  "flow-bra-nau-brown", "rally-top-den-black", "rally-skirts-den-black", "ace-top-cherry-do-cherry",
  "bare-shorts-nau-brown", "focus-shorts-red", "focus-bra-white",
  "contour-bra-smoky-navy-xanh-navy-khoi", "contour-capri-smoky-navy-xanh-navy-khoi",
  "muse-skirts-navy", "muse-bra-black", "muse-skirts-black",
  "poise-bra-purple", "poise-bra-brown", "poise-leggings-brown", "poise-bra-black",
  "air-bra-navy", "air-tank-navy", "air-leggings-navy", "air-bra-sky-xanh-lo",
  "serene-leggings-cream", "serene-bra-baby-blue-xanh-baby", "love-skirts-white-trang", "fleur-leggings-butter-vang-bo",
  "serene-2-0-bra-buttermilk-vang-kem", "off-duty-cover-white-trang",
];
