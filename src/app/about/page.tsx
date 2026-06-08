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
  const [cms, setCms] = useState<AboutPageCMS | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cmsSnap = await getDoc(doc(db, "settings", "aboutPage"));
        if (cmsSnap.exists()) {
          setCms({ ...emptyAboutCMS, ...cmsSnap.data() } as AboutPageCMS);
        } else {
          setCms(emptyAboutCMS);
        }
      } catch (error) {
        console.error("Failed to fetch about data:", error);
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

      {/* TEAM SECTION */}
      {data.teamCategories && data.teamCategories.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          {data.teamCategories.map((cat, i) => (
            <div key={cat.id} className={i > 0 ? "mt-20" : ""}>
              <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10">
                <Badge
                  variant="outline"
                  className="mb-3 border-accent text-accent-foreground bg-accent/10"
                >
                  {cat.categoryName}
                </Badge>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
                  Meet the {cat.categoryName}
                </h2>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cat.members.map((member, j) => (
                  <motion.div
                    key={member.id}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: j * 0.05 }}
                  >
                    <Card className="border-0 shadow-card h-full overflow-hidden hover:shadow-elegant transition-spring group">
                      <div className="aspect-square w-full relative overflow-hidden bg-muted">
                        <img
                          src={
                            member.image ||
                            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
                          }
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-spring duration-500"
                        />
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-display font-bold text-lg text-primary">
                          {member.name}
                        </h3>
                        {member.role && (
                          <div className="text-xs font-semibold text-accent mt-1 uppercase tracking-wider">
                            {member.role}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                          {member.notes}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </PublicLayout>
  );
}
