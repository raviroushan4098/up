import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

export type EventStatus = "Open" | "Closing Soon" | "Closed";
export type EventCategory =
  | "Technology"
  | "Skill Development"
  | "Cultural"
  | "Education"
  | "Agriculture";

export interface UPEvent {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  image: string;
  deadline: string;
  districts: string[];
  category: EventCategory;
  status: EventStatus;
  benefits: string[];
  eligibility: string[];
  schedule: { date: string; label: string }[];
}

export const events: UPEvent[] = [
  {
    id: "youth-tech-innovation-2026",
    title: "Youth Tech Innovation Challenge 2026",
    titleHi: "युवा तकनीकी नवाचार चुनौती २०२६",
    description:
      "State-level innovation contest for students and young professionals to showcase technology solutions for social impact.",
    image: event1.src,
    deadline: "2026-06-30",
    districts: ["Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Agra", "Noida"],
    category: "Technology",
    status: "Open",
    benefits: [
      "Cash prizes up to ₹5 Lakh",
      "Incubation support at UP Startup Hub",
      "Certificate from CM Office",
      "Mentorship from industry experts",
    ],
    eligibility: [
      "Age between 16 and 30 years",
      "Resident of Uttar Pradesh",
      "Currently enrolled in college or working professional",
      "Team size: 1 to 4 members",
    ],
    schedule: [
      { date: "May 20, 2026", label: "Registrations Open" },
      { date: "Jun 30, 2026", label: "Submission Deadline" },
      { date: "Jul 15, 2026", label: "Shortlist Announcement" },
      { date: "Aug 10, 2026", label: "Grand Finale, Lucknow" },
    ],
  },
  {
    id: "skill-india-up-2026",
    title: "Skill UP Bharat Workshop Series",
    titleHi: "स्किल अप भारत कार्यशाला",
    description:
      "Free certified training across 25 trades — from welding and electronics to digital marketing and AI tools.",
    image: event2.src,
    deadline: "2026-07-15",
    districts: ["All Districts"],
    category: "Skill Development",
    status: "Open",
    benefits: [
      "Government-recognised certification",
      "Stipend of ₹3,000/month during training",
      "Job placement assistance",
      "Tool kit on completion",
    ],
    eligibility: [
      "Age between 18 and 35 years",
      "Class 10 pass minimum",
      "Resident of Uttar Pradesh",
    ],
    schedule: [
      { date: "May 25, 2026", label: "Registration Opens" },
      { date: "Jul 15, 2026", label: "Last Date to Apply" },
      { date: "Aug 01, 2026", label: "Batch 1 Starts" },
    ],
  },
  {
    id: "kala-utsav-2026",
    title: "UP Kala Utsav — Cultural Heritage Festival",
    titleHi: "उत्तर प्रदेश कला उत्सव",
    description:
      "Celebrate the rich folk arts, music, dance and crafts of Uttar Pradesh. Open to artists and student troupes.",
    image: event3.src,
    deadline: "2026-06-10",
    districts: ["Lucknow", "Varanasi", "Mathura", "Ayodhya", "Jhansi"],
    category: "Cultural",
    status: "Closing Soon",
    benefits: [
      "Performance at state-level platform",
      "Travel and accommodation covered",
      "Cash awards for winners",
      "Featured on Doordarshan UP",
    ],
    eligibility: [
      "Open to all age groups",
      "Solo or group entries (up to 12)",
      "Original folk / classical compositions",
    ],
    schedule: [
      { date: "May 10, 2026", label: "Registrations Open" },
      { date: "Jun 10, 2026", label: "Registration Closes" },
      { date: "Jul 05, 2026", label: "District Auditions" },
      { date: "Aug 15, 2026", label: "State Finale, Lucknow" },
    ],
  },
  {
    id: "krishi-yuva-2026",
    title: "Krishi Yuva — Agritech for Farmers",
    titleHi: "कृषि युवा — किसानों के लिए तकनीक",
    description:
      "Workshops and grants for young farmers and agritech entrepreneurs working on sustainable agriculture.",
    image: event1.src,
    deadline: "2026-08-01",
    districts: ["Meerut", "Bareilly", "Gorakhpur", "Aligarh", "Saharanpur"],
    category: "Agriculture",
    status: "Open",
    benefits: ["Grants up to ₹2 Lakh", "Free soil testing", "Drone training", "Market linkage"],
    eligibility: ["Age 18–40", "Farmer ID or agritech startup", "UP resident"],
    schedule: [
      { date: "Jun 01, 2026", label: "Registrations Open" },
      { date: "Aug 01, 2026", label: "Last Date" },
    ],
  },
  {
    id: "scholar-up-2026",
    title: "Scholar UP Merit Scholarship",
    titleHi: "स्कॉलर उत्तर प्रदेश छात्रवृत्ति",
    description:
      "Annual merit scholarship for meritorious students from economically weaker sections across UP.",
    image: event2.src,
    deadline: "2026-05-31",
    districts: ["All Districts"],
    category: "Education",
    status: "Closed",
    benefits: ["Up to ₹50,000 per year", "Laptop on enrolment", "Mentorship"],
    eligibility: ["Class 12 with 80%+", "Family income < ₹6 LPA"],
    schedule: [
      { date: "Mar 01, 2026", label: "Opened" },
      { date: "May 31, 2026", label: "Closed" },
    ],
  },
  {
    id: "her-shakti-2026",
    title: "Her Shakti — Women Leadership Cohort",
    titleHi: "हर शक्ति — महिला नेतृत्व",
    description:
      "12-week leadership and entrepreneurship cohort for women aged 18–35 across Uttar Pradesh.",
    image: event3.src,
    deadline: "2026-07-20",
    districts: ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Prayagraj"],
    category: "Skill Development",
    status: "Open",
    benefits: ["Mentorship", "Seed grant ₹1 Lakh", "Network access", "Childcare stipend"],
    eligibility: ["Women, 18–35", "UP resident", "Idea or running venture"],
    schedule: [
      { date: "May 15, 2026", label: "Applications Open" },
      { date: "Jul 20, 2026", label: "Deadline" },
    ],
  },
];

