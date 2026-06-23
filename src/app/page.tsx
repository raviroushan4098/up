"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  Rocket,
  GraduationCap,
  HeartHandshake,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Phone,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateString, isDeadlinePassed, getDerivedEventStatus } from "@/lib/utils";
import { UPEvent } from "@/types/events";
import heroImg from "@/assets/hero-up.jpg";

// CMS & Firebase
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { LandingPageCMS } from "@/types/cms";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

// Helper to map string icon names to Lucide components
const IconMap: Record<string, any> = {
  Users,
  MapPin,
  CheckCircle2,
  Calendar,
  Award,
  HeartHandshake,
  Rocket,
  GraduationCap,
  ShieldCheck,
};

export default function HomePage() {
  const [cms, setCms] = useState<LandingPageCMS | null>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [totalApplications, setTotalApplications] = useState<number | null>(null);

  // Hero carousel
  const [activeIndex, setActiveIndex] = useState(0);

  // Featured Events carousel
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const heroImages = cms?.hero?.images?.length
    ? cms.hero.images
    : cms?.hero?.image
      ? [cms.hero.image]
      : [heroImg.src];

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Auto-advance the Featured Events carousel every 3s
  useEffect(() => {
    if (liveEvents.length <= 1) return;
    const timer = setInterval(() => {
      setActiveEventIndex((prev) => (prev + 1) % liveEvents.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [liveEvents.length]);

  // Determine visible events for infinite circular loop
  const getVisibleEvents = () => {
    if (liveEvents.length === 0) return [];

    let windowSize = 5; // We show up to 5 cards at a time
    if (liveEvents.length < 5) {
      windowSize = liveEvents.length % 2 === 0 ? liveEvents.length - 1 : liveEvents.length;
    }
    if (liveEvents.length < 3) windowSize = 1;

    const items = [];
    const half = Math.floor(windowSize / 2);
    for (let offset = -half; offset <= half; offset++) {
      let idx = (activeEventIndex + offset) % liveEvents.length;
      if (idx < 0) idx += liveEvents.length;
      items.push({ ...liveEvents[idx], originalIndex: idx });
    }
    return items;
  };

  const visibleEvents = getVisibleEvents();

  // Strict Firebase Fetch
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        // 1. Fetch CMS Text Overrides
        const docRef = doc(db, "settings", "landingPage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCms(docSnap.data() as LandingPageCMS);
        } else {
          console.error("Landing page CMS not seeded in Firebase yet!");
        }

        // 2. Fetch Actual Live Events (Top 3 prioritized by Open status)
        const eventsRef = collection(db, "events");
        const qEvents = query(eventsRef, orderBy("createdAt", "desc"));
        const eventsSnap = await getDocs(qEvents);
        if (!eventsSnap.empty) {
          const fetchedEvents = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

          fetchedEvents.sort((a: any, b: any) => {
            const aIsClosed = isDeadlinePassed(a.deadline) || a.status === "Closed";
            const bIsClosed = isDeadlinePassed(b.deadline) || b.status === "Closed";
            if (aIsClosed !== bIsClosed) {
              return aIsClosed ? 1 : -1;
            }
            return 0;
          });

          setLiveEvents(fetchedEvents);
        }

        // 3. Fetch Total Applications & Global Stats
        const globalStatsRef = doc(db, "counters", "global");
        const globalStatsSnap = await getDoc(globalStatsRef);
        if (globalStatsSnap.exists()) {
          const statsData = globalStatsSnap.data();
          setGlobalStats(statsData);
          setTotalApplications(statsData.totalApplications || 0);
        }
      } catch (error) {
        console.error("Failed to fetch landing page data:", error);
      }
    };
    fetchLandingData();
  }, []);

  if (!cms) {
    return (
      <PublicLayout>
        {/* HERO SKELETON */}
        <section className="relative overflow-hidden min-h-[80vh]">
          <div className="container mx-auto px-4 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-3/4 rounded-xl" />
                <Skeleton className="h-16 w-1/2 rounded-xl" />
              </div>
              <Skeleton className="h-20 w-5/6 rounded-lg" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-lg" />
              </div>
            </div>
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          </div>
        </section>
      </PublicLayout>
    );
  }

  const mainEvent = liveEvents[0];

  const profileSections =
    cms.profileSections && cms.profileSections.length > 0
      ? cms.profileSections
      : [
          {
            id: "speakers-legacy",
            title: "Speakers",
            visible: cms.visibility?.speakers ?? true,
            members: cms.speakers || [],
          },
        ];

  return (
    <PublicLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* ═══════════════ HERO ═══════════════ */}
          {cms.visibility?.hero !== false && (
            <section className="relative overflow-hidden min-h-[70vh] flex items-center">
              {/* ── Background: Sliding Images / Video ── */}
              <div className="absolute inset-0 -z-20">
                {cms.hero.videoUrl ? (
                  <iframe
                    src={`${cms.hero.videoUrl}${cms.hero.videoUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1&loop=1&controls=0&showinfo=0`}
                    title="Bhavishya E Uttar Pradesh"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={activeIndex}
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      src={heroImages[activeIndex]}
                      alt="Youth of Uttar Pradesh"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </AnimatePresence>
                )}
              </div>

              {/* ── Golden overlay for readability ── */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/55 via-[#FFF8F0]/50 to-white/60" />

              {/* ── Decorative golden wave SVG ── */}
              <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <svg
                  className="absolute -left-20 top-0 h-full w-[60%] opacity-[0.12]"
                  viewBox="0 0 600 800"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 0C200 100 400 200 300 400C200 600 500 700 600 800H0V0Z"
                    fill="url(#gold)"
                  />
                  <defs>
                    <linearGradient id="gold" x1="0" y1="0" x2="600" y2="800">
                      <stop offset="0%" stopColor="#F4A460" />
                      <stop offset="100%" stopColor="#C84B31" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* ── Hero Content (centered text) ── */}
              <div className="container mx-auto px-4 py-20 lg:py-28">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="text-center max-w-3xl mx-auto"
                >
                  {/* Badge */}
                  <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-[#8B4513]/40 text-[#8B4513] text-sm font-medium backdrop-blur-sm bg-white/40">
                      {cms.hero.badgeText ||
                        "Empowering Youth · Inspiring Leadership · Building The Nation"}
                    </span>
                  </div>

                  {/* Main Hindi Heading */}
                  <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] text-[#3D1B0E] mb-4">
                    भविष्य-ए-उत्तर प्रदेश
                  </h1>

                  {/* Hindi Subtitle */}
                  <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#2D2D2D] mb-6">
                    {cms.hero.titleLine1 || "विकसित भारत की सीढ़ी, आज की युवा पीढ़ी"}
                  </h2>

                  {/* English Description */}
                  <p className="text-base sm:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                    {cms.hero.subtitle}
                  </p>
                </motion.div>
              </div>

              {/* ── Slide indicators ── */}
              {heroImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {heroImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? "w-8 bg-[#C84B31]"
                          : "w-3 bg-[#8B4513]/30 hover:bg-[#8B4513]/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ═══════════════ DYNAMIC PROFILE SECTIONS ═══════════════ */}
          {profileSections.map(
            (section) =>
              section.visible &&
              section.members &&
              section.members.length > 0 && (
                <section
                  key={section.id}
                  className="container mx-auto px-4 pt-16 pb-6 lg:pt-20 lg:pb-8"
                >
                  <motion.div {...fadeUp} className="text-center mb-10">
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E]">
                      {section.title}
                    </h2>
                  </motion.div>
                  <motion.div
                    {...fadeUp}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
                  >
                    {section.members.map((member, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      >
                        <Card className="border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring overflow-hidden h-full">
                          <div className="aspect-square overflow-hidden bg-muted">
                            <img
                              src={member.image || "/placeholder-avatar.png"}
                              alt={member.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4 text-center">
                            <h3 className="font-display font-bold text-sm sm:text-base text-[#3D1B0E]">
                              {member.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{member.role}</p>
                            {member.phone && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                <Phone className="size-3" />
                                {member.phone}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              ),
          )}

          {/* ═══════════════ EVENTS CAROUSEL ═══════════════ */}
          {liveEvents.length > 0 && (
            <section className="container mx-auto px-4 pt-2 pb-8 lg:pt-3 lg:pb-12 overflow-hidden">
              <motion.div {...fadeUp} className="flex items-center justify-between mb-8">
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E]">
                  Events
                </h2>
                <Button asChild variant="ghost" className="text-sm">
                  <Link href="/events">
                    View all events <ChevronRight className="size-4 ml-1" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div {...fadeUp}>
                <div className="relative w-full overflow-hidden flex justify-center items-center h-[500px]">
                  <AnimatePresence mode="popLayout">
                    {visibleEvents.map((e) => {
                      const isActive = e.originalIndex === activeEventIndex;
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: isActive ? 1 : 0.6, scale: isActive ? 1 : 0.95 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                          key={e.id}
                          onClick={() => setActiveEventIndex(e.originalIndex)}
                          className={`flex-shrink-0 mx-2 sm:mx-3 rounded-2xl overflow-hidden cursor-pointer ${
                            isActive
                              ? "w-[280px] sm:w-[340px] md:w-[400px] h-[360px] sm:h-[420px] shadow-glow z-20"
                              : "w-[160px] sm:w-[200px] md:w-[240px] h-[240px] sm:h-[280px] shadow-soft z-10"
                          }`}
                        >
                          <img
                            src={
                              e.image ||
                              e.bannerUrl ||
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                            }
                            alt={e.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay specifically for the text footer (visible on all cards) */}
                          <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

                          {/* Text Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col justify-end">
                            <h3
                              className={`font-display font-bold text-white leading-snug drop-shadow-md transition-all duration-700 ${
                                isActive
                                  ? "text-lg sm:text-xl line-clamp-2"
                                  : "text-base sm:text-lg line-clamp-1"
                              }`}
                            >
                              {e.title}
                            </h3>
                            <p
                              className={`text-white/90 text-xs mt-2 drop-shadow-sm transition-all duration-700 ${
                                isActive ? "line-clamp-3 sm:text-sm" : "line-clamp-2"
                              }`}
                            >
                              {e.description}
                            </p>
                            <div className="mt-4">
                              <Button
                                asChild
                                size="sm"
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/10 rounded-full h-8 px-4 text-xs font-medium transition-colors"
                              >
                                <Link href={`/events/${e.id}`}>
                                  View Details <ChevronRight className="size-3 ml-1 opacity-70" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            </section>
          )}

          {/* ═══════════════ TIMELINE (Important Dates) ═══════════════ */}
          {cms.visibility?.timeline !== false && (
            <section className="py-16 lg:py-20">
              <div className="container mx-auto px-4">
                <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#8B4513]">
                    Important Dates 2026
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Mark your calendar — every milestone you need to know.
                  </p>
                </motion.div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {cms.timeline.map((t, i) => (
                    <motion.div
                      key={i}
                      {...fadeUp}
                      transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                    >
                      <div className="relative rounded-2xl overflow-hidden h-56 sm:h-64 group">
                        {/* Background Image */}
                        <img
                          src={
                            liveEvents[i]?.image ||
                            liveEvents[i]?.bannerUrl ||
                            liveEvents[0]?.image ||
                            liveEvents[0]?.bannerUrl ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                          }
                          alt={t.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-spring"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 timeline-card-overlay" />
                        {/* Content */}
                        <div className="relative z-10 flex flex-col justify-end h-full p-5">
                          <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-[#C84B31] text-white text-xs font-semibold mb-3">
                            {t.date}
                          </span>
                          <h3 className="font-display font-bold text-white text-base sm:text-lg leading-snug">
                            {t.title}
                          </h3>
                          <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">
                            {t.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════ HOW IT WORKS ═══════════════ */}
          {cms.visibility?.howItWorks !== false && (
            <section className="bg-gradient-saffron-warm text-white py-16 lg:py-20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-20 -right-20 size-96 rounded-full bg-white blur-3xl" />
              </div>
              <div className="container mx-auto px-4 relative">
                <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="font-display font-bold text-3xl sm:text-4xl">How It Works</h2>
                  <p className="opacity-80 mt-2">
                    Three simple steps to register for any UP initiative.
                  </p>
                </motion.div>
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {cms.howItWorks.map((s, i) => (
                    <motion.div
                      key={i}
                      {...fadeUp}
                      transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                      className="rounded-2xl p-6 bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-base"
                    >
                      <div className="font-display font-extrabold text-5xl text-white/30">
                        {s.n}
                      </div>
                      <h3 className="font-display font-bold text-xl mt-3">{s.t}</h3>
                      <p className="text-sm opacity-80 mt-2">{s.d}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════ FAQ ═══════════════ */}
          {cms.visibility?.faqs !== false && (
            <section className="container mx-auto px-4 py-16 lg:py-20">
              <motion.div {...fadeUp} className="text-center mb-10">
                <Badge
                  variant="outline"
                  className="mb-3 border-[#8B4513] text-[#8B4513] rounded-full px-4 py-1"
                >
                  Help
                </Badge>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#3D1B0E]">
                  Frequently Asked <span className="text-gradient-saffron">Questions</span>
                </h2>
              </motion.div>

              <motion.div
                {...fadeUp}
                className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto"
              >
                {/* Left: Illustration */}
                <div className="hidden md:flex justify-center">
                  <img
                    src="/faq-illustration.png"
                    alt="Frequently Asked Questions"
                    className="w-full max-w-sm"
                  />
                </div>

                {/* Right: Accordion */}
                <div className="space-y-3">
                  {cms.faqs.map((f, i) => (
                    <FaqAccordionItem key={i} question={f.q} answer={f.a} />
                  ))}
                </div>
              </motion.div>
            </section>
          )}

          {/* ═══════════════ CTA ═══════════════ */}
          <section className="bg-cta-maroon text-white py-16 lg:py-20">
            <motion.div {...fadeUp} className="container mx-auto px-4 text-center max-w-2xl">
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 opacity-80 max-w-xl mx-auto">
                Join 2.4 lakh+ users building the new Uttar Pradesh. Free to register, easy to
                apply, life-changing to participate.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-7 h-12 px-8 bg-[#C84B31] text-white hover:bg-[#B33F28] rounded-full font-semibold"
              >
                <Link href="/login">
                  Login/Get Started <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </motion.div>
          </section>
        </motion.div>
      </AnimatePresence>
    </PublicLayout>
  );
}

/* ─── FAQ Accordion Item (custom, no radix dependency) ─── */
function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl bg-card overflow-hidden transition-base hover:shadow-soft">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-medium text-sm sm:text-base text-[#3D1B0E] pr-4">{question}</span>
        <ChevronDown
          className={`size-5 text-[#C84B31] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
