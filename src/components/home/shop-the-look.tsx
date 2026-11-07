import Image from "next/image";
import { SectionHeading } from "@/components/shared/section-heading";
import { INSTAGRAM } from "@/data/home";

export function ShopTheLook() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <SectionHeading title="Shop the Look" aside="OXI on You" />

      <div className="no-bar -mx-4 flex gap-[2px] overflow-x-auto px-4 pb-2 snap-x snap-mandatory">
        {INSTAGRAM.map((card) => (
          <a
            key={card.image}
            href="#"
            className="group/card w-[calc(50%-1px)] flex-none cursor-pointer snap-start sm:w-[calc(33.333%-2px)] lg:w-[calc(25%-2px)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <Image
                src={card.image}
                alt={`${card.handle} — ${card.caption}`}
                fill
                sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                className="object-cover object-top transition-transform duration-500 group-hover/card:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover/card:opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[10px] font-medium text-white">
                    {card.handle}
                  </p>
                </div>
                <p className="mt-1.5 line-clamp-1 text-[10px] text-white/80">
                  {card.caption}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
