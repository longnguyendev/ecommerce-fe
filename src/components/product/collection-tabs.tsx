import Image from "next/image";
import Link from "next/link";

import { isLocalImage } from "@/lib/image-url";

export interface CollectionTab {
  /** "" = Tất cả. */
  slug: string;
  label: string;
  image: string | null;
}

/** Dải tile bộ sưu tập ở đầu trang /products; tile đang chọn có viền + chữ đậm. */
export function CollectionTabs({ tabs, active }: { tabs: CollectionTab[]; active: string }) {
  return (
    <div className="mt-6">
      <div className="container-page no-bar flex gap-3 overflow-x-auto py-4">
        {tabs.map((t) => {
          const on = t.slug === active;
          return (
            <Link
              key={t.slug || "all"}
              href={t.slug ? `/products?collection=${t.slug}` : "/products"}
              aria-current={on ? "page" : undefined}
              className="group w-[104px] shrink-0 sm:w-[clamp(96px,11vw,160px)]"
            >
              <div
                className={`relative aspect-[4/5] overflow-hidden bg-muted ${
                  on ? "outline outline-1 outline-offset-2 outline-foreground" : ""
                }`}
              >
                {t.image ? (
                  <Image
                    src={t.image}
                    alt={t.label}
                    fill
                    sizes="160px"
                    unoptimized={isLocalImage(t.image)}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
              <span
                className={`mt-2 block text-center text-[12px] ${
                  on ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
