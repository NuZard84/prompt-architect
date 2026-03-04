import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PromptState } from "./PromptWizard";

const agents = ["Cursor", "GPT", "Claude", "Codex", "Custom"];
const formats = ["Step-by-step", "Strict implementation", "Diff-style refactor", "Jira ticket", "PRD", "Debug checklist", "Test cases", "Combined"];
const stacks = ["React", "Next.js", "Node.js", "Python", "PostgreSQL", "TypeScript", "Tailwind", "Supabase", "Docker", "AWS"];
const strictness = ["No assumptions", "Allow assumptions", "High-level only", "Detailed code-level"];
const constraintOptions = ["Production-ready only", "Follow project rules", "Backward compatible", "Multi-tenant safe", "Performance critical"];
const additionalOpts = ["Risk analysis", "Edge cases", "Test plan", "Rollback plan", "Migration steps", "Security notes", "API contract", "DB schema"];

type Props = {
  state: PromptState;
  update: (p: Partial<PromptState>) => void;
  onNext: () => void;
  onBack: () => void;
};

function MultiSelect({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Badge
            key={o}
            variant={selected.includes(o) ? "default" : "outline"}
            className={`cursor-pointer px-3 py-1.5 text-xs transition-all ${
              selected.includes(o) ? "gradient-bg text-primary-foreground border-0" : "hover:border-primary/50"
            }`}
            onClick={() => toggle(o)}
          >
            {o}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SingleSelect({ label, options, selected, onChange }: { label: string; options: string[]; selected: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Badge
            key={o}
            variant={selected === o ? "default" : "outline"}
            className={`cursor-pointer px-3 py-1.5 text-xs transition-all ${
              selected === o ? "gradient-bg text-primary-foreground border-0" : "hover:border-primary/50"
            }`}
            onClick={() => onChange(o)}
          >
            {o}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function StepClarify({ state, update, onNext, onBack }: Props) {
  const canProceed = state.targetAgent && state.outputFormat && state.contextStrictness;

  return (
    <div className="space-y-6">
      <SingleSelect label="1. Target AI Agent" options={agents} selected={state.targetAgent} onChange={(v) => update({ targetAgent: v })} />
      <SingleSelect label="2. Output Format" options={formats} selected={state.outputFormat} onChange={(v) => update({ outputFormat: v })} />
      <MultiSelect label="3. Tech Stack" options={stacks} selected={state.techStack} onChange={(v) => update({ techStack: v })} />
      <SingleSelect label="4. Context Strictness" options={strictness} selected={state.contextStrictness} onChange={(v) => update({ contextStrictness: v })} />
      <MultiSelect label="5. Constraints" options={constraintOptions} selected={state.constraints} onChange={(v) => update({ constraints: v })} />
      <MultiSelect label="6. Additional Options" options={additionalOpts} selected={state.additionalOptions} onChange={(v) => update({ additionalOptions: v })} />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="gradient-bg text-primary-foreground border-0">
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
