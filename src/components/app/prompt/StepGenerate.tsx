import { useEffect, useState, useRef, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, RotateCcw, Save, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PromptState } from "./PromptWizard";
import type { Workspace } from "@/contexts/WorkspaceContext";

const SECTION_ORDER = [
  "Objective",
  "Current Context",
  "Target Outcome",
  "Constraints",
  "Implementation Plan",
  "Code-Level Instructions",
  "Risk & Edge Cases",
  "Testing Plan",
  "Rollback Plan",
  "Final Validation Checklist",
];

type Props = {
  state: PromptState;
  update: (p: Partial<PromptState>) => void;
  onReset: () => void;
  activeWorkspace?: Workspace | null;
};

const SECTION_MAP: Record<string, string> = {
  objective: "Objective", current_context: "Current Context", target_outcome: "Target Outcome",
  constraints: "Constraints", implementation_plan: "Implementation Plan",
  code_level_instructions: "Code-Level Instructions", risk_edge_cases: "Risk & Edge Cases",
  testing_plan: "Testing Plan", rollback_plan: "Rollback Plan", validation_checklist: "Final Validation Checklist",
};

function formatStructured(s: Record<string, string>): string {
  return Object.entries(s).map(([key, value]) => {
    const title = SECTION_MAP[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return `## ${title}\n${value || "N/A"}`;
  }).join("\n\n");
}

function tryParseToMarkdown(raw: string): string | null {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    if (!cleaned.startsWith("{")) return null;
    const parsed = JSON.parse(cleaned);
    if (typeof parsed !== "object" || parsed === null) return null;
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === "string" && (typeof v === "string" || typeof v === "number")) flat[k] = String(v);
    }
    if (Object.keys(flat).length === 0) return null;
    return formatStructured(flat);
  } catch {
    return null;
  }
}

