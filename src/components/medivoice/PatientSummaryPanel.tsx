import { ClipboardList, Info } from "lucide-react";
import type { AiSummary } from "@/lib/medivoice/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-foreground">{children}</dd>
    </div>
  );
}

export function PatientSummaryPanel({ summary }: { summary: AiSummary }) {
  return (
    <section aria-label="AI clinical summary" className="overflow-hidden rounded-xl border bg-card shadow-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-surface px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ClipboardList className="size-4 text-primary" strokeWidth={2.1} aria-hidden />
          AI-assisted summary — for physician review
        </h2>
        <span className="rounded-full border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Model confidence {(summary.confidence * 100).toFixed(0)}%
        </span>
      </header>

      <dl>
        <Row label="Chief complaint">{summary.chiefComplaint}</Row>
        <Row label="Associated symptoms">
          <ul className="flex flex-wrap gap-1.5">
            {summary.associatedSymptoms.map((s) => (
              <li key={s} className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {s}
              </li>
            ))}
          </ul>
        </Row>
        <Row label="Duration">{summary.duration}</Row>
        <Row label="Past history">{summary.pastHistory.join(" · ")}</Row>
        <Row label="Current medication">{summary.currentMedication.join(" · ")}</Row>
      </dl>

      <p className="flex items-start gap-2 border-t bg-surface px-4 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Generated from patient-reported answers and uploaded documents. Screening support only — not a
        diagnosis.
      </p>
    </section>
  );
}
