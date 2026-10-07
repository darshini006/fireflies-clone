"use client";

import {
  BarChart3,
  BookOpen,
  Mic,
  Plug,
  Settings,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { User } from "@/lib/types";

interface NavItem {
  label: string;
  href?: string; // no href = placeholder, not built in this project
  icon: LucideIcon;
}

const MAIN: NavItem[] = [
  { label: "Meetings", href: "/meetings", icon: Video },
  { label: "Notebooks", icon: BookOpen },
  { label: "Soundbites", icon: Mic },
  { label: "Analytics", icon: BarChart3 },
];

const MORE: NavItem[] = [
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

  if (!item.href) {
    return (
      <div aria-disabled className={cn(base, "cursor-not-allowed text-muted/80")}>
        <Icon className="size-[18px]" aria-hidden />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">Soon</span>
      </div>
    );
  }

  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(base, active ? "bg-brand-50 text-accent-strong" : "text-ink-soft hover:bg-canvas hover:text-ink")}
    >
      <Icon className="size-[18px]" aria-hidden />
      {item.label}
    </Link>
  );
}

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-line bg-surface">
      <Link href="/meetings" className="flex h-14 items-center gap-2.5 px-5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-brand-600 text-white">
          <Sparkles className="size-[18px]" aria-hidden />
        </span>
        <span className="text-lg font-semibold tracking-tight text-ink">Fireflies</span>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
        <div className="space-y-1">
          {MAIN.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} />
          ))}
        </div>
        <div className="space-y-1">
          {MORE.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.name ?? "?"} id={user?.id ?? 0} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name ?? "Loading…"}</p>
            <p className="truncate text-xs text-muted">{user?.email ?? ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
