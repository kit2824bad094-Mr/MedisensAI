import { AlertTriangle } from "lucide-react";
import type { RedFlag } from "@/lib/medivoice/types";

export function RedFlagBanner({ flags }: { flags: RedFlag[] }) {
  if (!flags.length) return null;
  return (
    <section
      aria-label="Red flag alerts"
      className="animate-rise overflow-hidden rounded-xl border-2 border-alert/60 bg-alert-soft"
    >
      <div className="flex items-center gap-2 border-b border-alert/25 bg-alert px-4 py-2 text-alert-foreground">
        <AlertTriangle className="size-4" strokeWidth={2.4} aria-hidden />
        <h2 className="text-sm font-semibold tracking-tight">
          Red flag detected — screening signal, requires physician judgement
        </h2>
      </div>
      <ul className="divide-y divide-alert/15">
        {flags.map((f) => (
          <li key={f.title} className="px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{f.title}</p>
            <p className="mt-1 text-sm text-surface-foreground">
              <span className="font-medium">Triggered by:</span> {f.trigger}
            </p>
            <p className="mt-1 text-sm text-surface-foreground">
              <span className="font-medium">Suggested next step:</span> {f.recommendation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
