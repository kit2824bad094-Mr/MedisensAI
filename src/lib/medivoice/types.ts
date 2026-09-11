export type Urgency = "normal" | "priority" | "red-flag";

export interface PatientInfo {
  id: string;
  name: string;
  age: number;
  sex: "Male" | "Female" | "Other";
  abhaId: string;
  language: string;
}

export interface SymptomEntry {
  question: string;
  answer: string;
  at: string;
}

export interface HistoryEntry {
  condition: string;
  since: string;
  status: "Active" | "Resolved" | "Monitored";
}

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
}

export interface ExtractedField {
  label: string;
  value: string;
  flagged?: boolean;
  /** relative position on the report thumbnail, 0-100 */
  x: number;
  y: number;
}

export interface ReportDoc {
  id: string;
  title: string;
  kind: "Lab report" | "Prescription" | "Discharge summary";
  uploadedAt: string;
  fields: ExtractedField[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind: "condition" | "treatment" | "visit" | "lab";
  severity: "low" | "medium" | "high";
}

export interface AiSummary {
  chiefComplaint: string;
  associatedSymptoms: string[];
  duration: string;
  pastHistory: string[];
  currentMedication: string[];
  oneLiner: string;
  confidence: number;
}

export interface RedFlag {
  title: string;
  trigger: string;
  recommendation: string;
}

export interface PatientRecord {
  patientInfo: PatientInfo;
  arrivedAt: string;
  urgency: Urgency;
  reviewed: boolean;
  /** set manually by the doctor after opening the record */
  viewed: boolean;
  symptoms: SymptomEntry[];
  history: HistoryEntry[];
  medications: Medication[];
  reports: ReportDoc[];
  timelineEvents: TimelineEvent[];
  aiSummary: AiSummary;
  redFlags: RedFlag[];
}
