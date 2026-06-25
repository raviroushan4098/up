"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState({ num1: 0, num2: 0 });
  const [userAnswer, setUserAnswer] = useState("");
  const [contact, setContact] = useState({
    office: "Loading...",
    helpline: "Loading...",
    email: "Loading...",
    whatsapp: "Loading...",
  });

  useEffect(() => {
    // Generate math challenge on mount
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setChallenge({ num1: n1, num2: n2 });

    const fetchCMS = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "landingPage"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.contact) {
            setContact(data.contact);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCMS();
  }, []);

  const formatDetailLines = (text: string) => {
    if (!text) return [];
    return text
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    // Client-side quick check
    const parsedAnswer = Number(userAnswer);
    if (parsedAnswer !== challenge.num1 + challenge.num2) {
      toast.error("Incorrect verification answer. Please solve the math question correctly.");
      return;
    }

    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
      num1: challenge.num1,
      num2: challenge.num2,
      mathAnswer: userAnswer,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Message sent! We'll reply within 24 hours.");
        form.reset();

        // Reset challenge
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        setChallenge({ num1: n1, num2: n2 });
        setUserAnswer("");
      } else {
        throw new Error(result.error || "Failed to submit inquiry.");
      }
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast.error(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {loading && <TopLoadingBar />}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* HERO HEADER SKELETON */}
            <section className="bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 py-20 relative overflow-hidden text-center">
              <div className="container mx-auto px-4 max-w-3xl relative z-10 flex flex-col items-center">
                <Skeleton className="h-6 w-24 rounded-full mb-4" />
                <Skeleton className="h-12 w-80 rounded-xl" />
                <Skeleton className="h-4 w-60 rounded-md mt-4" />
                <div className="w-16 h-[2px] bg-neutral-300 mx-auto mt-6" />
              </div>
            </section>

            {/* SPLIT COLUMNS SKELETON */}
            <section className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="grid lg:grid-cols-12 gap-10 items-stretch">
                {/* Left Cards Skeleton */}
                <div className="lg:col-span-6 flex flex-col gap-4 justify-between">
                  {[1, 2, 3, 4].map((i) => (
                    <Card
                      key={i}
                      className="border border-border/85 shadow-sm rounded-2xl bg-white"
                    >
                      <CardContent className="p-6 flex items-center gap-6">
                        <Skeleton className="size-10 rounded-full shrink-0 animate-pulse bg-neutral-200" />
                        <div className="space-y-2 w-full">
                          <Skeleton className="h-4 w-20 rounded animate-pulse bg-neutral-200" />
                          <Skeleton className="h-5 w-40 rounded animate-pulse bg-neutral-200" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Right Map Skeleton */}
                <div className="lg:col-span-6">
                  <Skeleton className="rounded-3xl border border-border/60 h-full w-full min-h-[380px] animate-pulse bg-neutral-200" />
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Redesigned Warm Saffron Hero Header */}
            <section className="bg-gradient-to-r from-[#822216] via-[#c2452b] to-[#f37c35] py-20 relative overflow-hidden text-center text-white">
              <div className="container mx-auto px-4 max-w-3xl relative z-10">
                <Badge
                  variant="outline"
                  className="mb-4 text-white border-white/60 px-4 py-1 text-xs rounded-full bg-transparent hover:bg-white/5 select-none"
                >
                  Contact
                </Badge>
                <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white">
                  We're here to help
                </h1>
                <p className="mt-4 text-white/90 text-sm sm:text-base max-w-lg mx-auto">
                  Reach out anytime — our helpline operates 7am to 9pm, every day.
                </p>
                <div className="w-16 h-[2px] bg-white mx-auto mt-6" />
              </div>
            </section>

            {/* Top Split Columns: Contact Cards & Map Embed */}
            <section className="container mx-auto px-4 py-16 max-w-6xl">
              <div className="grid lg:grid-cols-12 gap-10 items-stretch">
                {/* Left Cards Column */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="lg:col-span-6 flex flex-col gap-4 justify-between"
                >
                  {[
                    { i: Phone, t: "Helpline", d: contact.helpline },
                    { i: Mail, t: "Email Support", d: contact.email },
                    { i: MapPin, t: "Office", d: contact.office },
                    { i: MessageCircle, t: "WhatsApp", d: contact.whatsapp },
                  ].map((c, i) => (
                    <Card
                      key={i}
                      className="border border-border/80 shadow-sm rounded-2xl bg-white hover:border-[#C84B31]/30 transition-all duration-300"
                    >
                      <CardContent className="p-6 flex items-center gap-6">
                        <div className="size-10 rounded-full flex items-center justify-center shrink-0">
                          <c.i className="size-6 text-[#632020]" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider select-none">
                            {c.t}
                          </div>
                          <div className="mt-1 font-semibold text-[#632020] text-sm sm:text-base space-y-0.5">
                            {formatDetailLines(c.d).map((line, idx) => (
                              <div key={idx}>{line}</div>
                            ))}
                            {formatDetailLines(c.d).length === 0 && <div>{c.d}</div>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>

                {/* Right Map Column */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="lg:col-span-6"
                >
                  <div className="rounded-3xl overflow-hidden shadow-sm border border-border/60 h-full w-full min-h-[380px] bg-secondary">
                    <iframe
                      title="Lucknow Map"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=80.85%2C26.78%2C80.99%2C26.89&amp;layer=mapnik"
                      className="w-full h-full border-0"
                    />
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Redesigned Inquiry Form Section: Full-Width Saffron Gradient Banner */}
            <section className="bg-gradient-to-r from-[#822216] via-[#c2452b] to-[#f37c35] py-20 text-white">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid lg:grid-cols-12 gap-10 items-start">
                  {/* Header Column */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-5 space-y-4"
                  >
                    <h2 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">
                      Send us a message
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                      We respond within 24 hours. Feel free to reach out to us for support,
                      questions, or collaboration.
                    </p>
                  </motion.div>

                  {/* Inputs Form Column */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-7 w-full"
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full"
                    >
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase select-none">
                          *Full Name
                        </label>
                        <input
                          required
                          type="text"
                          name="name"
                          placeholder="Aarav Sharma"
                          className="w-full border-b border-white/60 bg-transparent text-white placeholder-white/40 focus:outline-none focus:border-white py-2 text-sm sm:text-base transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase select-none">
                          *Email
                        </label>
                        <input
                          required
                          type="email"
                          name="email"
                          placeholder="you@email.com"
                          className="w-full border-b border-white/60 bg-transparent text-white placeholder-white/40 focus:outline-none focus:border-white py-2 text-sm sm:text-base transition-colors"
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase select-none">
                          *Subject
                        </label>
                        <input
                          required
                          type="text"
                          name="subject"
                          placeholder="How can we help?"
                          className="w-full border-b border-white/60 bg-transparent text-white placeholder-white/40 focus:outline-none focus:border-white py-2 text-sm sm:text-base transition-colors"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase select-none">
                          *Phone Number
                        </label>
                        <input
                          required
                          type="tel"
                          name="phone"
                          placeholder="+91 90000 00000"
                          className="w-full border-b border-white/60 bg-transparent text-white placeholder-white/40 focus:outline-none focus:border-white py-2 text-sm sm:text-base transition-colors"
                        />
                      </div>

                      {/* Message */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase select-none">
                          *Message
                        </label>
                        <textarea
                          required
                          rows={4}
                          name="message"
                          placeholder="Type your message here..."
                          className="w-full border-b border-white/60 bg-transparent text-white placeholder-white/40 focus:outline-none focus:border-white py-2 text-sm sm:text-base transition-colors resize-none"
                        />
                      </div>

                      {/* Verification challenge */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs sm:text-sm font-bold text-white/90 tracking-wide uppercase select-none">
                          * Verification: What is {challenge.num1} + {challenge.num2}?
                        </label>
                        <input
                          required
                          type="number"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Enter answer"
                          className="w-full border-b border-white/60 bg-transparent text-white placeholder-white/40 focus:outline-none focus:border-white py-2 text-sm sm:text-base transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Submit button */}
                      <div className="sm:col-span-2 pt-4">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="rounded-full px-10 py-3.5 bg-white text-[#C84B31] font-bold text-sm sm:text-base shadow-md hover:bg-white/90 active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Message"
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
