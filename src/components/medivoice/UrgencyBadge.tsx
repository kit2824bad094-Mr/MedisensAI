import { AlertTriangle, ArrowUpRight, Check } from "lucide-react";
import type { Urgency } from "@/lib/medivoice/types";
import { cn } from "@/lib/utils";

const MAP: Record<Urgency, { label: string; className: string; Icon: typeof Check }> = {
  normal: { label: "Normal", className: "bg-ok-soft text-ok border-ok/25", Icon: Check },
  priority: { label: "Priority", className: "bg-warn-soft text-warn-foreground border-warn/35", Icon: ArrowUpRight },
  "red-flag": {
    label: "Red flag",
    className: "bg-alert text-alert-foreground border-alert",
    Icon: AlertTriangle,
  },
};

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  const { label, className: tone, Icon } = MAP[urgency];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden />
      {label}
    </span>
  );
}
