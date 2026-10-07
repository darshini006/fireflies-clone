"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

const MenuContext = createContext<{ close: () => void }>({ close: () => {} });

interface DropdownProps {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  align?: "left" | "right";
  children: ReactNode;
}

export function Dropdown({ label, trigger, triggerClassName, align = "right", children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "pop-in absolute z-30 mt-2 min-w-[208px] rounded-xl border border-line bg-surface p-1.5 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <MenuContext.Provider value={{ close: () => setOpen(false) }}>{children}</MenuContext.Provider>
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  children: ReactNode;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
}

export function MenuItem({ children, icon, href, onClick, danger, disabled, hint }: ItemProps) {
  const { close } = useContext(MenuContext);
  const className = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    disabled
      ? "cursor-not-allowed text-muted"
      : danger
        ? "text-danger hover:bg-red-50"
        : "text-ink hover:bg-brand-50",
  );
  const content = (
    <>
      {icon}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} role="menuitem" onClick={close} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={className}
      onClick={() => {
        close();
        onClick?.();
      }}
    >
      {content}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-line" role="separator" />;
}
