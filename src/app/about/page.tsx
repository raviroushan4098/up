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
      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="bg-gradient-saffron-warm text-white py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <Badge
            variant="outline"
            className="mb-4 border-white/35 text-white bg-white/10 rounded-full px-4 py-1 text-xs"
          >
            {data.hero.badgeText || "About the Initiative"}
          </Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight leading-tight">
            {data.hero.titleLine1}{" "}
            <span className="text-white drop-shadow-sm">{data.hero.titleGradient}</span>
          </h1>
          <p className="mt-5 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto font-normal">
            {data.hero.subtitle}
          </p>
          <div className="w-16 h-0.5 bg-white/60 mx-auto mt-6" />
        </div>
      </section>

      {/* ═══════════════ MISSION & VISION ═══════════════ */}
      <section className="w-full overflow-hidden">
        {/* Mission Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch">
          <motion.div
            {...fadeUp}
            className="order-1 md:order-1 flex flex-col justify-center bg-white p-8 sm:p-12 md:p-16 lg:p-24"
          >
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E] mb-5">
              {data.mission.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
              {data.mission.description}
            </p>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="order-2 md:order-2 relative min-h-[320px] md:min-h-[480px]"
          >
            <img
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80"
              alt={data.mission.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Vision Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch">
          <motion.div
            {...fadeUp}
            className="order-2 md:order-1 relative min-h-[320px] md:min-h-[480px]"
          >
            <img
              src="https://images.unsplash.com/photo-1508962914676-134849a727f0?w=800&q=80"
              alt={data.vision.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="order-1 md:order-2 flex flex-col justify-center bg-white p-8 sm:p-12 md:p-16 lg:p-24"
          >
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E] mb-5">
              {data.vision.title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
              {data.vision.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ OBJECTIVES ═══════════════ */}
      <section className="bg-gradient-soft py-20 border-y border-border/10">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="mb-3 border-accent/40 text-[#8B4513] bg-accent/5 rounded-full px-4 py-1"
            >
              Objectives
            </Badge>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E]">
              What we aim to achieve
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {data.objectives.map((o, i) => {
              const IconComponent = iconMap[o.icon] || Target;
              const isOrange = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                >
                  <Card
                    className={`border-0 h-full hover:-translate-y-1 transition-spring min-h-[220px] sm:min-h-[290px] ${
                      isOrange
                        ? "bg-[#C84B31] text-white shadow-glow"
                        : "bg-white text-[#3D1B0E] shadow-card border border-border/40"
                    }`}
                  >
                    <CardContent className="p-5 sm:p-10 flex flex-col justify-center h-full">
                      <IconComponent
                        className={`size-8 sm:size-10 mb-3 sm:mb-5 ${isOrange ? "text-white" : "text-[#C84B31]"}`}
                      />
                      <h3
                        className={`font-display font-bold text-base sm:text-xl md:text-2xl leading-snug ${
                          isOrange ? "text-white" : "text-[#3D1B0E]"
                        }`}
                      >
                        {o.title}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm md:text-base mt-2 sm:mt-4 leading-relaxed ${
                          isOrange ? "text-white/90" : "text-muted-foreground"
                        }`}
                      >
                        {o.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ TIMELINE / JOURNEY ═══════════════ */}
      <section className="container mx-auto px-4 py-20">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
          <Badge
            variant="outline"
            className="mb-3 border-accent/40 text-[#8B4513] bg-accent/5 rounded-full px-4 py-1"
          >
            Timeline
          </Badge>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E]">
            Our journey
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {data.timeline.map((t, i) => {
            const isDark = i % 2 === 0;
            return (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              >
                <Card
                  className={`border-0 h-full hover:-translate-y-1 transition-spring flex flex-col justify-between min-h-[220px] sm:min-h-[290px] ${
                    isDark
                      ? "bg-footer-dark text-white shadow-elegant"
                      : "bg-white text-[#3D1B0E] border border-border/40 shadow-card"
                  }`}
                >
                  <CardContent className="p-5 sm:p-10 flex flex-col justify-start h-full">
                    <span className="w-fit px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#C84B31] text-white text-[10px] sm:text-sm font-semibold mb-3 sm:mb-5 inline-block">
                      {t.date}
                    </span>
                    <h3
                      className={`font-display font-bold text-base sm:text-xl md:text-2xl leading-snug ${
                        isDark ? "text-white" : "text-[#3D1B0E]"
                      }`}
                    >
                      {t.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm md:text-base mt-2 sm:mt-4 leading-relaxed ${
                        isDark ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      {t.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ TEAM SECTION ═══════════════ */}
      {data.teamCategories && data.teamCategories.length > 0 && (
        <section className="container mx-auto px-4 pb-24">
          {data.teamCategories.map((cat, i) => (
            <div key={cat.id} className={i > 0 ? "mt-24" : ""}>
              <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
                <Badge
                  variant="outline"
                  className="mb-3 border-accent/40 text-[#8B4513] bg-accent/5 rounded-full px-4 py-1"
                >
                  {cat.categoryName}
                </Badge>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#3D1B0E]">
                  Meet the {cat.categoryName}
                </h2>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
                {cat.members.map((member, j) => (
                  <motion.div
                    key={member.id}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: j * 0.05 }}
                  >
                    <div className="aspect-[4/5] w-full rounded-[24px] overflow-hidden relative group/card shadow-card hover:shadow-elegant transition-spring">
                      {/* Image */}
                      <img
                        src={
                          member.image ||
                          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
                        }
                        alt={member.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-105 transition-all duration-500"
                      />
                      {/* Premium dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none z-10" />

                      {/* Content aligned at the bottom */}
                      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex flex-col justify-end text-left z-20">
                        <h3 className="font-display font-bold text-white text-sm sm:text-lg md:text-xl drop-shadow-md">
                          {member.name}
                        </h3>
                        {member.role && (
                          <div className="text-[10px] sm:text-xs font-semibold text-accent mt-1.5 uppercase tracking-wider">
                            {member.role}
                          </div>
                        )}
                        {member.phone && (
                          <div className="text-[9px] sm:text-[11px] text-white/70 mt-1 flex items-center gap-1">
                            <span>Ph.no.</span> {member.phone}
                          </div>
                        )}
                        {member.notes && (
                          <p className="text-[10px] sm:text-xs text-white/80 mt-2 sm:mt-2.5 line-clamp-3 leading-relaxed font-light">
                            {member.notes}
                          </p>
                        )}
                      </div>
                    </div>
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
