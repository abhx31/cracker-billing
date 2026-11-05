"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, PackageIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/bills/new", label: "New Bill", icon: PlusIcon, exact: true },
  { href: "/bills", label: "Bills", icon: ReceiptTextIcon, exact: false },
  { href: "/stock", label: "Stock", icon: PackageIcon, exact: false },
] as const;

function isActive(pathname: string | null, href: string, exact: boolean) {
  if (!pathname) return false;
  if (exact) return pathname === href;
  // "/bills" should not light up while on "/bills/new".
  return (pathname === href || pathname.startsWith(`${href}/`)) && pathname !== "/bills/new";
}

export function NavLinks() {
  return <NavLinkList pathname={usePathname()} />;
}

export function NavLinksFallback() {
  return <NavLinkList pathname={null} />;
}

function NavLinkList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
      {links.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(pathname, href, exact) && "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
