import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Copy, Trash2, RotateCcw, Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type PromptDetail = {
  id: string;
  title: string;
  raw_input: string;
  classified_intent: string | null;
  selected_options: Record<string, any> | null;
  generated_output: string | null;
  model_used: string | null;
  template_id: string | null;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  created_at: string;
};

export default function PromptDetailPage() {
  const { workspaceId, promptId } = useParams<{ workspaceId: string; promptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !promptId) return;
    loadPrompt();
  }, [user, promptId]);

  const loadPrompt = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", promptId!)
      .eq("user_id", user!.id)
      .single();

    if (error || !data) {
      toast({ title: "Prompt not found", variant: "destructive" });
      navigate(`/app/workspace/${workspaceId}/history`);
      return;
    }
    setPrompt(data as PromptDetail);

    if (data.template_id) {
      const { data: tmpl } = await supabase.from("prompt_templates").select("name").eq("id", data.template_id).maybeSingle();
      if (tmpl) setTemplateName(tmpl.name);
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!prompt?.generated_output) return;
    await navigator.clipboard.writeText(prompt.generated_output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!" });
  };

  const handleDuplicate = async () => {
    if (!prompt || !user) return;
    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      workspace_id: workspaceId,
      title: `${prompt.title} (Copy)`,
      raw_input: prompt.raw_input,
      classified_intent: prompt.classified_intent,
      selected_options: prompt.selected_options as any,
      generated_output: prompt.generated_output,
      model_used: prompt.model_used,
      template_id: prompt.template_id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prompt duplicated!" });
      navigate(`/app/workspace/${workspaceId}/history`);
    }
  };

  const handleDelete = async () => {
    if (!promptId) return;
    const { error } = await supabase.from("prompts").delete().eq("id", promptId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prompt deleted" });
      navigate(`/app/workspace/${workspaceId}/history`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!prompt) return null;

  const options = prompt.selected_options || {};

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/app/workspace/${workspaceId}/history`)} aria-label="Back to history">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{prompt.title}</h1>
          <p className="text-xs text-muted-foreground">{new Date(prompt.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} aria-label={copied ? "Copied!" : "Copy prompt"}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} aria-label="Duplicate prompt">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" aria-label="Delete prompt">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {prompt.classified_intent && <Badge variant="secondary">{prompt.classified_intent}</Badge>}
        {prompt.model_used && <Badge variant="outline" className="text-xs">{prompt.model_used}</Badge>}
        {templateName && <Badge variant="outline" className="text-xs">Template: {templateName}</Badge>}
        <Badge variant="outline" className="text-xs">{prompt.total_tokens || 0} tokens</Badge>
        {prompt.latency_ms > 0 && <Badge variant="outline" className="text-xs">{prompt.latency_ms}ms</Badge>}
      </div>

      <div className="space-y-6">
        {/* Raw Input */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-2">Raw Input</h3>
          <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">{prompt.raw_input}</pre>
        </div>

        {/* Clarification Answers */}
        {Object.keys(options).length > 0 && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Configuration</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(options).map(([key, val]) => (
                <div key={key}>
                  <span className="text-muted-foreground text-xs">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <p className="font-medium">{Array.isArray(val) ? val.join(", ") : String(val)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token breakdown */}
        {(prompt.input_tokens > 0 || prompt.output_tokens > 0) && (
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Token Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">{prompt.input_tokens}</p>
                <p className="text-xs text-muted-foreground">Input</p>
              </div>
              <div>
                <p className="text-lg font-bold">{prompt.output_tokens}</p>
                <p className="text-xs text-muted-foreground">Output</p>
              </div>
              <div>
                <p className="text-lg font-bold">{prompt.total_tokens}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Output */}
        {prompt.generated_output && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Generated Output</span>
              <Button variant="ghost" size="sm" onClick={handleCopy} aria-label={copied ? "Copied!" : "Copy output"}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <pre className="p-6 text-sm font-mono whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-auto text-foreground">
              {prompt.generated_output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
