import { LandingPageCMS } from "@/types/cms";
import { stats, timeline, testimonials, faqs } from "./mock";

export const defaultLandingCMS: LandingPageCMS = {
  hero: {
    badgeText: "Registrations Live · 2026 Season",
    titleLine1: "नए उत्तर प्रदेश का",
    titleGradient: "नया भविष्य",
    subtitle:
      "The official registration platform for   Uttar Pradesh youth initiatives — innovation, skills, scholarships, culture and more. One portal, every opportunity.",
    stat1Label: "",
    stat1Value: "",
    stat2Label: "",
    stat2Value: "",
    stat3Label: "",
    stat3Value: "",
    image: "",
  },
  stats: stats.map((s) => ({
    icon: s.icon,
    value: s.value,
    label: s.label,
  })),
  timeline: timeline.map((t) => ({
    date: t.date,
    title: t.title,
    desc: t.desc,
  })),
  benefits: [
    {
      icon: "Award",
      title: " . Certification",
      desc: "Recognised certificates from   UP.",
    },
    {
      icon: "HeartHandshake",
      title: "Stipend & Grants",
      desc: "Up to ₹5 Lakh in support and prizes.",
    },
    {
      icon: "Rocket",
      title: "Mentorship",
      desc: "Learn from industry and   leaders.",
    },
    {
      icon: "GraduationCap",
      title: "Career Boost",
      desc: "Placement, internships and incubation.",
    },
  ],
  howItWorks: [
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
  ],
  testimonials: testimonials.map((t) => ({
    name: t.name,
    role: t.role,
    district: t.district,
    quote: t.quote,
  })),
  faqs: faqs.map((f) => ({
    q: f.q,
    a: f.a,
  })),
  contact: {
    helpline: "1800-180-5555",
    email: "support@bhavishyaup.gov.in",
    office: "Yojana Bhawan, Lucknow, UP 226001",
    whatsapp: "+91 90000 90000",
  },
  visibility: {
    hero: true,
    stats: true,
    timeline: true,
    benefits: true,
    howItWorks: true,
    testimonials: true,
    faqs: true,
  },
};
