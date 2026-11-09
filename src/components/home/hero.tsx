import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HERO } from "@/data/home";

export function Hero() {
  return (
    <section className="relative bg-foreground">
      <div className="relative aspect-2/3 sm:aspect-auto sm:h-[calc(100vh-100px)] min-h-100 sm:min-h-125">
        {/* mobile portrait */}
        <Image
          src={HERO.imageMobile}
          alt={HERO.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover sm:hidden"
        />
        {/* desktop landscape */}
        <Image
          src={HERO.image}
          alt={HERO.alt}
          fill
          priority
          sizes="100vw"
          className="hidden object-cover sm:block"
        />
        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="container-page pb-8 sm:pb-12">
            <h1 className="sr-only">{HERO.h1}</h1>
            <div className="flex items-center gap-3">
              <Button
                render={<Link href={HERO.ctas[0].href} />}
                nativeButton={false}
                variant="default"
                className="h-12 rounded-none bg-background px-10 text-xs font-normal uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                {HERO.ctas[0].label}
              </Button>
              <Button
                render={<Link href={HERO.ctas[1].href} />}
                nativeButton={false}
                variant="outline"
                className="hidden h-12 rounded-none border-background bg-transparent px-10 text-xs font-normal uppercase tracking-[0.15em] text-background hover:bg-background hover:text-foreground sm:inline-flex"
              >
                {HERO.ctas[1].label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
