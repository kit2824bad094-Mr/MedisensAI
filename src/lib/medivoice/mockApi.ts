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

const LOCALIZED_SCRIPTS: Record<string, InterviewQuestion[]> = {
  "हिन्दी": [
    { id: "q1", text: "आज आपको क्या परेशानी है? अपने शब्दों में बताइए।", chips: ["बुखार", "सीने में तकलीफ़", "खाँसी", "शरीर में दर्द"], allowFreeText: true },
    { id: "q2", text: "यह परेशानी कितने दिनों से है?", chips: ["आज से", "2–3 दिन", "लगभग एक सप्ताह", "एक महीने से अधिक"] },
    { id: "q3", text: "यह लगातार रहती है या आती-जाती है?", chips: ["लगातार", "आती-जाती है", "पता नहीं"] },
    { id: "q4", text: "क्या साथ में साँस फूलना, पसीना या चक्कर भी है?", chips: ["साँस फूलना", "पसीना", "चक्कर", "इनमें से कोई नहीं"] },
    { id: "q5", text: "क्या आप शुगर, ब्लड प्रेशर या थायरॉइड की कोई नियमित दवा लेते हैं?", chips: ["शुगर की दवा", "बीपी की दवा", "थायरॉइड की दवा", "कोई नियमित दवा नहीं"], allowFreeText: true },
    { id: "q6", text: "क्या आप डॉक्टर को कुछ और बताना चाहेंगे?", chips: ["और कुछ नहीं", "विस्तार से बताएँ"], allowFreeText: true },
  ],
  "தமிழ்": [
    { id: "q1", text: "இன்று உங்களுக்கு என்ன பிரச்சனை? உங்கள் சொந்த வார்த்தைகளில் சொல்லுங்கள்.", chips: ["காய்ச்சல்", "நெஞ்சு அசௌகரியம்", "இருமல்", "உடல் வலி"], allowFreeText: true },
    { id: "q2", text: "இது எத்தனை நாட்களாக இருக்கிறது?", chips: ["இன்று மட்டும்", "2–3 நாட்கள்", "சுமார் ஒரு வாரம்", "ஒரு மாதத்திற்கும் மேல்"] },
    { id: "q3", text: "இது தொடர்ந்து இருக்கிறதா, அல்லது விட்டுவிட்டு வருகிறதா?", chips: ["தொடர்ந்து", "விட்டுவிட்டு வருகிறது", "தெரியவில்லை"] },
    { id: "q4", text: "மூச்சுத்திணறல், வியர்வை அல்லது தலைச்சுற்றல் உள்ளதா?", chips: ["மூச்சுத்திணறல்", "வியர்வை", "தலைச்சுற்றல்", "எதுவும் இல்லை"] },
    { id: "q5", text: "சர்க்கரை, இரத்த அழுத்தம் அல்லது தைராய்டுக்கு வழக்கமான மருந்து எடுக்கிறீர்களா?", chips: ["சர்க்கரை மருந்து", "இரத்த அழுத்த மருந்து", "தைராய்டு மருந்து", "வழக்கமான மருந்து இல்லை"], allowFreeText: true },
    { id: "q6", text: "மருத்துவரிடம் வேறு ஏதாவது சொல்ல விரும்புகிறீர்களா?", chips: ["வேறு எதுவும் இல்லை", "விவரிக்கவும்"], allowFreeText: true },
  ],
  "മലയാളം": [
    { id: "q1", text: "ഇന്ന് എന്താണ് ബുദ്ധിമുട്ട്? നിങ്ങളുടെ സ്വന്തം വാക്കുകളിൽ പറയൂ.", chips: ["പനി", "നെഞ്ചിലെ അസ്വസ്ഥത", "ചുമ", "ശരീരവേദന"], allowFreeText: true },
    { id: "q2", text: "ഇത് എത്ര ദിവസമായി തുടരുന്നു?", chips: ["ഇന്ന് മാത്രം", "2–3 ദിവസം", "ഏകദേശം ഒരാഴ്ച", "ഒരു മാസത്തിലധികം"] },
    { id: "q3", text: "ഇത് തുടർച്ചയായാണോ, ഇടയ്ക്കിടെ വരുന്നതാണോ?", chips: ["തുടർച്ചയായി", "ഇടയ്ക്കിടെ", "ഉറപ്പില്ല"] },
    { id: "q4", text: "ശ്വാസംമുട്ടൽ, വിയർപ്പ്, തലകറക്കം എന്നിവയുണ്ടോ?", chips: ["ശ്വാസംമുട്ടൽ", "വിയർപ്പ്", "തലകറക്കം", "ഇവയൊന്നുമില്ല"] },
    { id: "q5", text: "ഷുഗർ, രക്തസമ്മർദ്ദം, തൈറോയ്ഡ് എന്നിവയ്ക്ക് പതിവായി മരുന്ന് കഴിക്കുന്നുണ്ടോ?", chips: ["ഷുഗർ മരുന്ന്", "ബിപി മരുന്ന്", "തൈറോയ്ഡ് മരുന്ന്", "പതിവ് മരുന്നില്ല"], allowFreeText: true },
    { id: "q6", text: "ഡോക്ടറോട് മറ്റെന്തെങ്കിലും പറയാനുണ്ടോ?", chips: ["മറ്റൊന്നുമില്ല", "വിവരിക്കുക"], allowFreeText: true },
  ],
  "मराठी": [
    { id: "q1", text: "आज तुम्हाला काय त्रास होत आहे? तुमच्या शब्दांत सांगा.", chips: ["ताप", "छातीत त्रास", "खोकला", "अंगदुखी"], allowFreeText: true },
    { id: "q2", text: "हा त्रास किती दिवसांपासून आहे?", chips: ["आजपासून", "2–3 दिवस", "सुमारे एक आठवडा", "एका महिन्यापेक्षा जास्त"] },
    { id: "q3", text: "हा त्रास सतत असतो की येतो-जाता?", chips: ["सतत", "येतो-जाता", "माहीत नाही"] },
    { id: "q4", text: "यासोबत धाप लागणे, घाम येणे किंवा चक्कर येते का?", chips: ["धाप लागते", "घाम येतो", "चक्कर येते", "यापैकी काहीही नाही"] },
    { id: "q5", text: "तुम्ही शुगर, रक्तदाब किंवा थायरॉइडची नियमित औषधे घेता का?", chips: ["शुगरचे औषध", "बीपीचे औषध", "थायरॉइडचे औषध", "नियमित औषध नाही"], allowFreeText: true },
    { id: "q6", text: "डॉक्टरांना आणखी काही सांगायचे आहे का?", chips: ["आणखी काही नाही", "सविस्तर सांगा"], allowFreeText: true },
  ],
};

