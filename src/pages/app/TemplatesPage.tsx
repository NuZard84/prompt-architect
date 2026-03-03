import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Layout, Cpu, Zap, Bug, Code2, Palette, TestTube, BookOpen, Gauge, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleDuplicate = async (template: Template) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("prompt_templates").insert({
      name: `${template.name} (Copy)`,
      description: template.description,
      type: "user",
      user_id: user.id,
      intent_type: template.intent_type,
      clarification_schema: template.clarification_schema as any,
      output_structure_schema: template.output_structure_schema as any,
      default_constraints: template.default_constraints as any,
      model_compatibility: template.model_compatibility,
      context_depth: template.context_depth,
    });
    if (error) {
      toast({ title: "Error duplicating", description: error.message, variant: "destructive" });
    } else {
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Template duplicated!" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const systemTemplates = templates?.filter((t) => t.type === "system") || [];
  const userTemplates = templates?.filter((t) => t.type === "user") || [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Prompt Templates</h1>
        <p className="text-muted-foreground mt-1">
          Structured prompt blueprints — select one in the Workspace to guide your generation.
        </p>
      </div>

      {/* System Templates */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">System Templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systemTemplates.map((t) => {
            const Icon = intentIcons[t.intent_type || ""] || Layout;
            const colorClass = intentColors[t.intent_type || ""] || "bg-muted text-muted-foreground";

            return (
              <Card key={t.id} className="group relative hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDuplicate(t)}
                          >
                            {copiedId === t.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate to My Templates</TooltipContent>
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
        <h2 className="text-lg font-semibold mb-4">My Templates</h2>
        {userTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-xl border-dashed">
            <Layout className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No custom templates yet. Duplicate a system template to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userTemplates.map((t) => {
              const Icon = intentIcons[t.intent_type || ""] || Layout;
              const colorClass = intentColors[t.intent_type || ""] || "bg-muted text-muted-foreground";
              return (
                <Card key={t.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className={`rounded-lg p-2 w-fit ${colorClass}`}>
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
