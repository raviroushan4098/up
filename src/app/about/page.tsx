"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Eye, Users, Award, Landmark, Flag, HeartHandshake, Rocket } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { timeline } from "@/data/mock";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55 },
};

export default function AboutPage() {
  const [stats, setStats] = useState<{ v: string; l: string }[] | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const docRef = doc(db, "counters", "global");
        const docSnap = await getDoc(docRef);

        const formatNumber = (num: number) => {
          if (!num) return "0";
          if (num >= 100000) return (num / 100000).toFixed(1) + "L+";
          if (num >= 1000) return (num / 1000).toFixed(1) + "K+";
          return num.toString();
        };

        if (docSnap.exists()) {
          const data = docSnap.data();
          setStats([
            { v: "75", l: "Districts Covered" },
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
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats([
          { v: "75", l: "Districts Covered" },
          { v: "2.4L+", l: "Active Citizens" },
          { v: "1.1L+", l: "Approved Applications" },
        ]);
      }
    };
    fetchStats();
  }, []);

  return (
    <PublicLayout>
      <section className="bg-gradient-soft py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="outline" className="mb-4">
            About the Initiative
          </Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primary">
            Empowering the youth of <span className="text-gradient-saffron">Uttar Pradesh</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            A Government of Uttar Pradesh flagship programme connecting 24+ crore citizens to
            opportunities in technology, skills, education, culture and entrepreneurship.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-6">
        {[
          {
            icon: Target,
            t: "Our Mission",
            d: "Bhavishya-E-Uttar Pradesh is committed to creating a powerful platform where young minds can think, express, lead, and contribute towards nation-building. We believe that the true strength of India lies in its youth, and our mission is to connect every aspiring young individual with opportunities, ideas, leadership development, and meaningful dialogue.Through youth parliaments, constitutional awareness initiatives, leadership development programs, social outreach campaigns, environmental initiatives, and policy discussions, we strive to cultivate democratic values, civic responsibility, public speaking skills, leadership capabilities, and a spirit of national service among young citizens.Our mission is not limited to organizing events; it is about building a generation that is thoughtful, responsible, confident, and committed to the progress of society and the nation.We aim to ensure that every young person, regardless of their background, receives a platform where their voice is heard, their talent is recognized, and their potential is transformed into meaningful leadership.We believe that when youth are given the right direction, the right opportunities, and the right platform, they become the driving force behind social transformation, innovation, and national development.",
          },
          {
            icon: Eye,
            t: "Our Vision",
            d: "Our vision is to build a nationwide youth leadership movement that inspires, empowers, and connects young citizens across India. We envision a future where every young individual has equal access to opportunities, mentorship, knowledge, and leadership platforms that enable them to actively participate in shaping the future of the nation.We aspire to create a generation that understands democratic values, respects constitutional principles, embraces social responsibility, and possesses the confidence to lead positive change in their communities and beyond. By bringing together youth from diverse regions, cultures, languages, and backgrounds, we seek to foster meaningful dialogue, collaboration, and collective action for national progress.Bhavishya-E-Uttar Pradesh envisions an India where leadership is determined not by privilege or circumstance, but by vision, capability, dedication, and character. We strive to create a platform where talent is celebrated, ideas are respected, and every young citizen has the opportunity to contribute towards building a stronger, more inclusive, and globally respected India.Our vision is rooted in a simple belief: when empowered youth lead with purpose, they become the architects of a better future for society, the nation, and generations to come.",
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
            {[
              {
                i: Users,
                t: "Youth Leadership Development",
                d: "Empowering young minds through leadership programs, youth parliaments, debates, and experiential learning opportunities that prepare them to become responsible leaders of tomorrow.",
              },
              {
                i: Landmark,
                t: "Constitutional Awareness",
                d: "Promoting democratic values, constitutional understanding, civic responsibility, and informed participation to create aware, responsible, and active citizens.",
              },
              {
                i: Award,
                t: "Talent Recognition",
                d: "Providing a meaningful platform where talented youth can showcase their ideas, skills, and potential while receiving recognition, mentorship, and growth opportunities.",
              },
              {
                i: Flag,
                t: "Nation Building",
                d: "Encouraging young citizens to actively contribute towards social progress, policy dialogue, community development, and the collective advancement of the nation.",
              },
              {
                i: HeartHandshake,
                t: "Social Responsibility",
                d: "Inspiring youth to address social, educational, cultural, and environmental challenges through service, awareness campaigns, and community engagement initiatives.",
              },
              {
                i: Rocket,
                t: "Youth Empowerment",
                d: "Creating equal opportunities for every young individual by connecting them with knowledge, mentorship, leadership platforms, and pathways for personal and professional growth.",
              },
            ].map((o, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-card h-full hover:-translate-y-1 transition-spring">
                  <CardContent className="p-6">
                    <o.i className="size-8 text-accent mb-3" />
                    <h3 className="font-display font-bold text-primary">{o.t}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{o.d}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
          {timeline.map((t, i) => (
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
