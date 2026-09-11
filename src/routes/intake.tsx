import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Hand,
  Keyboard,
  Languages,
  Loader2,
  Mic,
  ShieldCheck,
} from "lucide-react";
import { AdaptiveQuestionCard, ThinkingBubble } from "@/components/medivoice/AdaptiveQuestionCard";
import { ReportUploader } from "@/components/medivoice/ReportUploader";
import { VoiceCapture } from "@/components/medivoice/VoiceCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getNextQuestion, generateSummary, type InterviewQuestion } from "@/lib/medivoice/mockApi";
import { addRecord, getRecords } from "@/lib/medivoice/store";
import type { PatientRecord, ReportDoc, SymptomEntry } from "@/lib/medivoice/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Patient intake — MediVoice kiosk" },
      {
        name: "description",
        content:
          "Answer a few adaptive questions by voice, touch or text and add your reports. MediVoice prepares a summary for your doctor.",
      },
      { property: "og:title", content: "Patient intake — MediVoice kiosk" },
      {
        property: "og:description",
        content: "Voice-first, accessible patient intake with adaptive questions and report upload.",
      },
    ],
  }),
  component: IntakePage,
});

type Step = "welcome" | "details" | "interview" | "reports" | "review" | "done";
const STEP_INDEX: Record<Step, number> = { welcome: 0, details: 1, interview: 2, reports: 3, review: 4, done: 5 };
const LANGUAGES = ["English", "हिन्दी", "தமிழ்", "മലയാളം", "मराठी"];
const WELCOME_COPY: Record<string, { title: string; description: string; speak: string }> = {
  English: { title: "Let's get you ready for the doctor", description: "It takes about two minutes. You can speak, tap, or type — whatever is easiest right now.", speak: "Speak to begin" },
  "हिन्दी": { title: "डॉक्टर से मिलने की तैयारी करें", description: "इसमें लगभग दो मिनट लगेंगे। आप बोलकर, टैप करके या लिखकर उत्तर दे सकते हैं।", speak: "बोलकर शुरू करें" },
  "தமிழ்": { title: "மருத்துவரைச் சந்திக்கத் தயாராகலாம்", description: "இதற்கு சுமார் இரண்டு நிமிடங்கள் ஆகும். பேசலாம், தட்டலாம் அல்லது தட்டச்சு செய்யலாம்.", speak: "பேசத் தொடங்குங்கள்" },
  "മലയാളം": { title: "ഡോക്ടറെ കാണാൻ തയ്യാറാകാം", description: "ഇതിന് ഏകദേശം രണ്ട് മിനിറ്റ് മതി. സംസാരിച്ചോ, അമർത്തിയോ, ടൈപ്പ് ചെയ്തോ ഉത്തരം നൽകാം.", speak: "സംസാരിച്ച് തുടങ്ങൂ" },
  "मराठी": { title: "डॉक्टरांना भेटण्यासाठी तयारी करूया", description: "यासाठी सुमारे दोन मिनिटे लागतील. तुम्ही बोलून, टॅप करून किंवा टाइप करून उत्तर देऊ शकता.", speak: "बोलून सुरू करा" },
};

