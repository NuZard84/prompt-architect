import { useState } from "react";
import { StepIntent } from "./StepIntent";
import { StepClarify } from "./StepClarify";
import { StepConfirm } from "./StepConfirm";
import { StepGenerate } from "./StepGenerate";
import { TemplateSelector, type TemplateData } from "./TemplateSelector";
import { Badge } from "@/components/ui/badge";

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
  templateId: string | null;
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
  templateId: null,
};

const steps = ["Intent", "Clarify", "Confirm", "Generate"] as const;

export function PromptWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<PromptState>(initialState);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

  const update = (patch: Partial<PromptState>) => setState((s) => ({ ...s, ...patch }));

  const reset = () => {
    setStep(0);
    setState(initialState);
    setSelectedTemplate(null);
  };

  const handleTemplateChange = (template: TemplateData | null) => {
    setSelectedTemplate(template);
    if (template) {
      const constraints = Array.isArray(template.default_constraints)
        ? (template.default_constraints as string[])
        : [];
      update({
        templateId: template.id,
        intent: template.intent_type
          ? template.intent_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : state.intent,
        constraints,
      });
    } else {
      update({ templateId: null, constraints: [] });
    }
  };

  return (
    <div>
      {/* Template selector + Step indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-1">
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
        <TemplateSelector value={state.templateId} onChange={handleTemplateChange} />
      </div>

      {selectedTemplate && (
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            Template: {selectedTemplate.name}
          </Badge>
          {selectedTemplate.context_depth && (
            <Badge variant="secondary" className="text-[10px]">
              Context: {selectedTemplate.context_depth}
            </Badge>
          )}
        </div>
      )}

      {step === 0 && <StepIntent state={state} update={update} onNext={() => setStep(1)} />}
      {step === 1 && <StepClarify state={state} update={update} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepConfirm state={state} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepGenerate state={state} update={update} onReset={reset} />}
    </div>
  );
}