/** Builds the next question, visibly referring back to the previous answer. */
export async function getNextQuestion(
  answers: SymptomEntry[],
  language = "English",
): Promise<InterviewQuestion | null> {
  await wait(900 + Math.random() * 700);
  const script = LOCALIZED_SCRIPTS[language] ?? SCRIPT;
  const next = script[answers.length];
  if (!next) return null;
  const last = answers[answers.length - 1];
  if (!last) return next;
  const echo = last.answer.toLowerCase().replace(/\.$/, "");
  const prefixes: Record<string, string> = {
    "हिन्दी": `आपने ${echo} बताया — `,
    "தமிழ்": `${echo} என்று சொன்னீர்கள் — `,
    "മലയാളം": `${echo} എന്ന് പറഞ്ഞു — `,
    "मराठी": `तुम्ही ${echo} सांगितले — `,
  };
  return { ...next, text: `${prefixes[language] ?? `You mentioned ${echo} — `}${language === "English" ? lowerFirst(next.text) : next.text}` };
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const TRANSCRIPT_SAMPLES: Record<string, string[]> = {
  English: [
  "I have had fever for about three days now, mostly in the evening",
  "There is a heaviness in my chest when I walk",
  "I feel very weak and tired since two days",
  "My sugar reading was high this morning",
  ],
  "हिन्दी": ["मुझे तीन दिनों से बुखार है, ज़्यादातर शाम को", "चलते समय मेरे सीने में भारीपन होता है"],
  "தமிழ்": ["மூன்று நாட்களாக மாலையில் காய்ச்சல் வருகிறது", "நடக்கும்போது நெஞ்சில் கனமாக இருக்கிறது"],
  "മലയാളം": ["മൂന്ന് ദിവസമായി വൈകുന്നേരങ്ങളിൽ പനിയുണ്ട്", "നടക്കുമ്പോൾ നെഞ്ചിൽ ഭാരം തോന്നുന്നു"],
  "मराठी": ["मला तीन दिवसांपासून संध्याकाळी ताप येतो", "चालताना छातीत जडपणा जाणवतो"],
};

/** Streams a fake transcript word by word, like a live STT socket. */
export async function transcribeSpeech(
  onPartial: (text: string) => void,
  seed = 0,
  language = "English",
): Promise<string> {
  const samples = TRANSCRIPT_SAMPLES[language] ?? TRANSCRIPT_SAMPLES.English ?? [];
  const full = samples[seed % samples.length] ?? "";
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
