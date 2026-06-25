export type EventStatus = "Draft" | "Open" | "Closed";
export type DerivedEventStatus = "Coming Soon" | "Open" | "Closed";

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
  participantsCount?: string;
  registrationFeeLabel?: string;
  statsHighlights?: { value: string; label: string }[];
  focusAreas?: { title: string; description: string }[];
  eligibility?: string[];
  benefits?: string[];
  schedule?: { date: string; label: string }[];

  formConfig?: {
    requireEducation: boolean;
    requireTopic: boolean;
    requireVideo: boolean;
  };

  displayConfig?: {
    showDates: boolean;
    showVenue: boolean;
    showDressCode: boolean;
    showContactInfo: boolean;
    showVideoGuidelines: boolean;
    showRules: boolean;
    showAgendaTopics: boolean;
    showEligibility: boolean;
    showBenefits: boolean;
    showSchedule: boolean;
    showDynamicSections?: boolean;
    showParticipantsCount?: boolean;
  };

  dynamicSections?: DynamicSection[];

  createdAt: string;
}

export interface DynamicSectionMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
  file?: File; // Temporary for form state, not saved to DB
}

export interface DynamicSection {
  id: string;
  title: string;
  members: DynamicSectionMember[];
}

export interface EventApplication {
  id: string; // Document ID
  applicationNo?: string; // e.g. BUP00012
  eventId: string;
  userId: string;
  status: "pending" | "accepted" | "selected" | "rejected";
  rejectionReason?: string;

  passGenerated?: boolean;
  passId?: string;
  isTeamPass?: boolean;
  designation?: string;

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
