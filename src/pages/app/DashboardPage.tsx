import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Brain, Zap, FolderOpen, BarChart3, Layout, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DashboardData = {
  totalPrompts: number;
  totalTokens: number;
  totalWorkspaces: number;
  mostUsedModel: string;
  mostUsedTemplate: string;
  modelDistribution: { name: string; value: number }[];
  dailyUsage: { date: string; prompts: number; tokens: number }[];
  workspaceActivity: {
    id: string;
    name: string;
    promptCount: number;
    tokensUsed: number;
    lastActive: string;
    defaultModel: string;
  }[];
  templateInsights: { name: string; count: number; tokens: number }[];
};

const CHART_COLORS = [
  "hsl(202, 52%, 49%)",   /* Medium Blue #3c8dbc */
  "hsl(174, 62%, 47%)",   /* Light Cyan #2ec4b6 */
  "hsl(214, 57%, 45%)",   /* Dark Teal variant */
  "hsl(340, 70%, 55%)",
  "hsl(174, 50%, 55%)",   /* Cyan lighter */
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [promptsRes, workspacesRes, templatesRes] = await Promise.all([
        supabase.from("prompts").select("id, workspace_id, model_used, total_tokens, template_id, created_at").eq("user_id", user!.id),
        supabase.from("workspaces").select("id, name, default_model, updated_at").eq("user_id", user!.id),
        supabase.from("prompt_templates").select("id, name"),
      ]);

      const prompts = promptsRes.data || [];
      const workspaces = workspacesRes.data || [];
      const templates = templatesRes.data || [];

      const totalTokens = prompts.reduce((s, p) => s + (p.total_tokens || 0), 0);

      // Model distribution
      const modelCounts: Record<string, number> = {};
      prompts.forEach((p) => {
        const m = p.model_used || "Platform";
        modelCounts[m] = (modelCounts[m] || 0) + 1;
      });
      const modelDistribution = Object.entries(modelCounts).map(([name, value]) => ({ name, value }));
      const mostUsedModel = modelDistribution.sort((a, b) => b.value - a.value)[0]?.name || "N/A";

      // Template insights
      const templateCounts: Record<string, { count: number; tokens: number }> = {};
      prompts.forEach((p) => {
        if (p.template_id) {
          if (!templateCounts[p.template_id]) templateCounts[p.template_id] = { count: 0, tokens: 0 };
          templateCounts[p.template_id].count++;
          templateCounts[p.template_id].tokens += p.total_tokens || 0;
        }
      });
      const templateInsights = Object.entries(templateCounts)
        .map(([id, v]) => ({ name: templates.find((t) => t.id === id)?.name || "Unknown", ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const mostUsedTemplate = templateInsights[0]?.name || "N/A";

      // Daily usage (last 30 days)
      const now = new Date();
      const dailyMap: Record<string, { prompts: number; tokens: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dailyMap[key] = { prompts: 0, tokens: 0 };
      }
      prompts.forEach((p) => {
        const key = p.created_at.split("T")[0];
        if (dailyMap[key]) {
          dailyMap[key].prompts++;
          dailyMap[key].tokens += p.total_tokens || 0;
        }
      });
      const dailyUsage = Object.entries(dailyMap).map(([date, v]) => ({ date: date.slice(5), ...v }));

      // Workspace activity
      const workspaceActivity = workspaces.map((ws) => {
        const wsPrompts = prompts.filter((p) => p.workspace_id === ws.id);
        const lastPrompt = wsPrompts.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return {
          id: ws.id,
          name: ws.name,
          promptCount: wsPrompts.length,
          tokensUsed: wsPrompts.reduce((s, p) => s + (p.total_tokens || 0), 0),
          lastActive: lastPrompt?.created_at || ws.updated_at,
          defaultModel: ws.default_model || "default",
        };
      });

      setData({
        totalPrompts: prompts.length,
        totalTokens,
        totalWorkspaces: workspaces.length,
        mostUsedModel,
        mostUsedTemplate,
        modelDistribution,
        dailyUsage,
        workspaceActivity,
        templateInsights,
      });
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Analytics & workspace overview</p>
        </div>
        <Button
          onClick={() => navigate("/app/workspaces")}
          className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Prompts", value: data.totalPrompts, icon: Brain },
          { label: "Total Tokens", value: data.totalTokens.toLocaleString(), icon: Zap },
          { label: "Workspaces", value: data.totalWorkspaces, icon: FolderOpen },
          { label: "Top Model", value: data.mostUsedModel, icon: BarChart3 },
          { label: "Top Template", value: data.mostUsedTemplate, icon: Layout },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <item.icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </div>
              <p className="text-lg font-bold truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.modelDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.modelDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.modelDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Usage (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="prompts" stroke="hsl(202, 52%, 49%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Workspace Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.workspaceActivity.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="rounded-2xl bg-primary/5 p-4 mb-4 ring-1 ring-primary/10">
                <FolderOpen className="h-10 w-10 text-primary/60" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium mb-1">No workspaces yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create a workspace to start building prompts</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/workspaces")}>
                Go to Workspaces
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 font-medium">Workspace</th>
                    <th className="pb-2 font-medium">Prompts</th>
                    <th className="pb-2 font-medium">Tokens</th>
                    <th className="pb-2 font-medium">Last Active</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.workspaceActivity.map((ws) => (
                    <tr key={ws.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{ws.name}</td>
                      <td className="py-3">{ws.promptCount}</td>
                      <td className="py-3">{ws.tokensUsed.toLocaleString()}</td>
                      <td className="py-3 text-muted-foreground">{new Date(ws.lastActive).toLocaleDateString()}</td>
                      <td className="py-3"><Badge variant="secondary" className="text-[10px]">{ws.defaultModel}</Badge></td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/workspace/${ws.id}`)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Insights */}
      {data.templateInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.templateInsights.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.count} prompts</span>
                    <span>{t.tokens.toLocaleString()} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