function IntakePage() {
  const [step, setStep] = useState<Step>("welcome");
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState<"voice" | "text" | "touch">("voice");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"Male" | "Female" | "Other">("Female");
  const [abha, setAbha] = useState("");
  const [answers, setAnswers] = useState<SymptomEntry[]>([]);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [thinking, setThinking] = useState(false);
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ record: PatientRecord; queuePosition: number } | null>(null);
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const welcomeCopy = WELCOME_COPY[language] ?? WELCOME_COPY["English"];

  const stepNumber = Math.min(STEP_INDEX[step] + 1, 5);

  useEffect(() => {
    if (step !== "interview" || question || thinking || answers.length >= 6) return;
    setThinking(true);
    void getNextQuestion(answers, language).then((q) => {
      setQuestion(q);
      setThinking(false);
    });
  }, [step, question, thinking, answers, language]);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [answers.length, thinking, question]);

  function record(answer: string) {
    setAnswers((prev) => [
      ...prev,
      {
        question: question?.text ?? "",
        answer,
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setQuestion(null);
  }

  async function submit() {
    setSubmitting(true);
    const patientInfo = {
      id: `P-${Math.floor(Math.random() * 9000) + 10500}`,
      name: name.trim() || "Walk-in patient",
      age: Number(age) || 40,
      sex,
      abhaId: abha.trim() || "Not linked",
      language,
    };
    const generated = await generateSummary({ patientInfo, symptoms: answers, reports });
    const rec: PatientRecord = {
      patientInfo,
      arrivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      urgency: generated.urgency,
      reviewed: false,
      viewed: false,
      symptoms: answers,
      history: [],
      medications: [],
      reports,
      timelineEvents: generated.timelineEvents,
      aiSummary: generated.aiSummary,
      redFlags: generated.redFlags,
    };
    addRecord(rec);
    setSubmitted({ record: rec, queuePosition: getRecords().filter((r) => !r.reviewed).length });
    setSubmitting(false);
    setStep("done");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      {step !== "welcome" && step !== "done" && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">Step {stepNumber} of 5</span>
            <span className="text-muted-foreground">{language}</span>
          </div>
          <Progress value={(stepNumber / 5) * 100} className="h-2" />
        </div>
      )}

      {step === "welcome" && (
        <section className="animate-rise text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" aria-hidden /> Private · shared only with your doctor
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
            {welcomeCopy?.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-kiosk text-surface-foreground">
            {welcomeCopy?.description}
          </p>

          <button
            type="button"
            onClick={() => {
              setMode("voice");
              setStep("details");
            }}
            className="mx-auto mt-8 grid size-36 animate-breathe place-items-center rounded-full bg-primary text-primary-foreground shadow-clinical transition-colors hover:bg-primary/90"
          >
            <Mic className="size-12" strokeWidth={1.8} aria-hidden />
            <span className="mt-1 text-sm font-semibold">{welcomeCopy?.speak}</span>
          </button>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setMode("text");
                setStep("details");
              }}
            >
              <Keyboard className="size-4" aria-hidden /> Type instead
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setMode("touch");
                setStep("details");
              }}
            >
              <Hand className="size-4" aria-hidden /> Tap options
            </Button>
          </div>

          <fieldset className="mt-10 rounded-2xl border bg-card p-4 text-left">
            <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
              <Languages className="size-4 text-primary" aria-hidden /> Language
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  aria-pressed={language === l}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-base font-medium transition-colors",
                    language === l
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      )}

      {step === "details" && (
        <section className="animate-rise space-y-5">
          <h1 className="text-2xl font-bold tracking-tight">Your details</h1>
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" placeholder="e.g. Sunita Devi" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-base">Age</Label>
                <Input id="age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} className="h-12 text-base" placeholder="46" />
              </div>
              <div className="space-y-2">
                <span className="text-base font-medium">Sex</span>
                <div className="flex gap-2">
                  {(["Female", "Male", "Other"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      aria-pressed={sex === s}
                      className={cn(
                        "h-12 flex-1 rounded-lg border text-base font-medium transition-colors",
                        sex === s ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="abha" className="text-base">ABHA / health ID <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="abha" value={abha} onChange={(e) => setAbha(e.target.value)} className="h-12 text-base" placeholder="12-3456-7890-1234" />
              <p className="text-xs text-muted-foreground">ABDM-ready — this field is not yet connected to a live registry.</p>
            </div>
          </div>
          <StepNav onBack={() => setStep("welcome")} onNext={() => setStep("interview")} nextLabel="Start the questions" />
        </section>
      )}

      {step === "interview" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">A few questions about how you feel</h1>

          <div className="max-h-[22rem] space-y-3 overflow-y-auto rounded-2xl border bg-surface p-4">
            {answers.length === 0 && !thinking && !question && (
              <p className="text-sm text-muted-foreground">Your answers will appear here.</p>
            )}
            {answers.map((a, i) => (
              <div key={i} className="animate-rise space-y-2">
                {a.question && (
                  <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card px-4 py-2 text-sm shadow-panel">
                    {a.question}
                  </p>
                )}
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-base text-primary-foreground">
                  {a.answer}
                </p>
              </div>
            ))}
            {thinking && <ThinkingBubble />}
            <div ref={transcriptEnd} />
          </div>

          {question && <AdaptiveQuestionCard question={question} onAnswer={record} busy={thinking} language={language} />}

          {question && mode !== "touch" && (
            <VoiceCapture onTranscript={record} seed={answers.length} disabled={thinking} language={language} />
          )}

          {!question && !thinking && (
            <div className="animate-rise rounded-2xl border bg-card p-5 text-center">
              <CheckCircle2 className="mx-auto size-8 text-ok" aria-hidden />
              <p className="mt-2 text-kiosk font-medium">That's everything we need to ask.</p>
              <StepNav className="mt-5" onBack={() => setStep("details")} onNext={() => setStep("reports")} nextLabel="Add reports" />
            </div>
          )}
        </section>
      )}

      {step === "reports" && (
        <section className="animate-rise space-y-5">
          <h1 className="text-2xl font-bold tracking-tight">Your prescriptions and reports</h1>
          <ReportUploader reports={reports} onExtracted={(r) => setReports((p) => [...p, r])} />
          <StepNav
            onBack={() => setStep("interview")}
            onNext={() => setStep("review")}
            nextLabel={reports.length ? "Review my answers" : "Skip for now"}
          />
        </section>
      )}

      {step === "review" && (
        <section className="animate-rise space-y-5">
          <h1 className="text-2xl font-bold tracking-tight">Please check before we send it</h1>
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">About you</h2>
            <p className="mt-1 text-kiosk">
              {name || "Walk-in patient"} · {age || "—"} years · {sex} · {abha || "ABHA not linked"}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep("details")}>
              Correct my details
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What you told us</h2>
            <ul className="mt-2 space-y-3">
              {answers.map((a, i) => (
                <li key={i} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <p className="text-sm text-muted-foreground">{a.question}</p>
                  <p className="text-kiosk font-medium">{a.answer}</p>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setAnswers([]);
                setQuestion(null);
                setStep("interview");
              }}
            >
              Answer again
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Documents</h2>
            {reports.length ? (
              <ul className="mt-2 space-y-1 text-kiosk">
                {reports.map((r) => (
                  <li key={r.id}>
                    {r.title} — {r.fields.length} values read
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-kiosk text-muted-foreground">None added.</p>
            )}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep("reports")}>
              Add or change documents
            </Button>
          </div>

          <p className="rounded-xl border bg-surface px-4 py-3 text-sm text-surface-foreground">
            MediVoice prepares a summary for your doctor to review. It does not diagnose or prescribe.
          </p>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" size="lg" onClick={() => setStep("reports")}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
            <Button size="lg" onClick={() => void submit()} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {submitting ? "Preparing your summary…" : "Send to my doctor"}
            </Button>
          </div>
        </section>
      )}

      {step === "done" && submitted && (
        <section className="animate-rise space-y-6 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-ok-soft text-ok">
            <CheckCircle2 className="size-10" strokeWidth={1.8} aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your information has been sent to Dr. Anitha Rao</h1>
            <p className="mx-auto mt-3 max-w-md text-kiosk text-surface-foreground">
              You can sit and rest. The doctor will already know your story when you walk in.
            </p>
          </div>
          <dl className="mx-auto grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Queue position</dt>
              <dd className="text-2xl font-bold">{submitted.queuePosition}</dd>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Estimated wait</dt>
              <dd className="text-2xl font-bold">~{submitted.queuePosition * 7} min</dd>
            </div>
          </dl>
          <Button asChild variant="outline" size="lg">
            <Link to="/doctor/$patientId" params={{ patientId: submitted.record.patientInfo.id }}>
              View how the doctor sees it <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </section>
      )}
    </main>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
  className,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <Button variant="ghost" size="lg" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Button>
      <Button size="lg" onClick={onNext}>
        {nextLabel} <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
