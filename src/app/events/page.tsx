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
      <section className="bg-gradient-soft py-14">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="outline" className="mb-3">
            All Events
          </Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primary">
            Find your <span className="text-gradient-saffron">opportunity</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Explore live programmes from the Uttar Pradesh.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">{filtered.length} events found</p>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44 h-9">
              <SlidersHorizontal className="size-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline (soonest)</SelectItem>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="overflow-hidden h-full border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring group">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={e.image}
                      alt={e.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-spring"
                    />
                    <Badge
                      className={`absolute top-3 right-3 ${
                        getDerivedEventStatus(e) === "Closed"
                          ? "bg-muted text-muted-foreground"
                          : getDerivedEventStatus(e) === "Open"
                            ? "bg-success text-success-foreground"
                            : "bg-info text-info-foreground"
                      }`}
                    >
                      {getDerivedEventStatus(e)}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {e.category}
                    </Badge>
                    <h3 className="font-display font-bold text-lg leading-snug text-primary">
                      {e.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {e.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />{" "}
                        {formatDateString(e.endDate || e.deadline, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {getDerivedEventStatus(e) === "Closed" ||
                    getDerivedEventStatus(e) === "Coming Soon" ? (
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full mt-5 font-semibold text-primary"
                      >
                        <Link href={`/events/${e.id}`}>
                          View Details <ArrowRight className="size-4 ml-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full mt-5 bg-gradient-saffron text-primary font-semibold hover:opacity-95"
                      >
                        <Link href={`/events/${e.id}`}>
                          Apply Now <ArrowRight className="size-4 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
