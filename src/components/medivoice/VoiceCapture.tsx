import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { transcribeSpeech } from "@/lib/medivoice/mockApi";
import { cn } from "@/lib/utils";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  seed?: number;
}

const BARS = 28;

export function VoiceCapture({ onTranscript, disabled, seed }: Props) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BARS }, () => 0.15));
  const cancelled = useRef(false);

  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => {
      setLevels((prev) => [...prev.slice(1), 0.2 + Math.random() * 0.8]);
    }, 90);
    return () => clearInterval(id);
  }, [listening]);

  useEffect(() => () => { cancelled.current = true; }, []);

  async function start() {
    setPartial("");
    setListening(true);
    const text = await transcribeSpeech((t) => setPartial(t), seed);
    if (cancelled.current) return;
    setListening(false);
    setLevels(Array.from({ length: BARS }, () => 0.15));
    onTranscript(text);
    setPartial("");
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-panel">
      <div className="flex items-center gap-4">
        <div className="relative">
          {listening && (
            <span className="absolute inset-0 animate-ripple rounded-full bg-primary/25" aria-hidden />
          )}
          <button
            type="button"
            onClick={listening ? undefined : start}
            disabled={disabled || listening}
            aria-label={listening ? "Listening, please speak" : "Start speaking"}
            className={cn(
              "relative grid size-16 place-items-center rounded-full text-primary-foreground transition-colors",
              listening ? "animate-breathe bg-primary" : "bg-primary hover:bg-primary/90",
              disabled && "opacity-50",
            )}
          >
            {listening ? <Square className="size-6" strokeWidth={2.2} /> : <Mic className="size-7" strokeWidth={2} />}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex h-10 items-end gap-[3px]" aria-hidden>
            {levels.map((l, i) => (
              <span
                key={i}
                className={cn("w-full rounded-full transition-[height] duration-100", listening ? "bg-primary/70" : "bg-border")}
                style={{ height: `${Math.max(8, l * 100)}%` }}
              />
            ))}
          </div>
          <p aria-live="polite" className="mt-2 min-h-6 truncate text-sm text-muted-foreground">
            {listening ? partial || "Listening…" : "Tap the microphone and answer in your own words."}
          </p>
        </div>
      </div>
    </div>
  );
}
