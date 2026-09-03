import reportScan from "@/assets/report-scan.jpg";
import type { ReportDoc } from "@/lib/medivoice/types";
import { cn } from "@/lib/utils";

/** Scan image with the OCR-extracted fields pinned onto it. */
export function ReportViewer({ report, className }: { report: ReportDoc; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]", className)}>
      <div className="relative overflow-hidden rounded-xl border bg-surface">
        <img
          src={reportScan}
          alt={`Scanned ${report.kind.toLowerCase()}: ${report.title}`}
          loading="lazy"
          width={900}
          height={1200}
          className="w-full opacity-90"
        />
        {report.fields.map((f) => (
          <span
            key={f.label}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            className={cn(
              "animate-rise absolute -translate-y-1/2 rounded-md border px-2 py-1 text-[11px] font-semibold shadow-clinical backdrop-blur-sm",
              f.flagged
                ? "border-alert bg-alert text-alert-foreground"
                : "border-primary/40 bg-card/90 text-primary",
            )}
          >
            {f.label}: {f.value}
          </span>
        ))}
      </div>

      <dl className="space-y-2 self-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Extracted fields
        </p>
        {report.fields.map((f) => (
          <div
            key={f.label}
            className={cn(
              "rounded-lg border bg-card px-3 py-2",
              f.flagged && "border-alert/50 bg-alert-soft",
            )}
          >
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd className={cn("text-sm font-semibold", f.flagged ? "text-alert" : "text-foreground")}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
