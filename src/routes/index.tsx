import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  FileScan,
  Mic,
  MessagesSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import heroImage from "@/assets/hero-clinical.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediVoice — AI patient intake before the consultation" },
      {
        name: "description",
        content:
          "Voice-first patient intake, adaptive symptom questions, report OCR and red-flag screening — delivered to the doctor as one reviewable clinical summary.",
      },
      { property: "og:title", content: "MediVoice — AI patient intake before the consultation" },
      {
        property: "og:description",
        content:
          "Voice, touch or text intake plus report OCR turned into a structured, physician-reviewed clinical summary.",
      },
    ],
  }),
  component: Landing,
});

const PIPELINE = [
  { Icon: Mic, title: "Voice", text: "Patient speaks in their own words; live transcript on screen." },
  { Icon: MessagesSquare, title: "AI questions", text: "Each question adapts to the previous answer." },
  { Icon: FileScan, title: "Report OCR", text: "Lab values and prescriptions read into structured fields." },
  { Icon: AlertTriangle, title: "Risk alert", text: "Symptom combinations raise an explicit red flag." },
  { Icon: ClipboardList, title: "Summary", text: "Chief complaint, duration, history, medication." },
  { Icon: Stethoscope, title: "Doctor", text: "Scannable panel, timeline and raw transcript on demand." },
];

function Landing() {
  return (
    <main>
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" aria-hidden /> Screening &amp; pre-consultation support
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              The consultation starts before the doctor says hello.
            </h1>
            <p className="mt-4 max-w-prose text-lg leading-relaxed text-surface-foreground">
              MediVoice interviews the patient by voice, touch or text, reads their uploaded reports, and hands
              the physician one structured clinical summary — with red flags surfaced, never diagnoses made.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/intake">
                  <Mic className="size-4" aria-hidden /> Start patient intake
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/doctor">
                  <Stethoscope className="size-4" aria-hidden /> Open doctor dashboard
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo build with mocked AI services. Every output is framed as an AI-assisted summary for
              physician review.
            </p>
          </div>

          <img
            src={heroImage}
            alt="Illustration of a clinician reviewing a patient summary alongside uploaded documents"
            width={1400}
            height={1000}
            className="w-full rounded-2xl border bg-surface shadow-clinical"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">How the pipeline works</h2>
        <p className="mt-2 max-w-prose text-surface-foreground">
          Six stages, each one a drop-in point for a real service — Whisper, an LLM interview engine,
          Tesseract/Document AI, a triage rule set and a summariser.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map(({ Icon, title, text }, i) => (
            <li
              key={title}
              className="animate-rise rounded-xl border bg-card p-5 shadow-panel"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-4.5" strokeWidth={2} aria-hidden />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Stage {i + 1}
                </span>
              </div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-surface-foreground">{text}</p>
              <div
                className="mt-4 h-1 rounded-full bg-gradient-to-r from-primary/60 to-primary/10 animate-draw"
                style={{ animationDelay: `${i * 70 + 150}ms` }}
              />
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t bg-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-12 md:grid-cols-2">
          <article className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold tracking-tight">For the patient</h2>
            <p className="mt-2 text-surface-foreground">
              Large type, big tap targets, quick-reply chips and a language selector. No form fatigue —
              one question at a time, in plain language, with a review step before anything is sent.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/intake">Try the kiosk flow</Link>
            </Button>
          </article>
          <article className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold tracking-tight">For the doctor</h2>
            <p className="mt-2 text-surface-foreground">
              A triaged queue with one-line AI summaries, a 10-second summary panel, a health timeline,
              OCR-overlaid reports and the full transcript when it's needed.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/doctor">See the queue</Link>
            </Button>
          </article>
        </div>
      </section>

      <footer className="border-t px-4 py-8 text-center text-xs text-muted-foreground">
        MediVoice · ABDM-ready, not yet connected · Screening support tool, not a diagnostic device.
      </footer>
    </main>
  );
}
