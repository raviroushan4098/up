"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UPEvent } from "@/types/events";
import { toast } from "sonner";
import { formatDateString, getDerivedEventStatus, parseDateString } from "@/lib/utils";

export default function UserEvents() {
  const { user } = useAuth();
  const [list, setList] = useState<UPEvent[]>([]);
  const [appliedEventIds, setAppliedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchEvents = async () => {
    try {
      // For now, fetch all and filter client side to avoid needing composite indexes instantly
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const events: UPEvent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UPEvent[];

      const visibleEvents = events.filter((e) => e.status !== "Draft");
      visibleEvents.sort((a, b) => {
        const aStatus = getDerivedEventStatus(a);
        const bStatus = getDerivedEventStatus(b);

        const statusOrder = { "Coming Soon": 1, Open: 2, Closed: 3 };
        if (statusOrder[aStatus] !== statusOrder[bStatus]) {
          return statusOrder[aStatus] - statusOrder[bStatus];
        }

        const da = parseDateString(a.endDate || a.deadline)?.getTime() || Infinity;
        const db = parseDateString(b.endDate || b.deadline)?.getTime() || Infinity;
        return da - db;
      });
      setList(visibleEvents);

      if (user) {
        const appQ = query(collection(db, "applications"), where("userId", "==", user.uid));
        const appSnap = await getDocs(appQ);
        const appliedIds = new Set<string>(appSnap.docs.map((d) => d.data().eventId));
        setAppliedEventIds(appliedIds);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">All Events</h1>
        <p className="text-muted-foreground">{list.length} events available on the platform.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No events currently available. Please check back later.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {list.map((e) => (
            <Card
              key={e.id}
              className="overflow-hidden border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-secondary flex items-center justify-center">
                {e.image ? (
                  <img src={e.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-muted-foreground/50 font-bold text-2xl tracking-widest uppercase">
                    UP CONNECT
                  </div>
                )}
                <Badge
                  className={`absolute top-3 right-3 ${
                    getDerivedEventStatus(e) === "Closed"
                      ? "bg-muted text-muted-foreground"
                      : getDerivedEventStatus(e) === "Open"
                        ? "bg-success text-success-foreground shadow-sm"
                        : "bg-info text-info-foreground shadow-sm"
                  }`}
                >
                  {getDerivedEventStatus(e)}
                </Badge>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="font-display font-bold text-primary leading-snug line-clamp-2">
                  {e.title}
                </h3>

                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 mb-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-primary" />{" "}
                    {formatDateString(e.endDate || e.deadline, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span className="truncate max-w-[150px]">
                      {e.venue.split(",")[0] || "Venue TBA"}
                    </span>
                  </span>
                </div>

                <div className="mt-auto">
                  {appliedEventIds.has(e.id) ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full text-success border-success/50 bg-success/10 font-semibold hover:bg-success/20"
                    >
                      <Link href={`/dashboard/applications`}>Already Registered</Link>
                    </Button>
                  ) : getDerivedEventStatus(e) === "Closed" ? (
                    <Button
                      disabled
                      className="w-full bg-muted text-muted-foreground font-semibold cursor-not-allowed border-0"
                    >
                      Applications Closed
                    </Button>
                  ) : getDerivedEventStatus(e) === "Coming Soon" ? (
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full font-semibold text-primary"
                    >
                      <Link href={`/dashboard/events/${e.id}`}>View Details</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-gradient-saffron text-primary font-semibold hover:opacity-95 shadow-glow"
                    >
                      <Link href={`/dashboard/events/${e.id}`}>
                        View Details & Apply <ArrowRight className="size-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
