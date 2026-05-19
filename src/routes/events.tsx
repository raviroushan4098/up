import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, ArrowRight, Calendar, MapPin, SlidersHorizontal } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { events, districts, categories } from "@/data/mock";

export const Route = createFileRoute("/events")({
  component: EventsPage,
  head: () => ({
    meta: [
      { title: "Events — Bhavishya Uttar Pradesh" },
      { name: "description", content: "Browse all live Government of Uttar Pradesh events and opportunities. Filter by district and category." },
    ],
  }),
});

function EventsPage() {
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState("deadline");

  const filtered = useMemo(() => {
    let list = events.filter((e) => {
      const matchQ = !q || e.title.toLowerCase().includes(q.toLowerCase()) || e.description.toLowerCase().includes(q.toLowerCase());
      const matchD = district === "All Districts" || e.districts.includes(district) || e.districts.includes("All Districts");
      const matchC = cat === "all" || e.category === cat;
      return matchQ && matchD && matchC;
    });
    if (sort === "deadline") list = [...list].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
    if (sort === "name") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [q, district, cat, sort]);

  return (
    <PublicLayout>
      <section className="bg-gradient-soft py-14">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="outline" className="mb-3">All Events</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primary">Find your <span className="text-gradient-saffron">opportunity</span></h1>
          <p className="mt-4 text-muted-foreground">Explore live programmes from the Government of Uttar Pradesh.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <Card className="border-0 shadow-card mb-8">
          <CardContent className="p-4 sm:p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events..." className="pl-9 h-11" />
            </div>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="h-11"><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">{filtered.length} events found</p>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44 h-9"><SlidersHorizontal className="size-3.5 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline (soonest)</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed border-2"><CardContent className="p-12 text-center text-muted-foreground">No events match your filters. Try resetting them.</CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Card className="overflow-hidden h-full border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring group">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-spring" />
                    <Badge className={`absolute top-3 right-3 ${
                      e.status === "Open" ? "bg-success text-success-foreground" :
                      e.status === "Closing Soon" ? "bg-warning text-warning-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>{e.status}</Badge>
                  </div>
                  <CardContent className="p-5">
                    <Badge variant="outline" className="mb-2 text-xs">{e.category}</Badge>
                    <h3 className="font-display font-bold text-lg leading-snug text-primary">{e.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-4">
                      <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {new Date(e.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {e.districts[0]}{e.districts.length > 1 ? ` +${e.districts.length - 1}` : ""}</span>
                    </div>
                    <Button asChild className="w-full mt-5 bg-gradient-saffron text-primary font-semibold hover:opacity-95">
                      <Link to="/events/$eventId" params={{ eventId: e.id }}>Apply Now <ArrowRight className="size-4 ml-1" /></Link>
                    </Button>
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
