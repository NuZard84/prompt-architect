import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { PromptState } from "./PromptWizard";

const intents = [
  "Bug Fix", "New Feature", "Refactor", "UI/UX Change", "Testing",
  "Architecture Change", "Performance", "Documentation", "Mixed",
];

type Props = {
  state: PromptState;
  update: (p: Partial<PromptState>) => void;
  onNext: () => void;
};

export function StepIntent({ state, update, onNext }: Props) {
  const canProceed = state.rawInput.trim().length > 10 && state.intent;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Describe your intent</label>
        <Textarea
          placeholder="Paste your rough idea, bug description, or feature request here. Be as messy as you want..."
          value={state.rawInput}
          onChange={(e) => update({ rawInput: e.target.value })}
          className="min-h-[140px] font-mono text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">Classify the intent</label>
        <div className="flex flex-wrap gap-2">
          {intents.map((i) => (
            <Badge
              key={i}
              variant={state.intent === i ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                state.intent === i ? "gradient-bg text-primary-foreground border-0" : "hover:border-primary/50"
              }`}
              onClick={() => update({ intent: i })}
            >
              {i}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} className="gradient-bg text-primary-foreground border-0">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
