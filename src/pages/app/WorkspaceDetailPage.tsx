import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PromptWizard } from "@/components/app/prompt/PromptWizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Sparkles, Brain } from "lucide-react";
import type { Workspace } from "@/contexts/WorkspaceContext";

const modelOptions = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
];

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [gatheringContext, setGatheringContext] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(false);
  const [contextSummary, setContextSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !workspaceId) return;
    loadWorkspace();
  }, [user, workspaceId]);

  const loadWorkspace = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId!)
      .eq("user_id", user!.id)
      .single();

    if (error || !data) {
      toast({ title: "Workspace not found", variant: "destructive" });
      navigate("/app/workspaces");
      return;
    }
    setWorkspace(data as Workspace);
    setContextEnabled(data.context_enabled || false);

    // Load existing context
    const { data: ctx } = await supabase
      .from("workspace_contexts")
      .select("full_context_summary")
      .eq("workspace_id", workspaceId!)
      .maybeSingle();
    if (ctx) setContextSummary(ctx.full_context_summary);

    setLoading(false);
  };

  const handleGatherContext = async () => {
    if (!session?.access_token || !workspaceId) return;
    setGatheringContext(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gather-context`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ workspaceId }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Context gathering failed");
      }

      const data = await res.json();
      setContextSummary(data.summary);

      // Update workspace context_summary for backward compat
      await supabase.from("workspaces").update({
        context_summary: data.summary,
        context_enabled: true,
      }).eq("id", workspaceId);

      setContextEnabled(true);
      setWorkspace((prev) => prev ? { ...prev, context_summary: data.summary, context_enabled: true } : prev);
      toast({ title: "Full context generated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGatheringContext(false);
    }
  };

  const toggleContext = async (enabled: boolean) => {
    setContextEnabled(enabled);
    await supabase.from("workspaces").update({ context_enabled: enabled }).eq("id", workspaceId!);
    setWorkspace((prev) => prev ? { ...prev, context_enabled: enabled } : prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground mt-1 text-sm">{workspace.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {modelOptions.find((m) => m.value === workspace.default_model)?.label || workspace.default_model}
            </Badge>
            {contextEnabled && contextSummary && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400">
                Context Active
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(`/app/workspace/${workspaceId}/history`)} className="border-primary/30">
            <Clock className="mr-2 h-4 w-4" /> History
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 shadow-md shadow-primary/20"
            onClick={handleGatherContext}
            disabled={gatheringContext}
          >
            {gatheringContext ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
            Gather Full Context
          </Button>
        </div>
      </div>

      {/* Context Toggle */}
      {contextSummary && (
        <div className="mb-6 rounded-xl border p-5 bg-card shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Use Workspace Context</Label>
            </div>
            <Switch checked={contextEnabled} onCheckedChange={toggleContext} />
          </div>
          {contextEnabled && (
            <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{contextSummary.slice(0, 300)}...</p>
          )}
        </div>
      )}

      {/* Prompt Wizard */}
      <PromptWizard activeWorkspace={contextEnabled ? workspace : { ...workspace, context_enabled: false, context_summary: null }} />
    </div>
  );
}
