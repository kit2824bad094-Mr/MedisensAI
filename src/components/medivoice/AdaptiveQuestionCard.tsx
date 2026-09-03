import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import type { InterviewQuestion } from "@/lib/medivoice/mockApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  question: InterviewQuestion;
  onAnswer: (answer: string) => void;
  busy?: boolean;
}

export function AdaptiveQuestionCard({ question, onAnswer, busy }: Props) {
  const [draft, setDraft] = useState("");

  return (
    <div className="animate-rise rounded-2xl border bg-card p-5 shadow-clinical">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="size-3.5" strokeWidth={2.2} aria-hidden />
        AI intake assistant
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
        {!question.chips.some((c) => /not sure/i.test(c)) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAnswer("Not sure")}
            className="min-h-11 rounded-full border bg-secondary px-4 text-base font-medium text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            Not sure
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
          placeholder="Or type your answer…"
          aria-label="Type your answer"
          className="h-12 text-base"
          disabled={busy}
        />
        <Button type="submit" size="lg" disabled={busy || !draft.trim()} className="h-12">
          <Send className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Send</span>
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
