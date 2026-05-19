import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import authImg from "@/assets/auth-illustration.jpg";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-soft">
      <div className="relative hidden lg:flex bg-gradient-hero text-primary-foreground p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-20 -right-20 size-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-96 rounded-full bg-primary-glow blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col h-full w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-saffron grid place-items-center"><span className="font-display font-extrabold text-primary text-lg">भ</span></div>
            <div className="leading-tight"><div className="font-display font-bold">Bhavishya UP</div><div className="text-xs opacity-80">Govt. of Uttar Pradesh</div></div>
          </Link>
          <div className="my-auto">
            <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} src={authImg} alt="" className="max-w-md mx-auto drop-shadow-2xl" />
            <h2 className="mt-8 font-display font-extrabold text-3xl leading-tight">नए उत्तर प्रदेश का<br /><span className="text-accent-glow">नया भविष्य</span></h2>
            <p className="mt-3 opacity-80 max-w-md">Join 2.4 lakh+ citizens accessing government opportunities through a single, secure portal.</p>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-80"><ShieldCheck className="size-4" /> Secured under IT Act 2000 · Govt. of India</div>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-base"><ArrowLeft className="size-4" /> Back to home</Link>
        <div className="max-w-md w-full mx-auto my-auto py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display font-extrabold text-3xl text-primary">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
