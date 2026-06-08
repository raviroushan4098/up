"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Sparkles, Building2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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

  return (
    <PublicLayout>
      <section className="relative">
        <div className="aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
          <img src={e.image} alt={e.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 -mt-24 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link href="/events">
                <ArrowLeft className="size-4 mr-1" /> All events
              </Link>
            </Button>
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6 sm:p-10">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge className="bg-accent text-primary">{e.category}</Badge>
                  <Badge
                    className={
                      getDerivedEventStatus(e) === "Closed"
                        ? "bg-muted text-muted-foreground"
                        : getDerivedEventStatus(e) === "Open"
                          ? "bg-success text-success-foreground"
                          : "bg-info text-info-foreground"
                    }
                  >
                    {getDerivedEventStatus(e)}
                  </Badge>
                </div>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary">
                  {e.title}
                </h1>
                <p className="text-muted-foreground mt-1">{e.titleHi}</p>
                <p className="text-foreground/80 mt-5 text-lg leading-relaxed">{e.description}</p>

                <div className="grid sm:grid-cols-3 gap-4 mt-8">
                  <div className="rounded-xl bg-secondary p-4 flex items-center gap-3">
                    <Calendar className="size-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Deadline</div>
                      <div className="font-semibold text-primary">
                        {formatDateString(e.endDate || e.deadline, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {e.displayConfig?.showVenue !== false && e.venue && (
                    <div className="rounded-xl bg-secondary p-4 flex items-center gap-3">
                      <Building2 className="size-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Venue</div>
                        <div className="font-semibold text-primary">{e.venue}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {e.displayConfig?.showEligibility !== false &&
            e.eligibility &&
            e.eligibility.length > 0 && (
              <Card className="border-0 shadow-card">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="font-display font-bold text-xl text-primary mb-4">Eligibility</h2>
                  <ul className="space-y-3">
                    {e.eligibility.map((x, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{x}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {e.displayConfig?.showBenefits !== false && e.benefits && e.benefits.length > 0 && (
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 sm:p-8">
                <h2 className="font-display font-bold text-xl text-primary mb-4">
                  Benefits of Participation
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {e.benefits.map((b, i) => (
                    <div key={i} className="rounded-xl bg-gradient-soft p-4 flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-gradient-saffron grid place-items-center shrink-0">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/90">{b}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {e.displayConfig?.showSchedule !== false && e.schedule && e.schedule.length > 0 && (
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 sm:p-8">
                <h2 className="font-display font-bold text-xl text-primary mb-4">Event Schedule</h2>
                <div className="relative pl-6 border-l-2 border-dashed border-primary/20">
                  {e.schedule.map((s, i) => (
                    <div key={i} className="relative mb-5 last:mb-0">
                      <div className="absolute -left-[1.85rem] top-1 size-4 rounded-full bg-gradient-saffron" />
                      <div className="text-xs text-muted-foreground">{s.date}</div>
                      <div className="font-semibold text-primary">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <Card className="border-0 shadow-elegant bg-gradient-navy text-primary-foreground">
            <CardContent className="p-6">
              {getDerivedEventStatus(e) === "Closed" ? (
                <>
                  <div className="text-sm opacity-80">Registration Closed</div>
                  <div className="font-display font-extrabold text-2xl mt-1 text-muted-foreground">
                    Applications Closed
                  </div>
                  <p className="text-sm opacity-80 mt-2">
                    This event is no longer accepting applications.
                  </p>
                  <Button
                    disabled
                    className="w-full mt-5 bg-white/10 text-white/50 font-semibold cursor-not-allowed h-11"
                  >
                    Closed
                  </Button>
                </>
              ) : getDerivedEventStatus(e) === "Coming Soon" ? (
                <>
                  <div className="text-sm opacity-80">Applications starting soon</div>
                  <div className="font-display font-extrabold text-2xl mt-1">Coming Soon</div>
                  <p className="text-sm opacity-80 mt-2">
                    Applications will open on {formatDateString(e.startDate)}.
                  </p>
                  <Button
                    disabled
                    className="w-full mt-5 bg-white/10 text-white/50 font-semibold cursor-not-allowed h-11"
                  >
                    Opens {formatDateString(e.startDate)}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm opacity-80">Ready to apply?</div>
                  <div className="font-display font-extrabold text-2xl mt-1">
                    Start your application
                  </div>
                  <p className="text-sm opacity-80 mt-2">Free, secure and -verified.</p>
                  <Button
                    asChild
                    className="w-full mt-5 bg-accent text-primary font-semibold hover:bg-accent-glow h-11"
                  >
                    <Link href="/dashboard/apply">Apply Now</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full mt-2 bg-transparent border-white/30 text-primary-foreground hover:bg-white/10"
                  >
                    <Link href="/login">Login to Continue</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
