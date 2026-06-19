import Image from "next/image";
import type { FooterContent } from "@/modules/website/lib/content";

export function Footer({ content }: { content: FooterContent }) {
  return (
    <footer className="relative overflow-hidden border-t border-edge bg-carbon py-14">
      <div className="pointer-events-none absolute bottom-[-60%] left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-crimson/8 blur-[120px]" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 sm:flex-row sm:items-center lg:px-8">
        <div className="flex items-center gap-4">
          <div className="logo-badge h-12 w-12 p-2">
            <div className="relative h-full w-full">
              <Image src="/logo.png" alt="Herrera C&T" fill className="object-contain" />
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-snow">
              Herrera{" "}
              <span className="font-mono text-[9px] font-normal uppercase tracking-[0.26em] text-fog">
                Consulting &amp; Technology
              </span>
            </p>
            <p className="mt-1.5 max-w-sm text-sm text-fog">{content.tagline}</p>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          © {new Date().getFullYear()} {content.copyright}
        </p>
      </div>
    </footer>
  );
}
