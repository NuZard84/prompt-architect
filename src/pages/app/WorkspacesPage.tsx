import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace, type Workspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FolderOpen, Settings2, Loader2 } from "lucide-react";

const modelOptions = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
];

export default function WorkspacesPage() {
  const { user } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspaceId, isLoading } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("workspaces").insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      user_id: user.id,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      setNewDesc("");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast({ title: "Workspace created!" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workspaces").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast({ title: "Workspace deleted" });
    }
  };

  const handleUpdate = async (id: string, patch: Partial<Workspace>) => {
    const { error } = await supabase.from("workspaces").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
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
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. E-commerce App" />
              </div>
              <div>
                <Label>Description (optional)</Label>
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
          <p>No workspaces yet. Create one to organize your prompts.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeWorkspace?.id === ws.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setActiveWorkspaceId(ws.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {ws.name}
                      {activeWorkspace?.id === ws.id && (
                        <Badge variant="default" className="text-[10px]">Active</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">{ws.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle>Workspace Settings: {ws.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <Label>Default Model</Label>
                            <Select
                              value={ws.default_model}
                              onValueChange={(v) => handleUpdate(ws.id, { default_model: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {modelOptions.map((m) => (
                                  <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Enable Context Engine</Label>
                            <Switch
                              checked={ws.context_enabled}
                              onCheckedChange={(v) => handleUpdate(ws.id, { context_enabled: v })}
                            />
                          </div>
                          {ws.context_enabled && (
                            <div>
                              <Label>Context Summary</Label>
                              <Textarea
                                defaultValue={ws.context_summary || ""}
                                onBlur={(e) => handleUpdate(ws.id, { context_summary: e.target.value || null })}
                                placeholder="Describe the project context, tech stack, conventions..."
                                rows={4}
                              />
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(ws.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Workspace
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">
                    {modelOptions.find((m) => m.value === ws.default_model)?.label || ws.default_model}
                  </Badge>
                  {ws.context_enabled && (
                    <Badge variant="outline" className="text-[10px]">Context ON</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
