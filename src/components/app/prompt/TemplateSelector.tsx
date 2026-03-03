import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "lucide-react";

export type TemplateData = {
  id: string;
  name: string;
  type: string;
  intent_type: string | null;
  clarification_schema: unknown;
  output_structure_schema: unknown;
  default_constraints: unknown;
  model_compatibility: string[] | null;
  context_depth: string | null;
};

type Props = {
  value: string | null;
  onChange: (template: TemplateData | null) => void;
};

export function TemplateSelector({ value, onChange }: Props) {
  const { data: templates } = useQuery({
    queryKey: ["templates-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as TemplateData[];
    },
  });

  const systemTemplates = templates?.filter((t) => t.type === "system") || [];
  const userTemplates = templates?.filter((t) => t.type === "user") || [];

  const handleChange = (id: string) => {
    if (id === "none") {
      onChange(null);
      return;
    }
    const found = templates?.find((t) => t.id === id) || null;
    onChange(found);
  };

  return (
    <div className="flex items-center gap-2">
      <Layout className="h-4 w-4 text-muted-foreground" />
      <Select value={value || "none"} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px] h-9 text-sm">
          <SelectValue placeholder="Select Template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Default Smart Mode</SelectItem>
          {systemTemplates.length > 0 && (
            <SelectGroup>
              <SelectLabel>System Templates</SelectLabel>
              {systemTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {userTemplates.length > 0 && (
            <SelectGroup>
              <SelectLabel>My Templates</SelectLabel>
              {userTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
