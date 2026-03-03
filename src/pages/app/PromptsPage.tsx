import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Prompt = {
  id: string;
  title: string;
  raw_input: string;
  classified_intent: string | null;
  tags: string[];
  created_at: string;
};

export default function PromptsPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("prompts")
      .select("id, title, raw_input, classified_intent, tags, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPrompts(data);
      });
  }, [user]);

  const filtered = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.raw_input.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Prompts</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No prompts yet. Create one in the Workspace!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.raw_input}</p>
                </div>
                {p.classified_intent && (
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">{p.classified_intent}</Badge>
                )}
              </div>
              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {p.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
