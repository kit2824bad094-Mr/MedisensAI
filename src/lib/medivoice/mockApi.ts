/**
 * Mocked AI backend for MediVoice.
 *
 * Every function here is a drop-in replacement point for a real service:
 *   transcribeSpeech   -> POST /api/stt        (Whisper)
 *   getNextQuestion    -> POST /api/interview  (LLM adaptive engine)
 *   extractReport      -> POST /api/ocr        (Tesseract / Document AI)
 *   detectRedFlags     -> POST /api/triage     (rules + LLM)
 *   generateSummary    -> POST /api/summary    (LLM)
 *
 * They all simulate realistic latency so loading states are exercised.
 */
import type {
  AiSummary,
  ExtractedField,
  PatientInfo,
  RedFlag,
  ReportDoc,
  SymptomEntry,
  TimelineEvent,
  Urgency,
} from "./types";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface InterviewQuestion {
  id: string;
  text: string;
  chips: string[];
  allowFreeText?: boolean;
}

const SCRIPT: InterviewQuestion[] = [
  {
    id: "q1",
    text: "What brings you in today? Tell me in your own words.",
    chips: ["Fever", "Chest discomfort", "Cough", "Body pain"],
    allowFreeText: true,
  },
  {
    id: "q2",
    text: "How many days has this been going on?",
    chips: ["Today only", "2–3 days", "About a week", "More than a month"],
  },
  {
    id: "q3",
    text: "Is it constant, or does it come and go?",
    chips: ["Constant", "Comes and goes", "Not sure"],
  },
  {
    id: "q4",
    text: "Any of these along with it — breathlessness, sweating, or dizziness?",
    chips: ["Breathlessness", "Sweating", "Dizziness", "None of these"],
  },
  {
    id: "q5",
    text: "Are you taking any regular medicines — for sugar, blood pressure, thyroid?",
    chips: ["Diabetes medicine", "BP medicine", "Thyroid medicine", "No regular medicine"],
    allowFreeText: true,
  },
  {
    id: "q6",
    text: "Anything else you would like the doctor to know?",
    chips: ["Nothing else", "Describe"],
    allowFreeText: true,
  },
];

