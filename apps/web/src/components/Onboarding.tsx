import { useState } from "react";
import { memories } from "../lib/api";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<"question" | "saving">("question");
  const [answer, setAnswer] = useState("");

  const handleSubmit = async () => {
    if (!answer.trim()) {
      onComplete();
      return;
    }

    setStep("saving");
    try {
      await memories.create({
        content: answer.trim(),
        category: "fact",
        importance: 8,
      });
    } catch {
      // Continue even if save fails
    }
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-5xl font-extralight tracking-tight text-zinc-100">
          O
        </h1>
        <p className="mt-6 text-lg font-light text-zinc-400">
          Your AI agents forget you. O doesn't.
        </p>

        {step === "question" && (
          <div className="mt-12">
            <p className="text-sm leading-relaxed text-zinc-300">
              What did you have to explain to an AI agent this week
              <br />
              that you've already explained before?
            </p>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. I use Fastify, not Express. My backend runs on SQLite. I prefer functional style..."
              className="mt-6 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500"
              rows={4}
              autoFocus
            />

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={handleSkip}
                className="text-sm text-zinc-500 hover:text-zinc-300"
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Save and start
              </button>
            </div>
          </div>
        )}

        {step === "saving" && (
          <div className="mt-12 text-sm text-zinc-400">
            Saving your first memory...
          </div>
        )}
      </div>
    </div>
  );
}
