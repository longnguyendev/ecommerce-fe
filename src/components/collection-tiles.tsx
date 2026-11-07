import Link from "next/link";
import { ACTIVITY_TILES } from "@/data/home";

export function CollectionTiles() {
  return (
    <section className="pt-0 pb-4 lg:py-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-5">
          {ACTIVITY_TILES.map((t) => (
            <Link key={t.href} href={t.href} className="group relative bg-background">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={t.image}
                  alt={t.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-background">
                    {t.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
