import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import type { InterviewQuestion } from "@/lib/medivoice/mockApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  question: InterviewQuestion;
  onAnswer: (answer: string) => void;
  busy?: boolean;
  language?: string;
}

const COPY: Record<string, { assistant: string; unsure: string; placeholder: string; send: string }> = {
  English: { assistant: "AI intake assistant", unsure: "Not sure", placeholder: "Or type your answer…", send: "Send" },
  "हिन्दी": { assistant: "AI सेवन सहायक", unsure: "पता नहीं", placeholder: "या अपना उत्तर लिखें…", send: "भेजें" },
  "தமிழ்": { assistant: "AI உடல்நல உதவியாளர்", unsure: "தெரியவில்லை", placeholder: "அல்லது பதிலை தட்டச்சு செய்யுங்கள்…", send: "அனுப்பு" },
  "മലയാളം": { assistant: "AI ആരോഗ്യ സഹായി", unsure: "ഉറപ്പില്ല", placeholder: "അല്ലെങ്കിൽ ഉത്തരം ടൈപ്പ് ചെയ്യൂ…", send: "അയയ്ക്കുക" },
  "मराठी": { assistant: "AI आरोग्य सहाय्यक", unsure: "माहीत नाही", placeholder: "किंवा उत्तर टाइप करा…", send: "पाठवा" },
};

export function AdaptiveQuestionCard({ question, onAnswer, busy, language = "English" }: Props) {
  const [draft, setDraft] = useState("");
  const copy = COPY[language] ?? COPY["English"];

  return (
    <div className="animate-rise rounded-2xl border bg-card p-5 shadow-clinical">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="size-3.5" strokeWidth={2.2} aria-hidden />
        {copy.assistant}
      </div>
      <p className="mt-2 text-kiosk font-medium text-foreground">{question.text}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {question.chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={busy}
            onClick={() => onAnswer(chip)}
            className="min-h-11 rounded-full border border-primary/25 bg-primary-soft px-4 text-base font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
        {!question.chips.includes(copy.unsure) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAnswer(copy.unsure)}
            className="min-h-11 rounded-full border bg-secondary px-4 text-base font-medium text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {copy.unsure}
          </button>
        )}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onAnswer(draft.trim());
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={copy.placeholder}
          aria-label="Type your answer"
          className="h-12 text-base"
          disabled={busy}
        />
        <Button type="submit" size="lg" disabled={busy || !draft.trim()} className="h-12">
          <Send className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{copy.send}</span>
        </Button>
      </form>
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-panel">
      <Sparkles className="size-3.5 text-primary" aria-hidden />
      AI is choosing the next question
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-primary/70"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
