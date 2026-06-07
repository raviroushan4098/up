export interface CMSHero {
  badgeText: string;
  titleLine1: string;
  titleGradient: string;
  subtitle: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  image?: string;
}

export interface CMSStat {
  icon: string; // "Users", "MapPin", "CheckCircle2", "Calendar"
  value: string;
  label: string;
}

export interface CMSTimelineItem {
  date: string;
  title: string;
  desc: string;
}

export interface CMSBenefit {
  icon: string; // "Award", "HeartHandshake", "Rocket", "GraduationCap"
  title: string;
  desc: string;
}

export interface CMSHowItWorksStep {
  n: string;
  t: string;
  d: string;
}

export interface CMSTestimonial {
  name: string;
  role: string;
  district: string;
  quote: string;
}

export interface CMSFaq {
  q: string;
  a: string;
}

export interface CMSContact {
  helpline: string;
  email: string;
  office: string;
  whatsapp: string;
}

export interface LandingPageCMS {
  hero: CMSHero;
  stats: CMSStat[];
  timeline: CMSTimelineItem[];
  benefits: CMSBenefit[];
  howItWorks: CMSHowItWorksStep[];
  testimonials: CMSTestimonial[];
  faqs: CMSFaq[];
  contact: CMSContact;
  visibility: {
    hero: boolean;
    stats: boolean;
    timeline: boolean;
    benefits: boolean;
    howItWorks: boolean;
    testimonials: boolean;
    faqs: boolean;
  };
}
