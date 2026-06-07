export type EventStatus = "Draft" | "Open" | "Closed";

export interface UPEvent {
  id: string; // The Firestore document ID
  title: string;
  description: string;
  image?: string;
  deadline: string;
  districts: string[];
  category: string;
  status: EventStatus;

  // Specific event fields
  videoGuidelines: string;
  rules: string;
  dressCode: string;
  venue: string;
  contactInfo: string;
  agendaTopics: any[]; // Array of { title: string, description: string } or legacy string
  customDeclaration: string;

  startDate?: string;
  endDate?: string;

  // Additional fields from mock that might be added to DB later
  titleHi?: string;
  eligibility?: string[];
  benefits?: string[];
  schedule?: { date: string; label: string }[];

  formConfig?: {
    requireEducation: boolean;
    requireTopic: boolean;
    requireVideo: boolean;
  };

  createdAt: string;
}

export interface EventApplication {
  id: string; // Document ID
  applicationNo?: string; // e.g. BUP00012
  eventId: string;
  userId: string;
  status: "pending" | "accepted" | "selected" | "rejected";

  passGenerated?: boolean;
  passId?: string;

  // Application specific fields (collected on the form)
  schoolCollegeName: string;
  classCourse: string;
  selectedTopic: string;
  videoUrl: string;
  declarationAgreed: boolean;

  // Snapshotted profile data at time of application (optional, but good for historical record)
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantDistrict?: string;

  checkedIn?: boolean;
  checkedInAt?: string;

  appliedAt: string;
}
