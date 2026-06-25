"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MapPin,
  Sparkles,
  Building2,
  Users,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UPEvent } from "@/types/events";
import { parseDateString, formatDateString, getDerivedEventStatus } from "@/lib/utils";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [e, setE] = useState<UPEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setE({ id: docSnap.id, ...docSnap.data() } as UPEvent);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!e) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display font-bold text-3xl">Event not found</h1>
          <Button asChild className="mt-6">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const status = getDerivedEventStatus(e);
  const descParagraphs = e.description ? e.description.split("\n").filter(Boolean) : [];
  const heroDesc = descParagraphs[0] || "";
  const mainDesc = e.description || "";

  return (
    <PublicLayout>
      {/* Redesigned Warm Hero Header Block */}
      <section className="bg-[#fbf6f0] border-b border-border/40 py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-6 hover:bg-black/5 -ml-2 text-primary font-semibold"
          >
            <Link href="/events">
              <ArrowLeft className="size-4 mr-1.5" /> All events
            </Link>
          </Button>

          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-[#632020] leading-tight">
                  {e.title}
                </h1>
                {e.titleHi && (
                  <p className="text-xl sm:text-2xl font-bold text-[#632020]/90 font-display">
                    {e.titleHi}
                  </p>
                )}
              </div>

              {heroDesc && (
                <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-2xl">
                  {heroDesc}
                </p>
              )}

              {/* Row of 4 Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 select-none">
                {/* Date */}
                <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-border/30">
                  <div className="p-2 rounded-lg bg-red-50">
                    <Calendar className="size-4 text-[#C84B31]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Date
                    </div>
                    <div className="text-xs font-bold text-[#632020] mt-0.5">
                      {formatDateString(e.startDate || e.deadline, {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-border/30">
                  <div className="p-2 rounded-lg bg-red-50">
                    <MapPin className="size-4 text-[#C84B31]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Venue
                    </div>
                    <div className="text-xs font-bold text-[#632020] mt-0.5 truncate">
                      {e.venue || "TBA"}
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-border/30">
                  <div className="p-2 rounded-lg bg-red-50">
                    <Users className="size-4 text-[#C84B31]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Participants
                    </div>
                    <div className="text-xs font-bold text-[#632020] mt-0.5">
                      {e.participantsCount || "3,500+"}
                    </div>
                  </div>
                </div>

                {/* Registration */}
                <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-border/30">
                  <div className="p-2 rounded-lg bg-red-50">
                    <Sparkles className="size-4 text-[#C84B31]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Registration
                    </div>
                    <div className="text-xs font-bold text-[#632020] mt-0.5">
                      {e.registrationFeeLabel || "Free"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {status === "Closed" ? (
                  <Button
                    disabled
                    size="lg"
                    className="bg-[#C84B31] text-white font-bold px-8 rounded-xl shadow-md h-12"
                  >
                    Registration Closed
                  </Button>
                ) : status === "Coming Soon" ? (
                  <Button
                    disabled
                    size="lg"
                    className="bg-[#C84B31] text-white font-bold px-8 rounded-xl shadow-md h-12"
                  >
                    Coming Soon
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="bg-[#C84B31] text-white hover:bg-[#bd4128] font-bold px-8 rounded-xl shadow-md h-12"
                    >
                      <Link href="/dashboard/apply">Apply Now</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-[#C84B31]/30 text-[#C84B31] hover:bg-[#C84B31]/5 font-bold px-8 rounded-xl h-12 bg-transparent"
                    >
                      <Link href="/login">Continue to Login</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Vertical Image Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg border border-border bg-card select-none">
                <img
                  src={e.image}
                  alt={e.title}
                  className="w-full h-auto object-cover aspect-[3/4]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split Layout Content Column */}
      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {/* Left Area (65% width: Description, Stats highlight, Eligibility, Benefits, Timeline) */}
          <div className="lg:col-span-2 space-y-10">
            {mainDesc && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-xl text-[#632020]">
                  About the Programme
                </h3>
                <p className="text-foreground/80 text-base leading-relaxed whitespace-pre-line">
                  {mainDesc}
                </p>
              </div>
            )}

            {/* Stats Highlight Bar */}
            {e.statsHighlights && e.statsHighlights.length > 0 && (
              <div className="bg-[#632020] text-white p-6 rounded-2xl flex flex-wrap justify-around items-center gap-6 text-center shadow-md select-none">
                {e.statsHighlights.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex-1 min-w-[100px] border-r last:border-0 border-white/20 px-2"
                  >
                    <div className="text-3xl md:text-4xl font-extrabold font-display text-white leading-none">
                      {stat.value}
                    </div>
                    <div className="text-[11px] sm:text-xs text-white/80 font-bold uppercase tracking-wider mt-2">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Eligibility section */}
            {e.displayConfig?.showEligibility !== false &&
              e.eligibility &&
              e.eligibility.length > 0 && (
                <Card className="border border-border/80 shadow-sm rounded-2xl">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="font-display font-bold text-xl text-[#632020] mb-4">
                      Eligibility
                    </h3>
                    <ul className="space-y-3">
                      {e.eligibility.map((x, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                          </div>
                          <span className="text-foreground/90 font-medium text-sm sm:text-base">
                            {x}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {/* Benefits box grid */}
            {e.displayConfig?.showBenefits !== false && e.benefits && e.benefits.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-xl text-[#632020]">Benefits</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {e.benefits.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-[#C84B31] text-white p-5 flex flex-col justify-between shadow-sm min-h-[140px] select-none hover:bg-[#bd4128] transition-colors"
                    >
                      <span className="text-sm font-medium leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Timeline */}
            {e.displayConfig?.showSchedule !== false && e.schedule && e.schedule.length > 0 && (
              <Card className="border border-border/80 shadow-sm rounded-2xl">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="font-display font-bold text-xl text-[#632020] mb-6">
                    Event Schedule
                  </h3>
                  <div className="relative pl-6 border-l-2 border-dashed border-primary/20 space-y-6">
                    {e.schedule.map((s, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[1.85rem] top-1 size-4 rounded-full bg-[#C84B31] border-2 border-white shadow-sm" />
                        <div className="text-xs text-muted-foreground font-semibold">{s.date}</div>
                        <div className="font-bold text-primary text-sm sm:text-base mt-0.5">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Area (35% width: Focus Cards, Sticky CTA Sidebar Widget) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            {/* Core Focus areas grid */}
            {e.focusAreas && e.focusAreas.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {e.focusAreas.map((focus, i) => (
                  <Card
                    key={i}
                    className="border border-border/80 shadow-none rounded-2xl bg-white hover:border-[#C84B31]/30 transition-colors"
                  >
                    <CardContent className="p-5">
                      <h4 className="font-bold text-base text-[#632020] mb-2">{focus.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {focus.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Sticky Application CTA Card */}
            <Card className="border-0 shadow-elegant bg-[#102A43] text-white rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="text-xs text-white/80 font-bold uppercase tracking-wider">
                  Ready to Apply?
                </div>
                <h3 className="font-display font-extrabold text-2xl text-white">
                  Start your application
                </h3>
                <ul className="space-y-2.5 my-4">
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> Free Registration
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> Secure & Verified
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm text-white/90">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> Limited Seats
                  </li>
                </ul>

                {status === "Closed" ? (
                  <div className="space-y-2">
                    <Button
                      disabled
                      className="w-full bg-white/10 text-white/50 font-bold h-11 rounded-xl cursor-not-allowed"
                    >
                      Closed
                    </Button>
                    <p className="text-xs text-center text-white/60">
                      This event is no longer accepting applications.
                    </p>
                  </div>
                ) : status === "Coming Soon" ? (
                  <div className="space-y-2">
                    <Button
                      disabled
                      className="w-full bg-white/10 text-white/50 font-bold h-11 rounded-xl cursor-not-allowed"
                    >
                      Coming Soon
                    </Button>
                    <p className="text-xs text-center text-white/60">
                      Applications will open on {formatDateString(e.startDate)}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <Button
                      asChild
                      className="w-full bg-[#C84B31] text-white font-bold hover:bg-[#bd4128] h-11 rounded-xl shadow-md border-0"
                    >
                      <Link href="/dashboard/apply">Apply Now</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 h-11 rounded-xl"
                    >
                      <Link href="/login">Login to Continue</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Full-bleed Guests Carousel section at the bottom */}
      {e.displayConfig?.showDynamicSections !== false &&
        e.dynamicSections &&
        e.dynamicSections.map((section) => (
          <section key={section.id} className="border-t border-border/40 py-16 bg-[#fbf6f0]">
            <div className="container mx-auto px-4 max-w-6xl">
              <h3 className="font-display font-extrabold text-3xl text-[#632020] text-center mb-1">
                {section.title}
              </h3>
              <p className="text-center text-[#C84B31] font-bold text-xs uppercase tracking-widest mb-8">
                CHIEF GUESTS
              </p>

              {section.members.length > 0 ? (
                <Carousel
                  opts={{ align: "start", loop: true }}
                  plugins={[
                    AutoScroll({
                      speed: 0.8,
                      playOnInit: true,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                  className="w-full max-w-5xl mx-auto relative px-4"
                >
                  <CarouselContent className="-ml-4 select-none">
                    {section.members.map((member) => (
                      <CarouselItem
                        key={member.id}
                        className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                      >
                        <Card className="border border-border/30 overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                          <div className="aspect-[4/5] bg-secondary relative overflow-hidden shrink-0">
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-accent/5">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="p-4 text-center bg-white flex-1 flex flex-col justify-center border-t min-h-[90px]">
                            <h4 className="font-bold text-[#632020] text-sm sm:text-base leading-tight">
                              {member.name}
                            </h4>
                            {member.role && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium leading-tight line-clamp-2">
                                {member.role}
                              </p>
                            )}
                          </div>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4 lg:-left-12 hover:bg-[#C84B31]/10 text-[#C84B31] border-[#C84B31]/20 bg-white" />
                  <CarouselNext className="-right-4 lg:-right-12 hover:bg-[#C84B31]/10 text-[#C84B31] border-[#C84B31]/20 bg-white" />
                </Carousel>
              ) : (
                <p className="text-center text-muted-foreground text-sm italic">
                  No guests or speakers added.
                </p>
              )}
            </div>
          </section>
        ))}

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3.5 z-50 flex items-center justify-between gap-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{e.title}</p>
          <p className="font-bold text-[#632020] text-sm">
            {status === "Closed"
              ? "Registration Closed"
              : status === "Coming Soon"
                ? "Opening Soon"
                : "Applications Open"}
          </p>
        </div>
        <div>
          {status === "Closed" ? (
            <Button
              disabled
              size="sm"
              className="bg-muted text-muted-foreground cursor-not-allowed font-semibold h-10 px-4"
            >
              Closed
            </Button>
          ) : status === "Coming Soon" ? (
            <Button
              disabled
              size="sm"
              className="bg-muted text-muted-foreground cursor-not-allowed font-semibold h-10 px-4"
            >
              Coming Soon
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="bg-[#C84B31] text-white font-bold shadow-soft h-10 px-5 hover:bg-[#bd4128]"
            >
              <Link href="/dashboard/apply">Apply Now</Link>
            </Button>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
