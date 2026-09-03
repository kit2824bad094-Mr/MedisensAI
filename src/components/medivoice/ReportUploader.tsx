import { useRef, useState } from "react";
import { Camera, Check, FileText, Loader2, UploadCloud } from "lucide-react";
import { extractReport } from "@/lib/medivoice/mockApi";
import type { ReportDoc } from "@/lib/medivoice/types";
import { ReportViewer } from "./ReportViewer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  reports: ReportDoc[];
  onExtracted: (report: ReportDoc) => void;
}

export function ReportUploader({ reports, onExtracted }: Props) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(names: string[]) {
    setError(null);
    for (const name of names) {
      setProcessing(name);
      try {
        const report = await extractReport(name);
        onExtracted(report);
        setJustDone(report.id);
        setTimeout(() => setJustDone(null), 2200);
      } catch {
        setError("We couldn't read that file. Try a clearer photo or a PDF.");
      } finally {
        setProcessing(null);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const names = Array.from(e.dataTransfer.files).map((f) => f.name);
          void handleFiles(names.length ? names : ["Lab report.jpg"]);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed bg-card p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary-soft" : "border-border",
        )}
      >
        <UploadCloud className="mx-auto size-9 text-primary" strokeWidth={1.7} aria-hidden />
        <p className="mt-3 text-kiosk font-medium">Add your prescriptions or lab reports</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag files here, choose from your device, or take a photo. We read the values for the doctor.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => inputRef.current?.click()} disabled={!!processing}>
            <FileText className="size-4" aria-hidden /> Choose file
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={!!processing}
            onClick={() => void handleFiles(["Camera capture — lab report.jpg"])}
          >
            <Camera className="size-4" aria-hidden /> Use camera
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            if (names.length) void handleFiles(names);
            e.target.value = "";
          }}
        />
      </div>

      {processing && (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          <p className="text-sm">
            Reading <span className="font-medium">{processing}</span> — extracting values…
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-alert/50 bg-alert-soft px-4 py-3 text-sm text-alert">
          {error}
        </p>
      )}

      {reports.length === 0 && !processing ? (
        <p className="rounded-xl border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
          No documents added yet. This step is optional — you can skip it.
        </p>
      ) : (
        <div className="space-y-5">
          {reports.map((r) => (
            <div key={r.id} className="animate-rise rounded-2xl border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.kind} · added {r.uploadedAt} · {r.fields.length} fields read
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok",
                    justDone === r.id && "animate-rise",
                  )}
                >
                  <Check className="size-3.5" strokeWidth={2.6} aria-hidden /> Text extracted
                </span>
              </div>
              <ReportViewer report={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
