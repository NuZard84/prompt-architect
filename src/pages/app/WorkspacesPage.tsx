import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderOpen, Loader2, ArrowRight } from "lucide-react";

const modelOptions = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
];

type WorkspaceWithCount = {
  id: string;
  name: string;
  description: string | null;
  default_model: string;
  updated_at: string;
  promptCount: number;
};

export default function WorkspacesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces-with-counts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [wsRes, promptsRes] = await Promise.all([
        supabase.from("workspaces").select("id, name, description, default_model, updated_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("prompts").select("workspace_id").eq("user_id", user.id),
      ]);
      const wsList = wsRes.data || [];
      const prompts = promptsRes.data || [];
      const counts: Record<string, number> = {};
      prompts.forEach((p) => { if (p.workspace_id) counts[p.workspace_id] = (counts[p.workspace_id] || 0) + 1; });
      return wsList.map((ws) => ({ ...ws, promptCount: counts[ws.id] || 0 })) as WorkspaceWithCount[];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from("workspaces").insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      user_id: user.id,
    }).select("id").single();
    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      setNewDesc("");
      queryClient.invalidateQueries({ queryKey: ["workspaces-with-counts"] });
      toast({ title: "Workspace created!" });
      if (data) navigate(`/app/workspace/${data.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground mt-1">Organize prompts by project, team, or context.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground border-0">
              <Plus className="mr-2 h-4 w-4" /> New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. E-commerce App" />
              </div>
              <div>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Project context..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-xl border-dashed">
          <FolderOpen className="h-12 w-12 mb-4 opacity-30" />
          <p>No workspaces yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => navigate(`/app/workspace/${ws.id}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {ws.name}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="text-xs">{ws.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">
                    {modelOptions.find((m) => m.value === ws.default_model)?.label || ws.default_model}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {ws.promptCount} prompt{ws.promptCount !== 1 ? "s" : ""}
                  </Badge>
                  <span className="ml-auto text-[10px]">{new Date(ws.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
