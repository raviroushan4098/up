"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Eye, Users, Award, Landmark, Flag, HeartHandshake, Rocket } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AboutPageCMS } from "@/types/cms";
import { emptyAboutCMS } from "@/types/cms";

const iconMap: Record<string, any> = {
  Target,
  Eye,
  Users,
  Award,
  Landmark,
  Flag,
  HeartHandshake,
  Rocket,
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55 },
};

export default function AboutPage() {
  const [stats, setStats] = useState<{ v: string; l: string }[] | null>(null);
  const [cms, setCms] = useState<AboutPageCMS | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsSnap, demographicsSnap, cmsSnap] = await Promise.all([
          getDoc(doc(db, "counters", "global")),
          getDoc(doc(db, "counters", "demographics")),
          getDoc(doc(db, "settings", "aboutPage")),
        ]);

        const formatNumber = (num: number) => {
          if (!num) return "0";
          if (num >= 100000) return (num / 100000).toFixed(1) + "L+";
          if (num >= 1000) return (num / 1000).toFixed(1) + "K+";
          return num.toString();
        };

        let totalDistricts = "75";
        if (demographicsSnap.exists()) {
          const demoData = demographicsSnap.data();
          if (demoData.districts) {
            const districtCount = Object.keys(demoData.districts).length;
            if (districtCount > 0) {
              totalDistricts = districtCount.toString();
            }
          }
        }

        if (statsSnap.exists()) {
          const data = statsSnap.data();
          setStats([
            { v: totalDistricts, l: "Districts Covered" },
            { v: formatNumber(data.totalUsers || 0), l: "Active Citizens" },
            { v: formatNumber(data.approvedApplications || 0), l: "Approved Applications" },
          ]);
        } else {
          setStats([
            { v: "75", l: "Districts Covered" },
            { v: "2.4L+", l: "Active Citizens" },
            { v: "1.1L+", l: "Approved Applications" },
          ]);
        }

        if (cmsSnap.exists()) {
          setCms({ ...emptyAboutCMS, ...cmsSnap.data() } as AboutPageCMS);
        } else {
          setCms(emptyAboutCMS);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats([
          { v: "75", l: "Districts Covered" },
          { v: "2.4L+", l: "Active Citizens" },
          { v: "1.1L+", l: "Approved Applications" },
        ]);
        setCms(emptyAboutCMS);
      }
    };
    fetchData();
  }, []);

  const data = cms || emptyAboutCMS;

  return (
    <PublicLayout>
      <section className="bg-gradient-soft py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="outline" className="mb-4">
            {data.hero.badgeText}
          </Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primary">
            {data.hero.titleLine1}{" "}
            <span className="text-gradient-saffron">{data.hero.titleGradient}</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">{data.hero.subtitle}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-6">
        {[
          {
            icon: Target,
            t: data.mission.title,
            d: data.mission.description,
          },
          {
            icon: Eye,
            t: data.vision.title,
            d: data.vision.description,
          },
        ].map((b, i) => (
          <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
            <Card className="h-full border-0 shadow-card">
              <CardContent className="p-8">
                <div className="size-12 rounded-2xl bg-gradient-saffron grid place-items-center shadow-soft mb-4">
                  <b.icon className="size-6 text-primary" />
                </div>
                <h2 className="font-display font-bold text-2xl text-primary">{b.t}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{b.d}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="bg-gradient-soft py-16">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="mb-3">
              Objectives
            </Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
              What we aim to achieve
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.objectives.map((o, i) => {
              const IconComponent = iconMap[o.icon] || Target;
              return (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-card h-full hover:-translate-y-1 transition-spring">
                    <CardContent className="p-6">
                      <IconComponent className="size-8 text-accent mb-3" />
                      <h3 className="font-display font-bold text-primary">{o.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{o.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="outline" className="mb-3">
            Timeline
          </Badge>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">Our journey</h2>
        </motion.div>
        <div className="max-w-3xl mx-auto relative pl-8 border-l-2 border-dashed border-primary/20">
          {data.timeline.map((t, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="relative mb-10 last:mb-0"
            >
              <div className="absolute -left-[2.45rem] top-1 size-6 rounded-full bg-gradient-saffron grid place-items-center shadow-glow">
                <span className="size-2 rounded-full bg-primary" />
              </div>
              <div className="text-xs font-semibold text-accent-foreground bg-accent/15 inline-block px-3 py-1 rounded-full mb-2">
                {t.date}
              </div>
              <h3 className="font-display font-bold text-xl text-primary">{t.title}</h3>
              <p className="text-muted-foreground mt-1">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <motion.div
          {...fadeUp}
          className="rounded-3xl bg-gradient-navy text-primary-foreground p-10 md:p-14 grid md:grid-cols-3 gap-6 text-center shadow-elegant"
        >
          {stats ? (
            stats.map((s, i) => (
              <div key={i}>
                <div className="font-display font-extrabold text-4xl md:text-5xl text-accent-glow">
                  {s.v}
                </div>
                <div className="text-sm opacity-80 mt-1">{s.l}</div>
              </div>
            ))
          ) : (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center">
                  <Skeleton className="h-12 w-24 bg-white/20 rounded-md mb-2" />
                  <Skeleton className="h-4 w-32 bg-white/10 rounded-sm" />
                </div>
              ))}
            </>
          )}
        </motion.div>
      </section>
    </PublicLayout>
  );
}
