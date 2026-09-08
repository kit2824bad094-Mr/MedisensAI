import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Mic, Square } from "lucide-react";
import { transcribeSpeech } from "@/lib/medivoice/mockApi";
import { cn } from "@/lib/utils";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  seed?: number;
  /** patient-facing language label, mapped to a speech-recognition locale */
  language?: string;
}

const BARS = 28;
const IDLE = () => Array.from({ length: BARS }, () => 0.15);

const LOCALES: Record<string, string> = {
  English: "en-IN",
  "हिन्दी": "hi-IN",
  "தமிழ்": "ta-IN",
  "മലയാളം": "ml-IN",
  "मराठी": "mr-IN",
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  return Ctor ? (new Ctor() as Recognition) : null;
}

export function VoiceCapture({ onTranscript, disabled, seed, language = "English" }: Props) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(IDLE);
  const [supported, setSupported] = useState(true);

  const recognition = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const stopAudio = useRef<(() => void) | null>(null);
  const simulated = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    setSupported(getRecognition() !== null);
  }, []);

  useEffect(
    () => () => {
      alive.current = false;
      recognition.current?.abort();
      stopAudio.current?.();
    },
    [],
  );

  // fallback bar animation while the simulated transcript plays
  useEffect(() => {
    if (!listening || !simulated.current) return;
    const id = setInterval(() => {
      setLevels((prev) => [...prev.slice(1), 0.2 + Math.random() * 0.8]);
    }, 90);
    return () => clearInterval(id);
  }, [listening]);

  /** live waveform driven by the real microphone */
  async function startMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let raf = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevels((prev) => [...prev.slice(1), Math.max(0.12, Math.min(1, peak * 3))]);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      stopAudio.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
        stopAudio.current = null;
      };
      return true;
    } catch {
      return false;
    }
  }

  function finish(text: string) {
    stopAudio.current?.();
    if (!alive.current) return;
    setListening(false);
    setLevels(IDLE());
    setPartial("");
    const clean = text.trim();
    if (clean) onTranscript(clean);
  }

  async function runSimulated(message?: string) {
    simulated.current = true;
    if (message) setNotice(message);
    setListening(true);
    const text = await transcribeSpeech((t) => setPartial(t), seed);
    simulated.current = false;
    finish(text);
  }

  async function start() {
    setNotice(null);
    setPartial("");
    finalText.current = "";

    const rec = getRecognition();
    if (!rec) {
      await runSimulated("This browser can't listen — playing a sample answer instead. Chrome or Edge supports live speech.");
      return;
    }

    const micOk = await startMeter();
    if (!micOk) {
      await runSimulated("Microphone access was blocked, so we played a sample answer. Allow the microphone to speak for real.");
      return;
    }

    rec.lang = LOCALES[language] ?? "en-IN";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText.current += chunk + " ";
        else interim += chunk;
      }
      setPartial((finalText.current + interim).trim());
    };
    rec.onerror = (e: any) => {
      recognition.current = null;
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setNotice("Microphone permission is off. Turn it on in your browser to answer by voice.");
      } else if (e?.error === "no-speech") {
        setNotice("We didn't catch anything. Tap the microphone and try again.");
      } else {
        setNotice("Voice input stopped unexpectedly. You can tap the microphone again or type your answer.");
      }
      finish("");
    };
    rec.onend = () => {
      if (!recognition.current) return;
      recognition.current = null;
      const text = finalText.current.trim();
      if (!text) setNotice("We didn't catch anything. Tap the microphone and try again.");
      finish(text);
    };

    recognition.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recognition.current = null;
      await runSimulated("Voice input couldn't start, so we played a sample answer.");
    }
  }

  function stop() {
    const rec = recognition.current;
    if (rec) {
      rec.stop();
      return;
    }
    finish(partial);
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
            onClick={listening ? stop : start}
            disabled={disabled}
            aria-label={listening ? "Stop and use what I said" : "Start speaking"}
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
                className={cn(
                  "w-full rounded-full transition-[height] duration-100",
                  listening ? "bg-primary/70" : "bg-border",
                )}
                style={{ height: `${Math.max(8, l * 100)}%` }}
              />
            ))}
          </div>
          <p aria-live="polite" className="mt-2 min-h-6 text-sm text-muted-foreground">
            {listening
              ? partial || "Listening… speak now, then tap the square when you're done."
              : supported
                ? "Tap the microphone and answer in your own words."
                : "Tap the microphone to hear a sample answer — live speech needs Chrome or Edge."}
          </p>
        </div>
      </div>

      {notice && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-warn/35 bg-warn-soft px-3 py-2 text-sm text-warn-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {notice}
        </p>
      )}
    </div>
  );
}
