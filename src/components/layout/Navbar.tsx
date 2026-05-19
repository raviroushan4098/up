import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Announcement */}
      <div className="bg-gradient-navy text-primary-foreground text-xs sm:text-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Government of Uttar Pradesh — Official Registration Portal</span>
            <span className="sm:hidden">UP Govt Official Portal</span>
          </span>
          <span className="hidden md:inline opacity-80">Helpline · 1800-180-5555</span>
        </div>
      </div>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-50 transition-base ${
          scrolled ? "glass shadow-soft" : "bg-background/80 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative size-10 rounded-xl bg-gradient-saffron grid place-items-center shadow-glow group-hover:scale-105 transition-spring">
              <span className="font-display font-extrabold text-primary text-lg">भ</span>
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-base sm:text-lg text-primary">Bhavishya UP</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">भविष्य उत्तर प्रदेश</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-base ${
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-foreground/80 hover:text-primary hover:bg-secondary"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-saffron text-primary hover:opacity-90 shadow-soft font-semibold">
              <Link to="/register">Register Now</Link>
            </Button>
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
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
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
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="flex-1 bg-gradient-saffron text-primary font-semibold">
                    <Link to="/register">Register</Link>
                  </Button>
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
