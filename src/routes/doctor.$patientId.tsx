import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  NotebookPen,
  Pencil,
  PlugZap,
} from "lucide-react";
import { HealthTimeline } from "@/components/medivoice/HealthTimeline";
import { PatientSummaryPanel } from "@/components/medivoice/PatientSummaryPanel";
import { RedFlagBanner } from "@/components/medivoice/RedFlagBanner";
import { ReportViewer } from "@/components/medivoice/ReportViewer";
import { UrgencyBadge } from "@/components/medivoice/UrgencyBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateRecord, useRecord } from "@/lib/medivoice/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/$patientId")({
  head: () => ({
    meta: [
      { title: "Patient detail — MediVoice doctor dashboard" },
      {
        name: "description",
        content:
          "AI clinical summary, red-flag alerts, health timeline, OCR-extracted reports and the full intake transcript for one patient.",
      },
      { property: "og:title", content: "Patient detail — MediVoice doctor dashboard" },
      {
        property: "og:description",
        content: "One patient, one screen: summary, red flags, timeline, reports and transcript.",
      },
    ],
  }),
  component: PatientDetail,
});

function Panel({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-surface px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {aside}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function PatientDetail() {
  const { patientId } = Route.useParams();
  const record = useRecord(patientId);
  const [openReport, setOpenReport] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [approved, setApproved] = useState(false);

  if (!record) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Patient record not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This intake may have been cleared from the demo queue.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/doctor">Back to queue</Link>
        </Button>
      </main>
    );
  }

  const { patientInfo, aiSummary, redFlags, timelineEvents, reports, symptoms, history, medications } = record;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/doctor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Queue
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{patientInfo.name}</h1>
          <p className="text-sm text-muted-foreground">
            {patientInfo.age} y · {patientInfo.sex} · {patientInfo.id} · ABHA {patientInfo.abhaId} · arrived{" "}
            {record.arrivedAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={record.urgency} />
          {record.reviewed && (
            <span className="rounded-full border border-ok/30 bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok">
              Marked reviewed
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <RedFlagBanner flags={redFlags} />
          <PatientSummaryPanel summary={aiSummary} />

          <Panel title="Health timeline" aside={<span className="text-xs text-muted-foreground">Select a point for detail</span>}>
            <HealthTimeline events={timelineEvents} />
          </Panel>

          <Panel title={`Uploaded reports (${reports.length})`}>
            {reports.length === 0 ? (
              <p className="rounded-lg border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
                No documents uploaded during intake.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {reports.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setOpenReport(openReport === r.id ? null : r.id)}
                      aria-expanded={openReport === r.id}
                      className={cn(
                        "flex w-44 flex-col items-start gap-1 rounded-lg border bg-surface p-3 text-left transition-colors hover:border-primary/40",
                        openReport === r.id && "border-primary bg-primary-soft",
                      )}
                    >
                      <FileText className="size-4 text-primary" aria-hidden />
                      <span className="line-clamp-2 text-sm font-medium">{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.kind} · {r.fields.length} fields
                        {r.fields.some((f) => f.flagged) ? " · flagged" : ""}
                      </span>
                    </button>
                  ))}
                </div>
                {reports
                  .filter((r) => r.id === openReport)
                  .map((r) => (
                    <ReportViewer key={r.id} report={r} className="animate-rise" />
                  ))}
              </div>
            )}
          </Panel>

          <section className="overflow-hidden rounded-xl border bg-card shadow-panel">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              aria-expanded={showTranscript}
              className="flex w-full items-center justify-between gap-2 border-b bg-surface px-4 py-2.5 text-left"
            >
              <h2 className="text-sm font-semibold tracking-tight">
                Full conversation transcript ({symptoms.length} turns)
              </h2>
              <ChevronDown className={cn("size-4 transition-transform", showTranscript && "rotate-180")} aria-hidden />
            </button>
            {showTranscript && (
              <ol className="animate-rise divide-y">
                {symptoms.map((s, i) => (
                  <li key={i} className="px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {s.at} · AI: {s.question}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">Patient: {s.answer}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Panel title="Actions">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setApproved(true)} disabled={approved}>
                <Check className="size-4" aria-hidden /> {approved ? "Summary approved" : "Approve summary"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTranscript(true)}>
                <Pencil className="size-4" aria-hidden /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateRecord(patientInfo.id, { reviewed: true })}
                disabled={record.reviewed}
              >
                Mark reviewed
              </Button>
            </div>
            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                setNotes((p) => [...p, note.trim()]);
                setNote("");
              }}
            >
              <label htmlFor="note" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <NotebookPen className="size-3.5" aria-hidden /> Add note
              </label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Clinical note for this visit…"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={!note.trim()}>
                Save note
              </Button>
            </form>
            {notes.length > 0 && (
              <ul className="mt-3 space-y-2">
                {notes.map((n, i) => (
                  <li key={i} className="animate-rise rounded-lg border bg-surface px-3 py-2 text-sm">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Known history">
            {history.length ? (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.condition} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{h.condition}</span>
                    <span className="text-xs text-muted-foreground">
                      {h.since} · {h.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No linked history — first visit on this system.</p>
            )}
          </Panel>

          <Panel title="Current medication">
            {medications.length ? (
              <ul className="space-y-2 text-sm">
                {medications.map((m) => (
                  <li key={m.name}>
                    <span className="font-medium">{m.name}</span> {m.dose} —{" "}
                    <span className="text-muted-foreground">{m.frequency}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Self-reported only; see summary panel.</p>
            )}
          </Panel>

          <Panel title="ABDM status">
            <p className="flex items-start gap-2 text-sm text-surface-foreground">
              <PlugZap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              Record shape is ABDM-aligned and health-ID capture is in place.
            </p>
            <span className="mt-3 inline-block rounded-full border border-warn/35 bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn-foreground">
              ABDM-ready — not yet connected
            </span>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
