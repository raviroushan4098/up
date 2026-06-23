"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [passId, setPassId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchPass = async () => {
        try {
          const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
            where("passGenerated", "==", true),
            limit(1),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setPassId(snap.docs[0].data().passId || null);
          } else {
            setPassId(null);
          }
        } catch (e) {
          console.error("Failed to fetch user pass in navbar", e);
        }
      };
      fetchPass();
    } else {
      setPassId(null);
    }
  }, [user]);

  const menuItems = [...nav];
  if (user && !loading) {
    menuItems.push({
      to: passId ? `/pass/${passId}` : "/pass/none",
      label: "My Pass",
    });
  }
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-50 transition-base ${
          scrolled ? "glass shadow-soft" : "bg-background/80 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative size-10 rounded-xl bg-white grid place-items-center shadow-glow group-hover:scale-105 transition-spring overflow-hidden">
              <img src="/brandlogo2.svg" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-base sm:text-lg text-primary">
                Bhavishya E Uttar Pradesh
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">
                भविष्य ए उत्तर प्रदेश
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {menuItems.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  href={n.to}
                  className={`relative py-2 text-sm font-medium transition-base ${
                    active ? "text-[#8B4513]" : "text-foreground/70 hover:text-[#8B4513]"
                  }`}
                >
                  {n.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#8B4513] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {!loading && user ? (
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full px-4 h-9 border-primary/20 hover:bg-primary/5"
              >
                <Link href="/dashboard">
                  {profile?.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt="Profile"
                      className="size-6 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {profile?.fullName?.charAt(0) || user.email?.charAt(0) || (
                        <User className="size-3" />
                      )}
                    </div>
                  )}
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              </Button>
            ) : !loading ? (
              <>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#C84B31] text-white hover:bg-[#B33F28] rounded-full px-6 font-semibold shadow-soft"
                >
                  <Link href="/login">Login/Get Started</Link>
                </Button>
              </>
            ) : (
              <div className="w-40 h-9 animate-pulse bg-secondary rounded-md" />
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-base"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t bg-background"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                {menuItems.map((n) => (
                  <Link
                    key={n.to}
                    href={n.to}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-base ${
                      pathname === n.to
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {n.label}
                  </Link>
                ))}
                <div className="flex gap-2 mt-3">
                  {!loading && user ? (
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 bg-primary/5 border-primary/20"
                    >
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  ) : !loading ? (
                    <>
                      <Button
                        asChild
                        className="flex-1 bg-gradient-saffron text-primary font-semibold"
                      >
                        <Link href="/login">Login / Get Started</Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-0.5 bg-gradient-tricolor" />
      </motion.header>
    </>
  );
}
