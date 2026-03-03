import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTEXT_SYSTEM_PROMPT = `You are a senior engineering analyst. Given a collection of AI prompts generated within a single project workspace, synthesize a comprehensive project context summary.

You MUST return a valid JSON object with exactly these keys:
{
  "project_summary": "string - high-level overview of the project",
  "architecture_overview": "string - system architecture and component structure",
  "coding_patterns": "string - recurring code patterns and conventions",
  "tech_stack_summary": "string - technologies, frameworks, libraries used",
  "constraint_patterns": "string - common constraints and requirements",
  "historical_decisions": "string - key decisions made across prompts",
  "risk_patterns": "string - recurring risks and edge cases",
  "testing_strategy": "string - testing approaches and patterns",
  "performance_notes": "string - performance considerations and optimizations"
}

Return ONLY the JSON object. Be thorough and specific based on the actual prompt data.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Unauthorized", 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { workspaceId } = body;
    if (!workspaceId) return jsonError("workspaceId is required", 400);

    // Verify workspace ownership
    const { data: ws, error: wsErr } = await userClient
      .from("workspaces")
      .select("id, name")
      .eq("id", workspaceId)
      .single();
    if (wsErr || !ws) return jsonError("Workspace not found", 404);

    // Fetch all prompts in workspace
    const { data: prompts } = await userClient
      .from("prompts")
      .select("raw_input, classified_intent, generated_output, selected_options, model_used")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (!prompts || prompts.length === 0) {
      return jsonError("No prompts in this workspace to analyze", 400);
    }

    // Warn if too many prompts
    if (prompts.length > 100) {
      console.warn(`Workspace ${workspaceId} has ${prompts.length} prompts - using last 100`);
    }

    const promptsToAnalyze = prompts.slice(-100);

    // Build context payload
    const promptSummaries = promptsToAnalyze.map((p, i) => {
      const opts = p.selected_options as Record<string, any> || {};
      return `--- Prompt ${i + 1} ---
Intent: ${p.classified_intent || "Unknown"}
Input: ${(p.raw_input || "").slice(0, 500)}
Target Agent: ${opts.targetAgent || "N/A"}
Tech Stack: ${Array.isArray(opts.techStack) ? opts.techStack.join(", ") : "N/A"}
Constraints: ${Array.isArray(opts.constraints) ? opts.constraints.join(", ") : "N/A"}
Output (first 300 chars): ${(p.generated_output || "").slice(0, 300)}`;
    }).join("\n\n");

    const userMessage = `Workspace: ${ws.name}\nTotal prompts: ${prompts.length}\n\n${promptSummaries}`;

    // Call AI
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: CONTEXT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) return jsonError("Rate limit exceeded, please try again later", 429);
      if (aiRes.status === 402) return jsonError("AI credits exhausted", 402);
      throw new Error(`AI error: ${t}`);
    }

    const aiData = await aiRes.json();
    const rawOutput = aiData.choices?.[0]?.message?.content || "";

    // Parse structured output
    let structured: Record<string, string> | null = null;
    try {
      let cleaned = rawOutput.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      structured = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse context JSON");
    }

    // Format summary
    const summary = structured
      ? Object.entries(structured)
          .map(([key, val]) => `## ${key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n${val}`)
          .join("\n\n")
      : rawOutput;

    // Store in workspace_contexts (upsert)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Delete existing then insert (upsert pattern for unique constraint)
    await serviceClient.from("workspace_contexts").delete().eq("workspace_id", workspaceId);
    await serviceClient.from("workspace_contexts").insert({
      workspace_id: workspaceId,
      full_context_summary: summary,
      tokens_used: rawOutput.length,
    });

    return new Response(
      JSON.stringify({ summary, structured, tokensUsed: rawOutput.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("gather-context error:", err);
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