export function StepGenerate({ state, update, onReset, activeWorkspace }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingLine, setGeneratingLine] = useState(0);
  const [provider, setProvider] = useState("");
  const [tokenData, setTokenData] = useState<{ inputTokens: number; outputTokens: number; totalTokens: number; latencyMs: number }>({ inputTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs: 0 });
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const { user, session } = useAuth();

  useEffect(() => {
    if (!state.generatedOutput) generateWithAI();
  }, []);

  // Staggered line-by-line reveal while loading
  useEffect(() => {
    if (!loading) {
      setGeneratingLine(0);
      return;
    }
    setGeneratingLine(0);
    const totalLines = 3 + SECTION_ORDER.length * 2; // intro + each section (header + content)
    intervalRef.current = setInterval(() => {
      setGeneratingLine((prev) => Math.min(prev + 1, totalLines));
    }, 350);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  const generateWithAI = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          rawInput: state.rawInput, intent: state.intent, targetAgent: state.targetAgent,
          outputFormat: state.outputFormat, techStack: state.techStack, contextStrictness: state.contextStrictness,
          constraints: state.constraints, additionalOptions: state.additionalOptions,
          templateId: state.templateId || undefined,
          workspaceId: activeWorkspace?.id || undefined,
          workspaceContext: activeWorkspace?.context_enabled ? activeWorkspace.context_summary : undefined,
          workspaceModel: activeWorkspace?.default_model || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "AI generation failed" }));
        throw new Error(err.error || "AI generation failed");
      }

      const data = await res.json();
      const structuredMarkdown = data.structured
        ? formatStructured(data.structured)
        : tryParseToMarkdown(data.raw || "");
      const output = structuredMarkdown
        ? `# AI Prompt — ${state.intent}\n**Target Agent:** ${state.targetAgent}\n**Output Format:** ${state.outputFormat}\n\n${structuredMarkdown}`
        : (data.raw || "No output generated");

      update({ generatedOutput: output });
      setProvider(data.provider === "custom" ? "Gemini (Your Key)" : data.provider === "platform_fallback" ? "Gemini (Fallback)" : "Gemini (Platform)");
      setTokenData({ inputTokens: data.inputTokens || 0, outputTokens: data.outputTokens || 0, totalTokens: data.totalTokens || 0, latencyMs: data.latencyMs || 0 });
    } catch (e: any) {
      setError(e.message || "Failed to generate prompt");
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
      workspace_id: activeWorkspace?.id || null,
      title: `${state.intent} — ${state.targetAgent}`,
      raw_input: state.rawInput,
      classified_intent: state.intent,
      selected_options: { targetAgent: state.targetAgent, outputFormat: state.outputFormat, techStack: state.techStack, contextStrictness: state.contextStrictness, constraints: state.constraints, additionalOptions: state.additionalOptions } as any,
      generated_output: state.generatedOutput,
      template_id: state.templateId || null,
      model_used: provider || null,
      input_tokens: tokenData.inputTokens,
      output_tokens: tokenData.outputTokens,
      total_tokens: tokenData.totalTokens,
      latency_ms: tokenData.latencyMs,
    });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      setSaved(true);
      toast({ title: "Prompt saved!" });
    }
  };

  if (loading) {
    const introLines = [
      `# AI Prompt — ${state.intent}`,
      `**Target Agent:** ${state.targetAgent}`,
      `**Output Format:** ${state.outputFormat}`,
    ];
    let lineIndex = 0;
    const shouldShow = (n: number) => generatingLine > n;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span>Generating prompt with AI...</span>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              Generating
            </span>
          </div>
          <pre className="p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-auto text-foreground min-h-[320px]">
            {introLines.map((line, i) =>
              shouldShow(lineIndex++) ? (
                <span key={i} className="block animate-fade-in-up">
                  {line}
                </span>
              ) : null
            )}
            {shouldShow(lineIndex++) && <span className="block animate-fade-in-up" />}
            {SECTION_ORDER.map((title, i) => {
              const headerVisible = shouldShow(lineIndex++);
              const contentVisible = shouldShow(lineIndex++);
              if (!headerVisible && !contentVisible) return <Fragment key={title} />;
              const currentSection = generatingLine > 5 ? Math.min(Math.floor((generatingLine - 6) / 2), SECTION_ORDER.length - 1) : -1;
              const isActive = contentVisible && i === currentSection;
              return (
                <span key={title} className="block">
                  {headerVisible && (
                    <span className="block animate-fade-in-up">## {title}</span>
                  )}
                  {contentVisible && (
                    <span className="flex items-center gap-1 mt-1 mb-3 animate-fade-in-up">
                      <span
                        className="h-3 flex-1 max-w-full rounded-md animate-shimmer-sweep"
                        style={{
                          background:
                            "linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted)) 35%, hsl(var(--muted-foreground) / 0.25) 50%, hsl(var(--muted)) 65%, hsl(var(--muted)) 100%)",
                          backgroundSize: "200% 100%",
                        }}
                      />
                      {isActive && (
                        <span className="inline-block w-2 h-4 bg-primary animate-cursor-blink ml-0.5 shrink-0" />
                      )}
                    </span>
                  )}
                </span>
              );
            })}
          </pre>
        </div>
      </div>
    );
  }

  if (error && !state.generatedOutput) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={generateWithAI}>Retry</Button>
        <Button variant="outline" onClick={onReset}>Start Over</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {provider && (
        <TooltipProvider>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Using: {provider}</span>
            {tokenData.totalTokens > 0 && (
              <span>• {tokenData.totalTokens.toLocaleString()} tokens</span>
            )}
            {tokenData.latencyMs > 0 && (
              <span>• {tokenData.latencyMs}ms</span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted">ℹ️</span>
              </TooltipTrigger>
              <TooltipContent>Platform key is free during beta.</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Generated Prompt</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copied ? "Copied!" : "Copy prompt"}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDownload("md")} aria-label="Download as Markdown">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={saved} aria-label={saved ? "Saved" : "Save prompt"}>
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
          <Button variant="outline" onClick={generateWithAI}>
            <Sparkles className="mr-2 h-4 w-4" /> Regenerate
          </Button>
          <Button variant="outline" onClick={() => handleDownload("txt")}>Download .txt</Button>
          <Button variant="outline" onClick={() => handleDownload("md")}>Download .md</Button>
        </div>
      </div>
    </div>
  );
}
