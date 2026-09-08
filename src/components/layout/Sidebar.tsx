"use client";

import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/folders", label: "Dokumen", icon: FolderOpen, exact: false },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer whenever the route changes (React-recommended
  // "adjust state during render" pattern instead of an effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const items = [
    ...NAV_ITEMS,
    ...(profile.role === "admin"
      ? [{ href: "/people", label: "Pengguna", icon: Users, exact: true }]
      : []),
    { href: "/settings", label: "Pengaturan", icon: Settings, exact: true },
  ];

  return (
    <>
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
          className="md:hidden fixed top-4 left-4 z-30 flex size-10 items-center justify-center rounded-lg bg-white border border-border shadow-sm text-dark"
        >
          <Menu className="size-5" />
        </button>
      )}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-dark/30"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed md:relative inset-y-0 left-0 z-50 h-screen shrink-0 flex flex-col bg-white border-r border-border transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-600 text-white">
            <ShieldCheck className="size-4.5" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-dark truncate flex-1">
              ArsipOne GRCC
            </span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
            className="md:hidden ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted hover:text-dark hover:bg-surface transition-colors"
          >
            <X className="size-4" />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex ml-auto size-7 shrink-0 items-center justify-center rounded-md text-muted hover:text-dark hover:bg-surface transition-colors"
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-50 text-accent-700"
                    : "text-muted hover:text-dark hover:bg-surface"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent-600"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon className="size-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 flex flex-col gap-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-1 py-1.5">
              <Avatar name={profile.full_name || profile.email} size="md" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-dark truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-[11px] text-muted capitalize">
                  {profile.role === "admin" ? "Administrator" : "Pengguna"}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 rounded-lg px-3 h-9 text-sm text-muted hover:text-dark hover:bg-surface transition-colors disabled:opacity-50"
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