export const districts = [
  "All Districts",
  "Lucknow",
  "Kanpur",
  "Varanasi",
  "Prayagraj",
  "Agra",
  "Noida",
  "Ghaziabad",
  "Meerut",
  "Bareilly",
  "Gorakhpur",
  "Aligarh",
  "Mathura",
  "Ayodhya",
  "Jhansi",
  "Saharanpur",
];

export const categories: EventCategory[] = [
  "Technology",
  "Skill Development",
  "Cultural",
  "Education",
  "Agriculture",
];

export const stats = [
  { label: "Total Registrations", value: "2,48,690", icon: "Users" },
  { label: "Districts Participating", value: "75", icon: "MapPin" },
  { label: "Approved Applications", value: "1,12,420", icon: "CheckCircle2" },
  { label: "Events Live", value: "24", icon: "Calendar" },
];

export const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Winner, Tech Challenge 2025",
    district: "Lucknow",
    quote:
      "Bhavishya UP gave my idea a stage. From a college project to government incubation in 6 months — life-changing.",
  },
  {
    name: "Priya Verma",
    role: "Skill UP Graduate",
    district: "Kanpur",
    quote:
      "I got certified, placed and now earn ₹28,000/month. The portal made registration so simple — even my parents understood.",
  },
  {
    name: "Mohd. Rizwan",
    role: "Krishi Yuva Fellow",
    district: "Bareilly",
    quote:
      "Drone training and a ₹1.5 L grant transformed my 3-acre farm. Thank you to the UP Government for this initiative.",
  },
];

export const faqs = [
  {
    q: "Who can register on Bhavishya Uttar Pradesh?",
    a: "Any resident of Uttar Pradesh who meets the specific eligibility for the event they are applying to. Each event lists age, education and document requirements.",
  },
  {
    q: "Is there any registration fee?",
    a: "No. All Government of Uttar Pradesh events listed on this platform are completely free to apply for.",
  },
  {
    q: "Which documents do I need to keep ready?",
    a: "Aadhaar card, recent passport photo, education certificates, and event-specific documents (e.g. video pitch, portfolio).",
  },
  {
    q: "Can I edit my application after submission?",
    a: "You can save drafts before submission. After submission, please contact the helpline for corrections within 48 hours.",
  },
  {
    q: "How will I know if my application is approved?",
    a: "You'll receive SMS and email updates, plus live status in your dashboard. Approved candidates also see results on the Results page.",
  },
];

export const timeline = [
  {
    date: "May 2026",
    title: "Portal Launch",
    desc: "Bhavishya UP opens for nationwide registrations.",
  },
  {
    date: "Jun 2026",
    title: "Event Registrations",
    desc: "All flagship events open across 75 districts.",
  },
  {
    date: "Jul 2026",
    title: "District Auditions",
    desc: "Shortlisting and district-level rounds begin.",
  },
  {
    date: "Aug 2026",
    title: "State Finale",
    desc: "Winners felicitated at the state capital, Lucknow.",
  },
];

export const applications = [
  {
    id: "BUP-2026-00821",
    event: "Youth Tech Innovation Challenge 2026",
    date: "2026-05-14",
    status: "Under Review",
  },
  {
    id: "BUP-2026-00702",
    event: "Skill UP Bharat Workshop Series",
    date: "2026-05-10",
    status: "Approved",
  },
  {
    id: "BUP-2026-00611",
    event: "Krishi Yuva — Agritech for Farmers",
    date: "2026-05-04",
    status: "Pending",
  },
  {
    id: "BUP-2025-09431",
    event: "Scholar UP Merit Scholarship",
    date: "2025-12-21",
    status: "Selected",
  },
];

export const notifications = [
  {
    id: 1,
    title: "Application Approved",
    desc: "Your Skill UP application is approved. Batch starts Aug 1.",
    time: "2h ago",
    type: "success",
  },
  {
    id: 2,
    title: "Documents Verified",
    desc: "Aadhaar and education proofs successfully verified.",
    time: "1d ago",
    type: "info",
  },
  {
    id: 3,
    title: "Reminder: Deadline",
    desc: "Krishi Yuva closes in 5 days. Complete your application.",
    time: "2d ago",
    type: "warning",
  },
  {
    id: 4,
    title: "New Event Live",
    desc: "Her Shakti cohort applications are now open.",
    time: "5d ago",
    type: "info",
  },
];

export const dailyRegistrations = [
  { day: "Mon", count: 4200 },
  { day: "Tue", count: 5100 },
  { day: "Wed", count: 4800 },
  { day: "Thu", count: 6200 },
  { day: "Fri", count: 7400 },
  { day: "Sat", count: 8800 },
  { day: "Sun", count: 7200 },
];

export const districtAnalytics = [
  { district: "Lucknow", apps: 18420 },
  { district: "Kanpur", apps: 14210 },
  { district: "Varanasi", apps: 12830 },
  { district: "Prayagraj", apps: 11240 },
  { district: "Noida", apps: 10110 },
  { district: "Agra", apps: 8920 },
];
