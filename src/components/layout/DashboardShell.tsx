"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  children,
  nav,
  brandLabel,
  brandSub,
}: {
  children: ReactNode;
  nav: NavItem[];
  brandLabel: string;
  brandSub: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      toast.success("Logged out successfully");
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = () => {
    if (!profile?.fullName) return "C";
    return profile.fullName
      .split(" ")
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const Sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-6 h-16 flex items-center gap-3 border-b">
        <div className="size-9 rounded-xl bg-white overflow-hidden grid place-items-center">
          <img src="/brandlogo2.svg" alt="Logo" className="w-full h-full object-contain p-1" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold text-sm text-primary">{brandLabel}</div>
          <div className="text-[10px] text-muted-foreground">{brandSub}</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((n) => {
          const active =
            pathname === n.to ||
            (n.to !== "/dashboard" && n.to !== "/admin" && pathname.startsWith(n.to));
          return (
            <Link
              key={n.to}
              href={n.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-base ${
                active
                  ? "bg-gradient-saffron text-primary shadow-soft"
                  : "text-foreground/70 hover:bg-secondary hover:text-primary"
              }`}
            >
              <n.icon className="size-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary text-left cursor-pointer"
        >
          <LogOut className="size-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-soft flex">
      <aside className="hidden lg:flex w-64 shrink-0 bg-sidebar border-r flex-col">{Sidebar}</aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 22 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r z-50 lg:hidden"
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-3">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="font-display font-bold text-primary text-lg">Dashboard</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="size-9 rounded-full bg-gradient-saffron grid place-items-center font-display font-bold text-primary text-sm uppercase">
              {getInitials()}
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col gap-4 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
