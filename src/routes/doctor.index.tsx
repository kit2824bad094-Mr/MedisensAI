import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Eye, EyeOff, PlugZap, Users } from "lucide-react";
import { UrgencyBadge } from "@/components/medivoice/UrgencyBadge";
import { updateRecord, useRecords } from "@/lib/medivoice/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/")({
  head: () => ({
    meta: [
      { title: "Patient queue — MediVoice doctor dashboard" },
      {
        name: "description",
        content:
          "Triaged patient queue with one-line AI summaries and urgency badges, ready for physician review before each consultation.",
      },
      { property: "og:title", content: "Patient queue — MediVoice doctor dashboard" },
      {
        property: "og:description",
        content: "Waiting patients, AI one-liners and red-flag badges in one clinical view.",
      },
    ],
  }),
  component: DoctorQueue,
});

const ORDER = { "red-flag": 0, priority: 1, normal: 2 } as const;

function DoctorQueue() {
  const records = useRecords();
  const waiting = [...records].sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency]);
  const flags = records.filter((r) => r.urgency === "red-flag").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patient queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dr. Anitha Rao · General Medicine · AI-assisted summaries, pending your review.
          </p>
        </div>
        <dl className="flex gap-3 text-sm">
          <div className="rounded-lg border bg-card px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" aria-hidden /> Waiting
            </dt>
            <dd className="text-lg font-semibold">{records.filter((r) => !r.reviewed).length}</dd>
          </div>
          <div className={cn("rounded-lg border bg-card px-3 py-2", flags && "border-alert/50 bg-alert-soft")}>
            <dt className="text-xs text-muted-foreground">Red flags</dt>
            <dd className={cn("text-lg font-semibold", flags && "text-alert")}>{flags}</dd>
          </div>
        </dl>
      </div>

      <ul className="mt-6 space-y-2">
        {waiting.map((r) => (
          <li key={r.patientInfo.id}>
            <Link
              to="/doctor/$patientId"
              params={{ patientId: r.patientInfo.id }}
              className={cn(
                "group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/40",
                r.urgency === "red-flag" && "border-alert/45",
                r.reviewed && "opacity-70",
              )}
            >
              <div className="min-w-44">
                <p className="font-semibold tracking-tight">
                  {r.patientInfo.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {r.patientInfo.age}
                    {r.patientInfo.sex[0]} · {r.patientInfo.id}
                  </span>
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" aria-hidden /> arrived {r.arrivedAt} · {r.patientInfo.language}
                </p>
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-surface-foreground">{r.aiSummary.oneLiner}</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-semibold",
                    r.viewed
                      ? "border-ok/30 bg-ok-soft text-ok"
                      : "border-warn/35 bg-warn-soft text-warn-foreground",
                  )}
                >
                  {r.viewed ? "Viewed" : "Not viewed"}
                </span>
                {r.reviewed && (
                  <span className="rounded-full border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Reviewed
                  </span>
                )}
                <UrgencyBadge urgency={r.urgency} />
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {waiting.length === 0 && (
        <p className="mt-6 rounded-xl border bg-surface px-4 py-10 text-center text-sm text-muted-foreground">
          The queue is empty. Completed intakes appear here the moment a patient submits.
        </p>
      )}

      <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <p className="flex items-center gap-2 text-sm">
          <PlugZap className="size-4 text-primary" aria-hidden />
          <span className="font-medium">ABDM integration</span>
          <span className="text-muted-foreground">Health-ID fields and record shape are ABDM-aligned.</span>
        </p>
        <span className="rounded-full border border-warn/35 bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn-foreground">
          ABDM-ready — not yet connected
        </span>
      </section>
    </main>
  );
}
