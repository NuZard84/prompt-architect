import { PromptWizard } from "@/components/app/prompt/PromptWizard";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen } from "lucide-react";

export default function WorkspacePage() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prompt Workspace</h1>
          <p className="text-muted-foreground mt-1">Transform your ideas into production-grade AI prompts.</p>
        </div>
        {workspaces.length > 0 && (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <Select
              value={activeWorkspace?.id || "none"}
              onValueChange={(v) => setActiveWorkspaceId(v === "none" ? null : v)}
            >
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Workspace</SelectItem>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {activeWorkspace && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">{activeWorkspace.name}</Badge>
          <Badge variant="secondary" className="text-[10px]">
            Model: {activeWorkspace.default_model}
          </Badge>
          {activeWorkspace.context_enabled && (
            <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400">
              Context Engine ON
            </Badge>
          )}
        </div>
      )}

      <PromptWizard activeWorkspace={activeWorkspace} />
    </div>
  );
}
