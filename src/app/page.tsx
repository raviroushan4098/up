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
  ChevronLeft,
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
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";

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
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<LandingPageCMS | null>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [totalApplications, setTotalApplications] = useState<number | null>(null);

  // Hero carousel
  const [activeIndex, setActiveIndex] = useState(0);

  // Featured Events carousel
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // How It Works active step
  const [activeStep, setActiveStep] = useState(0);

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
    // 1. Try to load cached data from sessionStorage to render instantly
    try {
      const cachedCms = sessionStorage.getItem("landing_cms_data");
      const cachedEvents = sessionStorage.getItem("landing_events_data");
      const cachedStats = sessionStorage.getItem("landing_global_stats");

      if (cachedCms) {
        setCms(JSON.parse(cachedCms));
        setLoading(false); // Render layout instantly!
      }
      if (cachedEvents) {
        setLiveEvents(JSON.parse(cachedEvents));
      }
      if (cachedStats) {
        const stats = JSON.parse(cachedStats);
        setGlobalStats(stats);
        setTotalApplications(stats.totalApplications || 0);
      }
    } catch (e) {
      console.error("Failed to load landing page cache:", e);
    }

    const fetchLandingData = async () => {
      try {
        // 1. Fetch CMS Text Overrides
        const docRef = doc(db, "settings", "landingPage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cmsData = docSnap.data() as LandingPageCMS;
          setCms(cmsData);
          try {
            sessionStorage.setItem("landing_cms_data", JSON.stringify(cmsData));
          } catch (e) {
            console.error("Failed to write landing cms cache:", e);
          }
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
          try {
            sessionStorage.setItem("landing_events_data", JSON.stringify(fetchedEvents));
          } catch (e) {
            console.error("Failed to write landing events cache:", e);
          }
        }

        // 3. Fetch Total Applications & Global Stats
        const globalStatsRef = doc(db, "counters", "global");
        const globalStatsSnap = await getDoc(globalStatsRef);
        if (globalStatsSnap.exists()) {
          const statsData = globalStatsSnap.data();
          setGlobalStats(statsData);
          setTotalApplications(statsData.totalApplications || 0);
          try {
            sessionStorage.setItem("landing_global_stats", JSON.stringify(statsData));
          } catch (e) {
            console.error("Failed to write landing stats cache:", e);
          }
        }
      } catch (error) {
        console.error("Failed to fetch landing page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const mainEvent = liveEvents[0];

  const profileSections =
    cms?.profileSections && cms.profileSections.length > 0
      ? cms.profileSections
      : [
          {
            id: "speakers-legacy",
            title: "Speakers",
            visible: cms?.visibility?.speakers ?? true,
            members: cms?.speakers || [],
          },
        ];

  return (
    <PublicLayout>
      {loading && <TopLoadingBar />}
      <AnimatePresence mode="wait">
        {loading || !cms ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
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
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ═══════════════ HERO 1: MEDIA ═══════════════ */}
            {cms.visibility?.hero !== false && (
              <section className="w-full aspect-[16/9] md:aspect-[21/9] min-h-[40vh] md:min-h-[55vh] max-h-[70vh] relative overflow-hidden bg-black">
                {/* ── Media Background ── */}
                <div className="absolute inset-0">
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

                {/* ── Slide indicators ── */}
                {!cms.hero.videoUrl && heroImages.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {heroImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === activeIndex ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ═══════════════ HERO 2: CONTENT ═══════════════ */}
            {cms.visibility?.hero !== false && (
              <section className="bg-[#C84B31] text-white py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden">
                <div className="container mx-auto max-w-4xl text-center relative z-10 flex flex-col items-center">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                  >
                    <span className="inline-block border border-white/45 text-white/95 rounded-full px-6 py-2 text-xs sm:text-sm font-semibold tracking-wide bg-transparent backdrop-blur-sm shadow-sm">
                      {cms.hero.badgeText ||
                        "Empowering Youth • Inspiring Leadership • Building The Nation"}
                    </span>
                  </motion.div>

                  {/* Main Title (Hindi) */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-tight mb-4 tracking-tight drop-shadow-sm"
                  >
                    भविष्य-ए-उत्तर प्रदेश
                  </motion.h1>

                  {/* Subtitle (Hindi) */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="font-display font-bold text-xl sm:text-2xl lg:text-3xl text-white/95 mb-6"
                  >
                    {cms.hero.titleLine1 || "विकसित भारत की सीढ़ी, आज की युवा पीढ़ी"}
                  </motion.h2>

                  {/* Description (English) */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-sm sm:text-base md:text-lg text-white/90 max-w-3xl leading-relaxed mb-10 font-normal"
                  >
                    {cms.hero.subtitle}
                  </motion.p>

                  {/* Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-[#C84B31] hover:bg-neutral-50 hover:scale-105 transition-spring duration-300 rounded-full h-12 px-8 font-bold shadow-md"
                    >
                      <Link href="/login">Login/Get Started</Link>
                    </Button>
                  </motion.div>
                </div>
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
                    <motion.div {...fadeUp} className="flex flex-wrap justify-center gap-5">
                      {section.members.map((member, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                          className="w-[calc(50%-10px)] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0"
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

            {/* ═══════════════ SPOTLIGHT FEATURED EVENT ═══════════════ */}
            {liveEvents.length > 0 && (
              <section className="container mx-auto px-8 py-8 md:py-8">
                <div className="grid md:grid-cols-12 bg-[#C84B31] rounded-[32px] border border-border/40 shadow-soft overflow-hidden items-stretch">
                  {/* Left Column: Details */}
                  <div className="md:col-span-8 bg-white rounded-[24px] md:rounded-r-[200px] lg:rounded-r-[240px] md:mt-6 md:mb-* md:ml-* p-8 md:p-12 pr-8 md:pr-16 lg:pr-24 flex flex-col justify-center relative z-0">
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E] mb-5 leading-tight">
                      {mainEvent.title}
                    </h2>
                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed mb-8 max-w-xl">
                      {(() => {
                        const text = mainEvent.description || "";
                        const target = "viksit uttar pradesh:";
                        const index = text.toLowerCase().indexOf(target);
                        if (index !== -1) {
                          const cutIndex = index + target.length;
                          return (
                            <>
                              {text.substring(0, cutIndex)}...{" "}
                              <Link
                                href={`/events/${mainEvent.id}`}
                                className="text-[#C84B31] font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                read more
                              </Link>
                            </>
                          );
                        }
                        if (text.length > 330) {
                          return (
                            <>
                              {text.substring(0, 330)}...{" "}
                              <Link
                                href={`/events/${mainEvent.id}`}
                                className="text-[#C84B31] font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                read more
                              </Link>
                            </>
                          );
                        }
                        return text;
                      })()}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        asChild
                        className="bg-[#C84B31] text-white hover:bg-[#B33F28] rounded-full h-11 px-6 font-semibold"
                      >
                        <Link href={`/events/${mainEvent.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Poster Container */}
                  <div className="md:col-span-4 relative flex items-center justify-center p-8 overflow-visible min-h-[320px] md:min-h-[400px]">
                    <div className="relative z-10 w-full max-w-[420px] aspect-[453/388] rounded-[24px] overflow-hidden shadow-elegant border border-white/20 md:-ml-[200px] lg:-ml-[240px]">
                      <img
                        src={
                          mainEvent.image ||
                          mainEvent.bannerUrl ||
                          "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                        }
                        alt={mainEvent.title}
                        className="w-full h-full object-fill transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════════ EVENTS CAROUSEL ═══════════════ */}
            {liveEvents.length > 0 && (
              <section className="container mx-auto px-4 pt-8 pb-12 overflow-hidden">
                <motion.div {...fadeUp} className="text-center mb-8 relative">
                  <span className="text-xs font-bold text-[#C84B31] tracking-wider uppercase">
                    FEATURED
                  </span>
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E] mt-1">
                    Live Events & Opportunities
                  </h2>
                  <div className="absolute right-0 bottom-0 hidden sm:block">
                    <Button
                      asChild
                      variant="ghost"
                      className="text-xs hover:bg-transparent p-0 text-foreground/70 hover:text-[#C84B31]"
                    >
                      <Link href="/events" className="flex items-center gap-1">
                        View all events <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>

                <motion.div {...fadeUp} className="relative">
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
                            className={`flex-shrink-0 mx-2 sm:mx-3 rounded-2xl overflow-hidden cursor-pointer relative ${
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

                            {/* Renders overlay and text details ONLY on the active centered card */}
                            {isActive && (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end text-left h-[70%] z-10">
                                  <h3 className="font-display font-bold text-white text-lg sm:text-xl md:text-2xl leading-snug drop-shadow-md line-clamp-2">
                                    {e.title}
                                  </h3>
                                  <p className="text-white/90 text-xs sm:text-sm mt-2.5 drop-shadow-sm line-clamp-3 leading-relaxed">
                                    {e.description}
                                  </p>
                                  <div className="mt-5">
                                    <Button
                                      asChild
                                      size="sm"
                                      className="bg-white text-[#C84B31] hover:bg-neutral-50 rounded-full h-9 px-6 text-xs font-bold transition-all shadow-md"
                                    >
                                      <Link href={`/events/${e.id}`}>View More</Link>
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Manual Navigation Arrows */}
                  {liveEvents.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveEventIndex((prev) =>
                            prev === 0 ? liveEvents.length - 1 : prev - 1,
                          )
                        }
                        className="absolute left-2 sm:left-4 top-[250px] -translate-y-1/2 z-30 size-10 sm:size-12 rounded-full bg-white/80 hover:bg-white text-[#C84B31] border border-border/40 shadow-elegant flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        aria-label="Previous event"
                      >
                        <ChevronLeft className="size-6 sm:size-7" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveEventIndex((prev) => (prev + 1) % liveEvents.length)
                        }
                        className="absolute right-2 sm:right-4 top-[250px] -translate-y-1/2 z-30 size-10 sm:size-12 rounded-full bg-white/80 hover:bg-white text-[#C84B31] border border-border/40 shadow-elegant flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        aria-label="Next event"
                      >
                        <ChevronRight className="size-6 sm:size-7" />
                      </button>
                    </>
                  )}

                  {/* Mobile view all link */}
                  <div className="text-center mt-4 sm:hidden">
                    <Button
                      asChild
                      variant="ghost"
                      className="text-xs hover:bg-transparent text-foreground/70 hover:text-[#C84B31]"
                    >
                      <Link href="/events" className="flex items-center justify-center gap-1">
                        View all events <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
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
                              t.image ||
                              liveEvents[0]?.image ||
                              liveEvents[0]?.bannerUrl ||
                              "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                            }
                            alt={t.title}
                            className="absolute inset-0 w-full h-full object-fill group-hover:scale-105 transition-spring"
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
                    <div className="w-16 h-0.5 bg-white/60 mx-auto mt-4" />
                  </motion.div>
                  <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto items-stretch">
                    {cms.howItWorks.map((s, i) => {
                      const isActive = activeStep === i;
                      return (
                        <motion.div
                          key={i}
                          layout
                          initial={{ opacity: 0, y: 24 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-80px" }}
                          transition={{
                            opacity: { duration: 0.5, delay: i * 0.08 },
                            y: { duration: 0.5, delay: i * 0.08 },
                            layout: { duration: 0.4, ease: "easeInOut" },
                          }}
                          onClick={() => setActiveStep(i)}
                          onMouseEnter={() => setActiveStep(i)}
                          className={`rounded-[32px] p-8 backdrop-blur-sm border flex flex-col items-center justify-center text-center transition-colors duration-300 cursor-pointer ${
                            isActive
                              ? "md:flex-[2.5] bg-white/20 border-white/30 shadow-elegant opacity-100"
                              : "md:flex-[1] bg-white/5 border-white/10 opacity-60 hover:opacity-90 hover:bg-white/10"
                          }`}
                        >
                          <div
                            className={`font-display font-extrabold text-5xl md:text-6xl transition-all duration-300 ${
                              isActive ? "text-white scale-110" : "text-white/40"
                            }`}
                          >
                            {s.n}
                          </div>
                          <AnimatePresence initial={false}>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden w-full flex flex-col items-center"
                              >
                                <h3 className="font-display font-bold text-xl mt-4 text-white">
                                  {s.t}
                                </h3>
                                <p className="text-sm text-white/80 mt-2 leading-relaxed max-w-md">
                                  {s.d}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
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
        )}
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
