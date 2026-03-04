import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [useCustomKey, setUseCustomKey] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiKeyMasked, setGeminiKeyMasked] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ requests_count: number; tokens_used: number } | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadSettings(), loadUsage()]).finally(() => setLoading(false));
  }, [user]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("user_ai_settings")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      setUseCustomKey(data.use_custom_key);
      if (data.gemini_api_key) {
        setGeminiKeyMasked("••••••••" + data.gemini_api_key.slice(-4));
      }
    }
  };

  const loadUsage = async () => {
    const { data } = await supabase
      .from("user_usage")
      .select("requests_count, tokens_used")
      .eq("user_id", user!.id)
      .single();
    if (data) setUsage(data);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      user_id: user.id,
      use_custom_key: useCustomKey,
      provider: "gemini",
    };
    if (geminiKey) payload.gemini_api_key = geminiKey;

    const { data: existing } = await supabase
      .from("user_ai_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let error;
    if (existing) {
      const { user_id, ...updatePayload } = payload;
      ({ error } = await supabase.from("user_ai_settings").update(updatePayload as any).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("user_ai_settings").insert(payload as any));
    }

    if (error) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved!" });
      if (geminiKey) {
        setGeminiKeyMasked("••••••••" + geminiKey.slice(-4));
        setGeminiKey("");
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile and AI configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Profile</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">AI Configuration</TabsTrigger>
          <TabsTrigger value="usage" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold font-display mb-5">Profile</h2>
            <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/30">
              <Avatar className="h-20 w-20 ring-2 ring-border">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {(profile?.full_name || user?.email || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg">{profile?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">{profile?.email || user?.email}</p>
                <Badge variant="secondary" className="mt-3">Free Plan</Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold mb-1">AI Provider</h2>
              <p className="text-sm text-muted-foreground">Configure which API key to use for prompt generation</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-5 bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Use My Own API Key</span>
                </div>
                <p className="text-xs text-muted-foreground">Advanced — bring your own Gemini key</p>
              </div>
              <Switch checked={useCustomKey} onCheckedChange={setUseCustomKey} />
            </div>

            {useCustomKey && (
              <div className="space-y-4 pl-2">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">Gemini API Key</Label>
                  <div className="relative">
                    <Input
                      id="gemini-key"
                      type={showKey ? "text" : "password"}
                      placeholder={geminiKeyMasked || "Enter your Gemini API key"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 opacity-50">
                  <div className="flex items-center gap-2">
                    <Label>OpenAI API Key</Label>
                    <Badge variant="outline" className="text-[10px]">
                      <Lock className="h-3 w-3 mr-1" /> Coming Soon
                    </Badge>
                  </div>
                  <Input disabled placeholder="ChatGPT integration coming soon..." />
                </div>
              </div>
            )}

            {!useCustomKey && (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                <p className="text-sm text-muted-foreground">
                  <Sparkles className="inline h-3.5 w-3.5 text-primary mr-1" />
                  Using <span className="font-medium text-foreground">Platform Default Key</span> — free during beta.
                </p>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full mt-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
              {saving ? "Saving..." : "Save AI Settings"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="rounded-xl border bg-card p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-semibold font-display">Usage</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-5 text-center bg-primary/5 border-primary/10">
                <p className="text-3xl font-bold font-display text-primary">{usage?.requests_count ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-2">Requests</p>
              </div>
              <div className="rounded-xl border p-5 text-center bg-accent/5 border-accent/10">
                <p className="text-3xl font-bold font-display text-accent">{usage?.tokens_used ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-2">Characters Processed</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Usage tracking is prepared for future billing plans.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
