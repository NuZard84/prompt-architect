import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, RotateCcw, Save, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PromptState } from "./PromptWizard";

type Props = {
  state: PromptState;
  update: (p: Partial<PromptState>) => void;
  onReset: () => void;
};

function buildPrompt(state: PromptState): string {
  const lines: string[] = [];

  lines.push(`# AI Prompt — ${state.intent}`);
  lines.push(`**Target Agent:** ${state.targetAgent}`);
  lines.push(`**Output Format:** ${state.outputFormat}`);
  lines.push(`**Context Strictness:** ${state.contextStrictness}`);
  lines.push("");

  lines.push("## Objective");
  lines.push(state.rawInput);
  lines.push("");

  lines.push("## Current Context");
  lines.push(`- Intent Type: ${state.intent}`);
  if (state.techStack.length) lines.push(`- Tech Stack: ${state.techStack.join(", ")}`);
  lines.push("");

  lines.push("## Target Outcome");
  lines.push(`Deliver a ${state.outputFormat.toLowerCase()} that addresses the ${state.intent.toLowerCase()} described above.`);
  lines.push("");

  if (state.constraints.length) {
    lines.push("## Constraints");
    state.constraints.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  lines.push("## Implementation Plan");
  lines.push("1. Analyze the current state and identify affected components");
  lines.push("2. Plan the changes with minimal disruption");
  lines.push("3. Implement changes following the specified constraints");
  lines.push("4. Validate against edge cases and requirements");
  lines.push("5. Document changes and update relevant tests");
  lines.push("");

  lines.push("## Code-Level Instructions");
  lines.push(`- Follow ${state.contextStrictness.toLowerCase()} approach`);
  if (state.techStack.length) lines.push(`- Use the following stack: ${state.techStack.join(", ")}`);
  lines.push("- Ensure all changes are type-safe and well-documented");
  lines.push("- Include inline comments for complex logic");
  lines.push("");

  if (state.additionalOptions.includes("Risk analysis") || state.additionalOptions.includes("Edge cases")) {
    lines.push("## Risk & Edge Cases");
    if (state.additionalOptions.includes("Risk analysis")) {
      lines.push("- Identify potential regressions");
      lines.push("- Consider concurrency and race conditions");
    }
    if (state.additionalOptions.includes("Edge cases")) {
      lines.push("- Handle empty/null/undefined states");
      lines.push("- Consider boundary conditions and error paths");
    }
    lines.push("");
  }

  if (state.additionalOptions.includes("Test plan")) {
    lines.push("## Testing Plan");
    lines.push("- Unit tests for all new/modified functions");
    lines.push("- Integration tests for affected workflows");
    lines.push("- Edge case coverage for error handling");
    lines.push("");
  }

  if (state.additionalOptions.includes("Rollback plan")) {
    lines.push("## Rollback Plan");
    lines.push("- Document all changes for easy reversion");
    lines.push("- Ensure database migrations are reversible");
    lines.push("- Test rollback procedure before deployment");
    lines.push("");
  }

  lines.push("## Final Validation Checklist");
  lines.push("- [ ] All changes compile without errors");
  lines.push("- [ ] Existing tests pass");
  lines.push("- [ ] New tests added and passing");
  lines.push("- [ ] No security vulnerabilities introduced");
  lines.push("- [ ] Performance impact assessed");
  lines.push("- [ ] Documentation updated");

  return lines.join("\n");
}

export function StepGenerate({ state, update, onReset }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!state.generatedOutput) {
      update({ generatedOutput: buildPrompt(state) });
    }
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(state.generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = (ext: "txt" | "md") => {
    const blob = new Blob([state.generatedOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-${state.intent.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title: `${state.intent} — ${state.targetAgent}`,
      raw_input: state.rawInput,
      classified_intent: state.intent,
      selected_options: {
        targetAgent: state.targetAgent,
        outputFormat: state.outputFormat,
        techStack: state.techStack,
        contextStrictness: state.contextStrictness,
        constraints: state.constraints,
        additionalOptions: state.additionalOptions,
      },
      generated_output: state.generatedOutput,
    });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      setSaved(true);
      toast({ title: "Prompt saved!" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Generated Prompt</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDownload("md")}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saved}>
              <Save className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <pre className="p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-auto text-foreground">
          {state.generatedOutput}
        </pre>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" /> New Prompt
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownload("txt")}>
            Download .txt
          </Button>
          <Button variant="outline" onClick={() => handleDownload("md")}>
            Download .md
          </Button>
        </div>
      </div>
    </div>
  );
}
