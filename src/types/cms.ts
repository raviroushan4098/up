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
  images?: string[];
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

export interface AboutHero {
  badgeText: string;
  titleLine1: string;
  titleGradient: string;
  subtitle: string;
}

export interface AboutMissionVision {
  title: string;
  description: string;
}

export interface AboutObjective {
  icon: string; // e.g., "Users", "Landmark", "Award", "Flag", "HeartHandshake", "Rocket"
  title: string;
  description: string;
}

export interface AboutTimelineItem {
  date: string;
  title: string;
  desc: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  notes: string;
  image: string;
}

export interface TeamCategory {
  id: string;
  categoryName: string;
  members: TeamMember[];
}

export interface AboutPageCMS {
  hero: AboutHero;
  mission: AboutMissionVision;
  vision: AboutMissionVision;
  objectives: AboutObjective[];
  timeline: AboutTimelineItem[];
  teamCategories?: TeamCategory[];
}

export const emptyLandingCMS: LandingPageCMS = {
  hero: {
    badgeText: "",
    titleLine1: "",
    titleGradient: "",
    subtitle: "",
    stat1Label: "",
    stat1Value: "",
    stat2Label: "",
    stat2Value: "",
    stat3Label: "",
    stat3Value: "",
    image: "",
    images: [],
  },
  stats: [],
  timeline: [],
  benefits: [],
  howItWorks: [],
  testimonials: [],
  faqs: [],
  contact: { helpline: "", email: "", office: "", whatsapp: "" },
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

export const emptyAboutCMS: AboutPageCMS = {
  hero: { badgeText: "", titleLine1: "", titleGradient: "", subtitle: "" },
  mission: { title: "", description: "" },
  vision: { title: "", description: "" },
  objectives: [],
  timeline: [],
  teamCategories: [],
};
