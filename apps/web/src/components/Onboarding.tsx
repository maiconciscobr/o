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
          Seus agentes de IA te esquecem. O Ō não.
        </p>

        {step === "question" && (
          <div className="mt-12">
            <p className="text-sm leading-relaxed text-zinc-300">
              O que você teve que explicar para um agente de IA essa semana
              <br />
              que já tinha explicado antes?
            </p>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="ex: Eu uso Fastify, não Express. Meu backend roda em SQLite. Prefiro estilo funcional..."
              className="mt-6 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500"
              rows={4}
              autoFocus
            />

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={handleSkip}
                className="text-sm text-zinc-500 hover:text-zinc-300"
              >
                Pular por agora
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Salvar e começar
              </button>
            </div>
          </div>
        )}

        {step === "saving" && (
          <div className="mt-12 text-sm text-zinc-400">
            Salvando sua primeira memória...
          </div>
        )}
      </div>
    </div>
  );
}
