import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Search, Eye } from "lucide-react";

type PromptRow = {
  id: string;
  title: string;
  template_id: string | null;
  model_used: string | null;
  total_tokens: number;
  created_at: string;
};

export default function WorkspaceHistoryPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user || !workspaceId) return;
    loadData();
  }, [user, workspaceId]);

  const loadData = async () => {
    setLoading(true);
    const [promptsRes, templatesRes] = await Promise.all([
      supabase
        .from("prompts")
        .select("id, title, template_id, model_used, total_tokens, created_at")
        .eq("user_id", user!.id)
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false }),
      supabase.from("prompt_templates").select("id, name"),
    ]);
    setPrompts(promptsRes.data || []);
    setTemplates(templatesRes.data || []);
    setLoading(false);
  };

  const models = [...new Set(prompts.map((p) => p.model_used).filter(Boolean))] as string[];

  const filtered = prompts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (modelFilter !== "all" && p.model_used !== modelFilter) return false;
    return true;
  });

  const getTemplateName = (id: string | null) => {
    if (!id) return "—";
    return templates.find((t) => t.id === id)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/app/workspace/${workspaceId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Workspace History</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} prompt{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search prompts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        {models.length > 0 && (
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          <p>No prompts in this workspace yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground text-left">
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Template</th>
                  <th className="p-3 font-medium">Model</th>
                  <th className="p-3 font-medium">Tokens</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium max-w-[200px] truncate">{p.title}</td>
                    <td className="p-3 text-muted-foreground text-xs">{getTemplateName(p.template_id)}</td>
                    <td className="p-3"><Badge variant="secondary" className="text-[10px]">{p.model_used || "Platform"}</Badge></td>
                    <td className="p-3 text-muted-foreground">{(p.total_tokens || 0).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/app/workspace/${workspaceId}/prompt/${p.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
