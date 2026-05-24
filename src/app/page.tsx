"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  Rocket,
  GraduationCap,
  HeartHandshake,
  Award,
  Sparkles,
  ChevronRight,
  Quote,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import heroImg from "@/assets/hero-up.jpg";
import { events, stats, testimonials, faqs, timeline } from "@/data/mock";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function HomePage() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 bg-accent/15 text-primary border-accent/30 mb-5"
            >
              <Sparkles className="size-3.5 mr-1.5" /> Registrations Live · 2026 Season
            </Badge>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-primary">
              नए उत्तर प्रदेश का
              <br />
              <span className="text-gradient-saffron">नया भविष्य</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
              The official registration platform for Government of Uttar Pradesh youth initiatives —
              innovation, skills, scholarships, culture and more. One portal, every opportunity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-saffron text-primary font-semibold shadow-glow hover:opacity-95 h-12 px-7"
              >
                <Link href="/register">
                  Register Now <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 border-primary/20 hover:bg-primary hover:text-primary-foreground"
              >
                <Link href="/events">View Events</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" /> Govt. Verified
              </span>
              <span className="flex items-center gap-2">
                <Users className="size-4 text-primary" /> 2.4 Lakh+ Registered
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" /> 75 Districts
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-saffron rounded-3xl rotate-3 opacity-20 blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-elegant border bg-card">
              <img
                src={heroImg.src}
                alt="Youth of Uttar Pradesh"
                width={1536}
                height={1024}
                className="w-full h-auto"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -left-3 sm:-left-6 bottom-6 glass rounded-2xl shadow-elegant p-4 flex items-center gap-3"
            >
              <div className="size-10 rounded-full bg-success/15 grid place-items-center">
                <CheckCircle2 className="size-5 text-success" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-primary">12,420 approved</div>
                <div className="text-xs text-muted-foreground">in the last 24 hours</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <motion.div {...fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = { Users, MapPin, CheckCircle2, Calendar }[s.icon as "Users"];
            return (
              <Card
                key={i}
                className="border-0 shadow-card overflow-hidden group hover:shadow-elegant transition-base"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-xl bg-gradient-saffron grid place-items-center shadow-soft group-hover:scale-110 transition-spring">
                      <Icon className="size-5 text-primary" />
                    </div>
                  </div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-primary">
                    {s.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="container mx-auto px-4 py-20">
        <motion.div {...fadeUp} className="flex items-end justify-between gap-4 mb-10">
          <div>
            <Badge
              variant="outline"
              className="mb-3 border-accent text-accent-foreground bg-accent/10"
            >
              Featured
            </Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
              Live Events & Opportunities
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Hand-picked programmes from the Government of Uttar Pradesh, open for registration
              right now.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex">
            <Link href="/events">
              View all <ChevronRight className="size-4 ml-1" />
            </Link>
          </Button>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 3).map((e, i) => (
            <motion.div
              key={e.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            >
              <Card className="overflow-hidden h-full border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={e.image}
                    alt={e.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-spring"
                  />
                  <Badge
                    className={`absolute top-3 right-3 ${
                      e.status === "Open"
                        ? "bg-success text-success-foreground"
                        : e.status === "Closing Soon"
                          ? "bg-warning text-warning-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {e.status}
                  </Badge>
                </div>
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {e.category}
                  </Badge>
                  <h3 className="font-display font-bold text-lg leading-snug text-primary">
                    {e.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Deadline{" "}
                      {new Date(e.deadline).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <Link
                      href={`/events/${e.id}`}
                      className="font-semibold text-primary hover:text-accent-glow inline-flex items-center gap-1"
                    >
                      Apply <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-gradient-soft py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3">
              Roadmap
            </Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
              Important Dates 2026
            </h2>
            <p className="text-muted-foreground mt-2">
              Mark your calendar — every milestone you need to know.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-tricolor" />
            {timeline.map((t, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="relative"
              >
                <div className="mx-auto size-8 rounded-full bg-gradient-saffron grid place-items-center shadow-glow z-10 relative">
                  <span className="size-2.5 rounded-full bg-primary" />
                </div>
                <Card className="mt-5 border-0 shadow-card text-center">
                  <CardContent className="p-5">
                    <div className="text-xs font-semibold text-accent-foreground bg-accent/15 inline-block px-3 py-1 rounded-full mb-2">
                      {t.date}
                    </div>
                    <h3 className="font-display font-bold text-primary">{t.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="container mx-auto px-4 py-20">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3">
            Why Apply
          </Badge>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
            Benefits for Every Citizen
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Award,
              title: "Govt. Certification",
              desc: "Recognised certificates from Govt. of UP.",
            },
            {
              icon: HeartHandshake,
              title: "Stipend & Grants",
              desc: "Up to ₹5 Lakh in support and prizes.",
            },
            {
              icon: Rocket,
              title: "Mentorship",
              desc: "Learn from industry and government leaders.",
            },
            {
              icon: GraduationCap,
              title: "Career Boost",
              desc: "Placement, internships and incubation.",
            },
          ].map((b, i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
              <Card className="h-full border-0 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-spring">
                <CardContent className="p-6">
                  <div className="size-12 rounded-2xl bg-gradient-saffron grid place-items-center shadow-soft mb-4">
                    <b.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-primary">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{b.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gradient-navy text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 size-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="bg-white/10 text-primary-foreground border-white/20 mb-3">
              Process
            </Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">How It Works</h2>
            <p className="opacity-80 mt-2">
              Three simple steps to register for any UP Government initiative.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                t: "Create Account",
                d: "Sign up with mobile OTP or email in under 60 seconds.",
              },
              {
                n: "02",
                t: "Choose Event",
                d: "Browse 24+ active programmes across all 75 districts.",
              },
              {
                n: "03",
                t: "Submit Application",
                d: "Fill the form, upload documents and track your status.",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <div className="font-display font-extrabold text-5xl text-accent-glow">{s.n}</div>
                <h3 className="font-display font-bold text-xl mt-3">{s.t}</h3>
                <p className="text-sm opacity-80 mt-2">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-20">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3">
            Voices of UP
          </Badge>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
            Real Stories, Real Impact
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <Card className="h-full border-0 shadow-card relative">
                <CardContent className="p-6">
                  <Quote className="size-8 text-accent mb-3" />
                  <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
                  <div className="mt-5 pt-5 border-t flex items-center gap-3">
                    <div className="size-11 rounded-full bg-gradient-saffron grid place-items-center font-display font-bold text-primary">
                      {t.name
                        .split(" ")
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-primary text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.role} · {t.district}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-soft py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center mb-10">
            <Badge variant="outline" className="mb-3">
              Help
            </Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primary">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <motion.div {...fadeUp}>
            <Accordion
              type="single"
              collapsible
              className="bg-card rounded-2xl shadow-card border-0 px-2"
            >
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0">
                  <AccordionTrigger className="px-4 text-left font-semibold text-primary hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          {...fadeUp}
          className="rounded-3xl bg-gradient-hero p-10 md:p-16 text-center text-primary-foreground shadow-elegant relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -right-10 size-80 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl leading-tight">
              Your future starts today.
            </h2>
            <p className="mt-4 opacity-90 max-w-xl mx-auto">
              Join 2.4 lakh+ citizens building the new Uttar Pradesh. Free to register, easy to
              apply, life-changing to participate.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 h-12 px-8 bg-accent text-primary font-semibold hover:bg-accent-glow"
            >
              <Link href="/register">
                Get Started Free <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
