"use client";

import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { events } from "@/data/mock";

export default function OpenEvents() {
  const list = events.filter((e) => e.status !== "Closed");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">Open Events</h1>
        <p className="text-muted-foreground">{list.length} events ready for your application.</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map((e) => (
          <Card
            key={e.id}
            className="overflow-hidden border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring"
          >
            <div className="relative aspect-[16/10]">
              <img src={e.image} alt="" className="w-full h-full object-cover" />
              <Badge
                className={`absolute top-3 right-3 ${e.status === "Open" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}
              >
                {e.status}
              </Badge>
            </div>
            <CardContent className="p-5">
              <Badge variant="outline" className="mb-2 text-xs">
                {e.category}
              </Badge>
              <h3 className="font-display font-bold text-primary leading-snug">{e.title}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />{" "}
                  {new Date(e.deadline).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {e.districts[0]}
                </span>
              </div>
              <Button
                asChild
                className="w-full mt-4 bg-gradient-saffron text-primary font-semibold"
              >
                <Link href="/dashboard/apply">
                  Apply <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
