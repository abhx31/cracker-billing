import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NavLinks, NavLinksFallback } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="" width={36} height={36} priority className="size-9" />
          <span className="hidden sm:inline">Jai Bhavani Crackers</span>
        </Link>
        {/* usePathname suspends on routes with unknown params (e.g. /bills/[id]). */}
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
        <ThemeToggle />
      </div>
    </header>
  );
}
