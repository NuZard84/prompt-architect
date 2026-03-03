import { useState } from "react";
import { StepIntent } from "./StepIntent";
import { StepClarify } from "./StepClarify";
import { StepConfirm } from "./StepConfirm";
import { StepGenerate } from "./StepGenerate";

export type PromptState = {
  rawInput: string;
  intent: string;
  targetAgent: string;
  outputFormat: string;
  techStack: string[];
  contextStrictness: string;
  constraints: string[];
  additionalOptions: string[];
  generatedOutput: string;
};

const initialState: PromptState = {
  rawInput: "",
  intent: "",
  targetAgent: "",
  outputFormat: "",
  techStack: [],
  contextStrictness: "",
  constraints: [],
  additionalOptions: [],
  generatedOutput: "",
};

const steps = ["Intent", "Clarify", "Confirm", "Generate"] as const;

export function PromptWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<PromptState>(initialState);

  const update = (patch: Partial<PromptState>) => setState((s) => ({ ...s, ...patch }));

  const reset = () => {
    setStep(0);
    setState(initialState);
  };

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i <= step
                  ? "gradient-bg text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                i <= step ? "text-foreground" : "text-muted-foreground"
              } hidden sm:block`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-px w-8 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && <StepIntent state={state} update={update} onNext={() => setStep(1)} />}
      {step === 1 && <StepClarify state={state} update={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepConfirm state={state} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepGenerate state={state} update={update} onReset={reset} />}
    </div>
  );
}
