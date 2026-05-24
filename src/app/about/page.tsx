"use client";

import { motion } from "framer-motion";
import { Target, Eye, Users, Award, GraduationCap, HeartHandshake } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeline } from "@/data/mock";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55 },
};

export default function AboutPage() {
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
            d: "To create a single, transparent and trusted digital platform that unlocks government opportunities for every citizen of Uttar Pradesh — regardless of district, gender or background.",
          },
          {
            icon: Eye,
            t: "Our Vision",
            d: "An Uttar Pradesh where every young citizen has equal access to skill, knowledge, capital and a stage to showcase their talent — powered by Digital India.",
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { i: Users, t: "Reach 1 Crore Youth", d: "Onboard one crore citizens by 2027." },
              { i: GraduationCap, t: "Skill 5 Lakh +", d: "Certified skilling across 25 trades." },
              { i: Award, t: "Recognise Talent", d: "Annual state awards for innovators." },
              { i: HeartHandshake, t: "Connect Industry", d: "Partner with 500+ employers." },
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
          {[
            { v: "75", l: "Districts Covered" },
            { v: "2.4L+", l: "Active Citizens" },
            { v: "1.1L+", l: "Approved Applications" },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display font-extrabold text-4xl md:text-5xl text-accent-glow">
                {s.v}
              </div>
              <div className="text-sm opacity-80 mt-1">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </section>
    </PublicLayout>
  );
}
