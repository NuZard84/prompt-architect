import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { PromptState } from "./PromptWizard";

type Props = {
  state: PromptState;
  onNext: () => void;
  onBack: () => void;
};

export function StepConfirm({ state, onNext, onBack }: Props) {
  const sections = [
    { label: "Raw Input", value: state.rawInput },
    { label: "Intent", value: state.intent },
    { label: "Target Agent", value: state.targetAgent },
    { label: "Output Format", value: state.outputFormat },
    { label: "Tech Stack", value: state.techStack.join(", ") || "Not specified" },
    { label: "Context Strictness", value: state.contextStrictness },
    { label: "Constraints", value: state.constraints.join(", ") || "None" },
    { label: "Additional Options", value: state.additionalOptions.join(", ") || "None" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-lg">Review Your Configuration</h3>
        {sections.map((s) => (
          <div key={s.label} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <span className="text-sm font-medium text-muted-foreground w-40 flex-shrink-0">{s.label}</span>
            <span className="text-sm">
              {s.label === "Intent" ? (
                <Badge variant="secondary">{s.value}</Badge>
              ) : s.label === "Raw Input" ? (
                <span className="font-mono text-xs leading-relaxed block max-h-24 overflow-auto">{s.value}</span>
              ) : (
                s.value
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="gradient-bg text-primary-foreground border-0">
          <Sparkles className="mr-2 h-4 w-4" /> Generate Prompt
        </Button>
      </div>
    </div>
  );
}