/** Builds the next question, visibly referring back to the previous answer. */
export async function getNextQuestion(
  answers: SymptomEntry[],
): Promise<InterviewQuestion | null> {
  await wait(900 + Math.random() * 700);
  const next = SCRIPT[answers.length];
  if (!next) return null;
  const last = answers[answers.length - 1];
  if (!last) return next;
  const echo = last.answer.toLowerCase().replace(/\.$/, "");
  return { ...next, text: `You mentioned ${echo} — ${lowerFirst(next.text)}` };
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const TRANSCRIPT_SAMPLES = [
  "I have had fever for about three days now, mostly in the evening",
  "There is a heaviness in my chest when I walk",
  "I feel very weak and tired since two days",
  "My sugar reading was high this morning",
];

/** Streams a fake transcript word by word, like a live STT socket. */
export async function transcribeSpeech(
  onPartial: (text: string) => void,
  seed = Math.floor(Math.random() * TRANSCRIPT_SAMPLES.length),
): Promise<string> {
  const full = TRANSCRIPT_SAMPLES[seed % TRANSCRIPT_SAMPLES.length] ?? "";
  const words = full.split(" ");
  let acc = "";
  for (const w of words) {
    await wait(150 + Math.random() * 120);
    acc = acc ? `${acc} ${w}` : w;
    onPartial(acc);
  }
  await wait(300);
  return acc;
}

const OCR_TEMPLATES = {
  lab: [
    { label: "Glucose (fasting)", value: "180 mg/dL", flagged: true, x: 58, y: 30 },
    { label: "HbA1c", value: "8.9 %", flagged: true, x: 58, y: 44 },
    { label: "Haemoglobin", value: "12.4 g/dL", x: 58, y: 58 },
    { label: "Collected on", value: "31 Aug 2026", x: 28, y: 16 },
  ],
  rx: [
    { label: "Metformin", value: "1000 mg BD", x: 42, y: 34 },
    { label: "Telmisartan", value: "40 mg OD", x: 42, y: 50 },
    { label: "Prescriber", value: "Dr. A. Nair, MD", x: 34, y: 18 },
  ],
} satisfies Record<string, ExtractedField[]>;

/** Simulated OCR + field extraction on an uploaded document. */
export async function extractReport(fileName: string): Promise<ReportDoc> {
  await wait(1800 + Math.random() * 900);
  const isRx = /rx|prescription|presc/i.test(fileName);
  return {
    id: `R-${Math.floor(Math.random() * 9000) + 1000}`,
    title: fileName.replace(/\.[a-z]+$/i, ""),
    kind: isRx ? "Prescription" : "Lab report",
    uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    fields: isRx ? OCR_TEMPLATES.rx : OCR_TEMPLATES.lab,
  };
}

const RED_FLAG_RULES: { match: RegExp[]; flag: RedFlag }[] = [
  {
    match: [/chest/i, /(breathless|sweat|arm)/i],
    flag: {
      title: "Possible acute coronary syndrome pattern",
      trigger: "Chest discomfort reported together with sweating, breathlessness or arm radiation.",
      recommendation: "Prioritise for immediate physician review, ECG and troponin.",
    },
  },
  {
    match: [/fever/i, /(sugar|diabet|180|300|glucose)/i],
    flag: {
      title: "Fever with poor glycaemic control",
      trigger: "Persistent fever reported alongside diabetes or raised glucose values.",
      recommendation: "Prioritise infection screen and glucose panel.",
    },
  },
  {
    match: [/(dizzi|faint)/i, /(bp|pressure|breathless)/i],
    flag: {
      title: "Dizziness with cardiovascular history",
      trigger: "Dizziness or fainting reported with blood-pressure medication or breathlessness.",
      recommendation: "Check postural vitals before consultation.",
    },
  },
];

export async function detectRedFlags(text: string): Promise<RedFlag[]> {
  await wait(700);
  return RED_FLAG_RULES.filter((r) => r.match.every((m) => m.test(text))).map((r) => r.flag);
}

export interface GeneratedIntake {
  aiSummary: AiSummary;
  redFlags: RedFlag[];
  urgency: Urgency;
  timelineEvents: TimelineEvent[];
}

/** Assembles the clinical summary from everything captured during intake. */
export async function generateSummary(input: {
  patientInfo: PatientInfo;
  symptoms: SymptomEntry[];
  reports: ReportDoc[];
}): Promise<GeneratedIntake> {
  const blob = [
    ...input.symptoms.map((s) => s.answer),
    ...input.reports.flatMap((r) => r.fields.map((f) => `${f.label} ${f.value}`)),
  ].join(" | ");

  const redFlags = await detectRedFlags(blob);
  await wait(1500);

  const first = input.symptoms[0]?.answer ?? "Not stated";
  const duration = input.symptoms[1]?.answer ?? "Not stated";
  const associated = input.symptoms
    .slice(2)
    .map((s) => s.answer)
    .filter((a) => a && !/^none/i.test(a))
    .slice(0, 4);
  const meds = input.symptoms
    .filter((s) => /medicine/i.test(s.question))
    .map((s) => s.answer)
    .filter((a) => !/^no regular/i.test(a));

  const urgency: Urgency = redFlags.length ? "red-flag" : associated.length > 2 ? "priority" : "normal";

  return {
    redFlags,
    urgency,
    aiSummary: {
      chiefComplaint: first,
      associatedSymptoms: associated.length ? associated : ["None volunteered"],
      duration,
      pastHistory: meds.length ? meds.map((m) => `Reported: ${m}`) : ["No chronic illness volunteered"],
      currentMedication: meds.length ? meds : ["None reported"],
      oneLiner: `${input.patientInfo.age}${input.patientInfo.sex[0]} — ${first.slice(0, 70)}`,
      confidence: 0.78 + Math.random() * 0.15,
    },
    timelineEvents: [
      {
        id: "new-1",
        date: "Today",
        label: "Self-reported intake completed",
        detail: first,
        kind: "visit",
        severity: redFlags.length ? "high" : "low",
      },
      ...input.reports.map((r, i) => ({
        id: `new-report-${i}`,
        date: "Today",
        label: `${r.kind} uploaded`,
        detail: r.fields.map((f) => `${f.label}: ${f.value}`).join(", "),
        kind: "lab" as const,
        severity: r.fields.some((f) => f.flagged) ? ("medium" as const) : ("low" as const),
      })),
    ],
  };
}
