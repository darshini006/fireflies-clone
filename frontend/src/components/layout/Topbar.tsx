"use client";

import { Bell, CircleHelp, LogOut, Menu, Moon, Plug, Plus, Settings, Sun } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dropdown, MenuDivider, MenuItem } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/hooks/useTheme";
import type { User } from "@/lib/types";

interface Props {
  user: User | null;
  onOpenMenu: () => void;
  onNewMeeting: () => void;
}

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas hover:text-ink";

export function Topbar({ user, onOpenMenu, onNewMeeting }: Props) {
  const toast = useToast();
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
      <button type="button" onClick={onOpenMenu} aria-label="Open navigation" className={`${iconButton} md:hidden`}>
        <Menu className="size-5" />
      </button>
      <div className="hidden md:block" />

      <div className="flex items-center gap-1.5">
        <Button size="sm" onClick={onNewMeeting}>
          <Plus className="size-4" aria-hidden />
          New meeting
        </Button>

        <button
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={iconButton}
          onClick={toggle}
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <button
          type="button"
          aria-label="Help"
          className={iconButton}
          onClick={() => toast.info("The help center is coming soon.")}
        >
          <CircleHelp className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className={iconButton}
          onClick={() => toast.info("You're all caught up. Notifications are coming soon.")}
        >
          <Bell className="size-5" />
        </button>

        <Dropdown
          label="Account menu"
          triggerClassName="ml-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          trigger={<Avatar name={user?.name ?? "?"} id={user?.id ?? 0} size="md" />}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "Loading…"}</p>
            <p className="truncate text-xs text-muted">{user?.email ?? ""}</p>
          </div>
          <MenuDivider />
          <MenuItem href="/settings" icon={<Settings className="size-4" />}>
            Settings
          </MenuItem>
          <MenuItem href="/integrations" icon={<Plug className="size-4" />}>
            Integrations
          </MenuItem>
          <MenuDivider />
          <MenuItem disabled icon={<LogOut className="size-4" />} hint="Not in demo">
            Sign out
          </MenuItem>
        </Dropdown>
      </div>
    </header>
  );
}
