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

const COPY: Record<string, { unsupported: string; blocked: string; denied: string; empty: string; stopped: string; start: string; stop: string; listening: string; idle: string; sample: string }> = {
  English: { unsupported: "This browser can't listen — playing a sample answer instead.", blocked: "Microphone access was blocked, so we played a sample answer.", denied: "Microphone permission is off. Turn it on in your browser.", empty: "We didn't catch anything. Tap the microphone and try again.", stopped: "Voice input stopped unexpectedly. Try again or type your answer.", start: "Start speaking", stop: "Stop and use what I said", listening: "Listening… speak now, then tap the square when you're done.", idle: "Tap the microphone and answer in your own words.", sample: "Tap the microphone to hear a sample answer." },
  "हिन्दी": { unsupported: "यह ब्राउज़र आवाज़ नहीं सुन सकता — नमूना उत्तर चलाया जा रहा है।", blocked: "माइक्रोफ़ोन बंद है, इसलिए नमूना उत्तर चलाया गया।", denied: "माइक्रोफ़ोन की अनुमति बंद है। इसे ब्राउज़र में चालू करें।", empty: "कुछ सुनाई नहीं दिया। माइक्रोफ़ोन दबाकर फिर कोशिश करें।", stopped: "आवाज़ इनपुट रुक गया। फिर कोशिश करें या उत्तर लिखें।", start: "बोलना शुरू करें", stop: "रोकें और उत्तर इस्तेमाल करें", listening: "सुन रहे हैं… बोलें, फिर पूरा होने पर चौकोर बटन दबाएँ।", idle: "माइक्रोफ़ोन दबाकर अपने शब्दों में उत्तर दें।", sample: "नमूना उत्तर सुनने के लिए माइक्रोफ़ोन दबाएँ।" },
  "தமிழ்": { unsupported: "இந்த உலாவியில் குரல் வசதி இல்லை — மாதிரி பதில் இயக்கப்படுகிறது.", blocked: "மைக்ரோஃபோன் தடுக்கப்பட்டது; மாதிரி பதில் இயக்கப்பட்டது.", denied: "மைக்ரோஃபோன் அனுமதி முடக்கப்பட்டுள்ளது. உலாவியில் இயக்கவும்.", empty: "எதுவும் கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்.", stopped: "குரல் உள்ளீடு நின்றது. மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.", start: "பேசத் தொடங்குங்கள்", stop: "நிறுத்தி பதிலைப் பயன்படுத்தவும்", listening: "கேட்கிறோம்… பேசி முடித்ததும் சதுரத்தைத் தட்டவும்.", idle: "மைக்ரோஃபோனைத் தட்டி உங்கள் வார்த்தைகளில் பதிலளிக்கவும்.", sample: "மாதிரி பதிலைக் கேட்க மைக்ரோஃபோனைத் தட்டவும்." },
  "മലയാളം": { unsupported: "ഈ ബ്രൗസറിൽ ശബ്ദം ലഭ്യമല്ല — മാതൃകാ ഉത്തരം കേൾപ്പിക്കുന്നു.", blocked: "മൈക്രോഫോൺ തടഞ്ഞതിനാൽ മാതൃകാ ഉത്തരം ഉപയോഗിച്ചു.", denied: "മൈക്രോഫോൺ അനുമതി ഓഫ് ആണ്. ബ്രൗസറിൽ ഓൺ ചെയ്യൂ.", empty: "ഒന്നും കേട്ടില്ല. വീണ്ടും ശ്രമിക്കൂ.", stopped: "ശബ്ദ ഇൻപുട്ട് നിലച്ചു. വീണ്ടും ശ്രമിക്കുകയോ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യൂ.", start: "സംസാരിക്കാൻ തുടങ്ങൂ", stop: "നിർത്തി ഉത്തരം ഉപയോഗിക്കൂ", listening: "കേൾക്കുന്നു… പറഞ്ഞുകഴിഞ്ഞാൽ ചതുരം അമർത്തൂ.", idle: "മൈക്രോഫോൺ അമർത്തി നിങ്ങളുടെ വാക്കുകളിൽ ഉത്തരം പറയൂ.", sample: "മാതൃകാ ഉത്തരം കേൾക്കാൻ മൈക്രോഫോൺ അമർത്തൂ." },
  "मराठी": { unsupported: "हा ब्राउझर आवाज ऐकू शकत नाही — नमुना उत्तर चालू आहे.", blocked: "मायक्रोफोन बंद असल्याने नमुना उत्तर वापरले.", denied: "मायक्रोफोनची परवानगी बंद आहे. ब्राउझरमध्ये चालू करा.", empty: "काही ऐकू आले नाही. पुन्हा प्रयत्न करा.", stopped: "आवाज इनपुट थांबला. पुन्हा प्रयत्न करा किंवा उत्तर लिहा.", start: "बोलायला सुरुवात करा", stop: "थांबा आणि उत्तर वापरा", listening: "ऐकत आहोत… बोलून झाल्यावर चौकोन दाबा.", idle: "मायक्रोफोन दाबून तुमच्या शब्दांत उत्तर द्या.", sample: "नमुना उत्तर ऐकण्यासाठी मायक्रोफोन दाबा." },
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
  const copy = COPY[language] ?? COPY.English;

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
    const text = await transcribeSpeech((t) => setPartial(t), seed, language);
    simulated.current = false;
    finish(text);
  }

  async function start() {
    setNotice(null);
    setPartial("");
    finalText.current = "";

    const rec = getRecognition();
    if (!rec) {
      await runSimulated(copy.unsupported);
      return;
    }

    const micOk = await startMeter();
    if (!micOk) {
      await runSimulated(copy.blocked);
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
        setNotice(copy.denied);
      } else if (e?.error === "no-speech") {
        setNotice(copy.empty);
      } else {
        setNotice(copy.stopped);
      }
      finish("");
    };
    rec.onend = () => {
      if (!recognition.current) return;
      recognition.current = null;
      const text = finalText.current.trim();
      if (!text) setNotice(copy.empty);
      finish(text);
    };

    recognition.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recognition.current = null;
      await runSimulated(copy.blocked);
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
            aria-label={listening ? copy.stop : copy.start}
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
              ? partial || copy.listening
              : supported
                ? copy.idle
                : copy.sample}
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
