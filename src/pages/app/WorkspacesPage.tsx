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
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["workspaces-with-counts"] });
      toast({ title: "Workspace created!" });
      if (data) navigate(`/app/workspace/${data.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-1">Organize prompts by project, team, or context.</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input id="workspace-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. E-commerce App" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-desc">Description (optional)</Label>
                <Textarea id="workspace-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Project context..." rows={3} />
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
        <div className="flex flex-col items-center justify-center py-24 px-8 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 text-center animate-fade-in-up">
          <div className="mb-5 rounded-2xl bg-primary/10 p-5 ring-1 ring-primary/20">
            <FolderOpen className="h-14 w-14 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold font-display text-foreground mb-2">Create your first workspace</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-8">Workspaces help you organize prompts by project, team, or context. Get started by creating one.</p>
          <Button className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 group"
              onClick={() => navigate(`/app/workspace/${ws.id}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {ws.name}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </CardTitle>
                <CardDescription className="text-sm">{ws.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
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
