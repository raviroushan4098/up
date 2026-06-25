"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { Search, ArrowRight, Calendar, MapPin, SlidersHorizontal } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDateString, formatDateString, getDerivedEventStatus } from "@/lib/utils";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UPEvent } from "@/types/events";
import { Loader2 } from "lucide-react";

export default function EventsPage() {
  const [sort, setSort] = useState("deadline");
  const [eventsList, setEventsList] = useState<UPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedEvents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UPEvent[];
        setEventsList(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = useMemo(() => {
    const list = [...eventsList];

    list.sort((a, b) => {
      const aStatus = getDerivedEventStatus(a);
      const bStatus = getDerivedEventStatus(b);

      const statusOrder = { "Coming Soon": 1, Open: 2, Closed: 3 };
      if (statusOrder[aStatus] !== statusOrder[bStatus]) {
        return statusOrder[aStatus] - statusOrder[bStatus];
      }

      if (sort === "deadline") {
        const da = parseDateString(a.endDate || a.deadline)?.getTime() || Infinity;
        const db = parseDateString(b.endDate || b.deadline)?.getTime() || Infinity;
        return da - db;
      }
      if (sort === "name") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [sort, eventsList]);

  return (
    <PublicLayout>
      <section className="bg-gradient-to-r from-[#822216] via-[#c2452b] to-[#f37c35] py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <Badge
            variant="outline"
            className="mb-4 text-white border-white/60 px-4 py-1 text-xs rounded-full bg-transparent hover:bg-white/5 select-none"
          >
            All Events
          </Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white">
            Find your opportunity
          </h1>
          <p className="mt-4 text-white/90 text-sm sm:text-base max-w-lg mx-auto">
            Explore live programmes from the Uttar Pradesh.
          </p>
          <div className="w-16 h-[2px] bg-white mx-auto mt-6" />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-6">
          <p className="text-base font-bold text-[#632020]">{filtered.length} events found</p>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="border-0 bg-transparent shadow-none p-0 focus:ring-0 text-base font-bold text-[#632020] h-auto hover:opacity-80 w-auto flex items-center gap-1 [&>svg]:hidden select-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="deadline">Deadlines (soonest)</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex size-16 rounded-full bg-secondary items-center justify-center mb-4">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-primary">No events found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((e, i) => {
              const dateObj = parseDateString(e.endDate || e.deadline);
              const dayStr = dateObj
                ? formatDateString(e.endDate || e.deadline, { day: "2-digit" })
                : "";
              const monthStr = dateObj
                ? formatDateString(e.endDate || e.deadline, { month: "short" })
                : "";
              const status = getDerivedEventStatus(e);

              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="py-10 border-b border-border/80 last:border-0"
                >
                  <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                    {/* Date Column */}
                    <div className="w-full md:w-24 shrink-0 flex md:flex-col items-baseline md:items-start gap-1.5 md:gap-0 select-none">
                      <span className="font-display font-extrabold text-3xl md:text-4xl text-[#632020] leading-none">
                        {dayStr || "TBA"}
                      </span>
                      <span className="font-display font-bold text-lg md:text-xl text-[#632020]/80 md:mt-1 uppercase tracking-wider">
                        {monthStr}
                      </span>
                    </div>

                    {/* Image Column */}
                    <div className="w-full md:w-80 shrink-0 aspect-[16/10] md:aspect-[1.5] rounded-2xl overflow-hidden shadow-sm relative group bg-secondary">
                      <img
                        src={e.image}
                        alt={e.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      {status && (
                        <Badge
                          className={`absolute top-3 right-3 select-none ${
                            status === "Closed"
                              ? "bg-muted text-muted-foreground"
                              : status === "Open"
                                ? "bg-success text-success-foreground"
                                : "bg-info text-info-foreground"
                          }`}
                        >
                          {status}
                        </Badge>
                      )}
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <h2 className="font-display font-bold text-2xl text-[#632020] hover:text-[#C84B31] transition-colors leading-snug">
                          <Link href={`/events/${e.id}`}>{e.title}</Link>
                        </h2>
                        {e.category && (
                          <Badge
                            variant="outline"
                            className="mt-2 text-xs border-accent/30 text-accent/80"
                          >
                            {e.category}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed line-clamp-3">
                        {e.description}
                      </p>

                      <div className="pt-4 border-t border-border/80">
                        <Link
                          href={`/events/${e.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-[#632020] hover:text-[#C84B31] transition-colors group text-sm sm:text-base"
                        >
                          View Event Details{" "}
                          <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
