import { useState } from "react";
import { Activity, FlaskConical, Pill, Stethoscope } from "lucide-react";
import type { TimelineEvent } from "@/lib/medivoice/types";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  condition: Activity,
  treatment: Pill,
  visit: Stethoscope,
  lab: FlaskConical,
} as const;

const SEVERITY = {
  low: { node: "bg-ok text-primary-foreground", ring: "ring-ok/25", text: "text-ok" },
  medium: { node: "bg-warn text-warn-foreground", ring: "ring-warn/25", text: "text-warn-foreground" },
  high: { node: "bg-alert text-alert-foreground", ring: "ring-alert/25", text: "text-alert" },
} as const;

export function HealthTimeline({ events }: { events: TimelineEvent[] }) {
  const [active, setActive] = useState(events.length - 1);
  const current = events[active];

  if (!events.length) {
    return (
      <p className="rounded-xl border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
        No prior history on record for this patient.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal rail (tablet/desktop) */}
      <div className="relative hidden pt-8 md:block">
        <div className="absolute left-0 right-0 top-[4.25rem] h-1 rounded-full bg-gradient-to-r from-primary/15 via-primary/40 to-alert/40" />
        <ol className="relative flex items-start justify-between gap-2">
          {events.map((e, i) => {
            const Icon = KIND_ICON[e.kind];
            const tone = SEVERITY[e.severity];
            const isActive = i === active;
            return (
              <li key={e.id} className="flex min-w-0 flex-1 flex-col items-center text-center">
                <span
                  className={cn(
                    "mb-2 max-w-full truncate text-[11px] font-semibold uppercase tracking-wide",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {e.date}
                </span>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  aria-label={`${e.date}: ${e.label}`}
                  className={cn(
                    "grid size-9 place-items-center rounded-full ring-4 transition-transform",
                    tone.node,
                    tone.ring,
                    isActive ? "scale-115 ring-8" : "hover:scale-110",
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.1} aria-hidden />
                </button>
                <span
                  className={cn(
                    "mt-2 line-clamp-2 text-xs leading-snug",
                    isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {e.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Vertical list (mobile) */}
      <ol className="relative space-y-3 border-l pl-6 md:hidden">
        {events.map((e, i) => {
          const Icon = KIND_ICON[e.kind];
          const tone = SEVERITY[e.severity];
          return (
            <li key={e.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[2.15rem] grid size-7 place-items-center rounded-full ring-4",
                  tone.node,
                  tone.ring,
                )}
              >
                <Icon className="size-3.5" strokeWidth={2.1} aria-hidden />
              </span>
              <button
                type="button"
                onClick={() => setActive(i)}
                className="w-full rounded-lg border bg-card px-3 py-2 text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{e.date}</p>
                <p className="text-sm font-semibold">{e.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>
              </button>
            </li>
          );
        })}
      </ol>

      {current && (
        <div
          key={current.id}
          className="animate-rise hidden rounded-xl border bg-card p-4 shadow-panel md:block"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{current.date}</span>
            <span className="text-xs capitalize text-muted-foreground">· {current.kind}</span>
            <span className={cn("text-xs font-semibold capitalize", SEVERITY[current.severity].text)}>
              · {current.severity} significance
            </span>
          </div>
          <p className="mt-1 font-semibold">{current.label}</p>
          <p className="mt-1 text-sm text-surface-foreground">{current.detail}</p>
        </div>
      )}
    </div>
  );
}
