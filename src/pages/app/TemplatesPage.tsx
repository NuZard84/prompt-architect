import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout, Cpu, Zap, Bug, Code2, Palette, TestTube, BookOpen, Gauge, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const intentIcons: Record<string, React.ElementType> = {
  bug_fix: Bug,
  new_feature: Code2,
  refactor: Zap,
  ui_ux: Palette,
  testing: TestTube,
  architecture: Cpu,
  performance: Gauge,
  documentation: BookOpen,
};

const intentColors: Record<string, string> = {
  bug_fix: "bg-destructive/10 text-destructive",
  new_feature: "bg-primary/10 text-primary",
  refactor: "bg-accent/10 text-accent",
  ui_ux: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  testing: "bg-green-500/10 text-green-600 dark:text-green-400",
  architecture: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  performance: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  documentation: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

const modelLabels: Record<string, string> = {
  "gemini-2.5-flash": "Flash 2.5",
  "gemini-2.5-pro": "Pro 2.5",
  "gemini-3-flash-preview": "Flash 3",
  "gemini-3-pro-preview": "Pro 3",
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  intent_type: string | null;
  clarification_schema: unknown;
  output_structure_schema: unknown;
  default_constraints: unknown;
  model_compatibility: string[] | null;
  context_depth: string | null;
};

export default function TemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Template[];
    },
  });

  const handleDelete = async (template: Template) => {
    if (template.type !== "user") return;
    const { error } = await supabase.from("prompt_templates").delete().eq("id", template.id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates-selector"] });
      toast({ title: "Template deleted" });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const systemTemplates = templates?.filter((t) => t.type === "system") || [];
  const userTemplates = templates?.filter((t) => t.type === "user") || [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-display tracking-tight">Prompt Templates</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Structured prompt blueprints. Select one in the Workspace to guide your generation. Custom templates coming soon.
        </p>
      </div>

      {/* System Templates */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold font-display mb-2">System Templates</h2>
        <p className="text-sm text-muted-foreground mb-5">Ready-to-use templates for common development intents</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {systemTemplates.map((t) => {
            const Icon = intentIcons[t.intent_type || ""] || Layout;
            const colorClass = intentColors[t.intent_type || ""] || "bg-muted text-muted-foreground";

            return (
              <Card key={t.id} className="group relative hover:shadow-lg hover:border-primary/20 transition-all hover:-translate-y-0.5 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className={`rounded-xl p-3 w-fit ${colorClass} ring-1 ring-black/5`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base mt-2">{t.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {t.model_compatibility?.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {modelLabels[m] || m}
                      </Badge>
                    ))}
                  </div>
                  {t.context_depth && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Context: {t.context_depth}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* User Templates */}
      <section>
        <h2 className="text-lg font-semibold font-display mb-2">My Templates</h2>
        <p className="text-sm text-muted-foreground mb-5">Your custom templates</p>
        {userTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 rounded-xl border-dashed bg-muted/10">
            <div className="rounded-2xl bg-primary/10 p-5 ring-1 ring-primary/20 mb-5">
              <Layout className="h-14 w-14 text-primary/70" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No custom templates yet</p>
            <p className="text-sm mb-2">Custom template creation coming soon</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {userTemplates.map((t) => {
              const Icon = intentIcons[t.intent_type || ""] || Layout;
              const colorClass = intentColors[t.intent_type || ""] || "bg-muted text-muted-foreground";
              return (
                <Card key={t.id} className="group relative hover:shadow-lg hover:border-primary/20 transition-all hover:-translate-y-0.5 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`rounded-xl p-3 w-fit ${colorClass} ring-1 ring-black/5`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <AlertDialog>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 group-hover:border-destructive/40 transition-all text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{t.name}&quot; will be permanently removed. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(t)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <TooltipContent>Delete template</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <CardTitle className="text-base mt-2">{t.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{t.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {t.model_compatibility?.map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {modelLabels[m] || m}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
