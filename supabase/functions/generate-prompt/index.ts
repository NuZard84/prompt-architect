import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a senior AI Prompt Engineering Architect.
Convert user explanations into structured, production-grade prompts.
Never be vague. Always structured. Never hallucinate missing context.

You MUST return a valid JSON object with exactly these keys:
{
  "objective": "string",
  "current_context": "string",
  "target_outcome": "string",
  "constraints": "string",
  "implementation_plan": "string",
  "code_level_instructions": "string",
  "risk_edge_cases": "string",
  "testing_plan": "string",
  "rollback_plan": "string",
  "validation_checklist": "string"
}

Each value should be detailed, actionable, and production-grade.
Return ONLY the JSON object, no markdown fences, no extra text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();
    const { rawInput, intent, targetAgent, outputFormat, techStack, contextStrictness, constraints, additionalOptions } = body;

    if (!rawInput) {
      return new Response(JSON.stringify({ error: "rawInput is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user AI settings for custom key
    const { data: aiSettings } = await supabase
      .from("user_ai_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    let useCustomKey = false;
    let customGeminiKey: string | null = null;

    if (aiSettings?.use_custom_key && aiSettings?.gemini_api_key) {
      useCustomKey = true;
      customGeminiKey = aiSettings.gemini_api_key;
    }

    // Build the user message
    const userMessage = `
Intent: ${intent || "General"}
Target Agent: ${targetAgent || "General"}
Output Format: ${outputFormat || "Structured"}
Tech Stack: ${techStack?.join(", ") || "Not specified"}
Context Strictness: ${contextStrictness || "Balanced"}
Constraints: ${constraints?.join(", ") || "None"}
Additional Options: ${additionalOptions?.join(", ") || "None"}

User's raw input:
${rawInput}
`;

    let aiResponse: string;
    let providerUsed = "platform";

    if (useCustomKey && customGeminiKey) {
      // Use custom Gemini key directly
      providerUsed = "custom";
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${customGeminiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + userMessage }] }],
          generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 4096 },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Custom Gemini key failed:", geminiRes.status, errText);
        // Fallback to platform key
        providerUsed = "platform_fallback";
        aiResponse = await callPlatformAI(userMessage);
      } else {
        const geminiData = await geminiRes.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } else {
      // Use Lovable AI Gateway (platform key)
      aiResponse = await callPlatformAI(userMessage);
    }

    // Track usage
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.rpc("", {}).catch(() => {}); // no-op
    // Upsert usage tracking
    const { data: existingUsage } = await serviceClient
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingUsage) {
      await serviceClient
        .from("user_usage")
        .update({
          requests_count: existingUsage.requests_count + 1,
          tokens_used: existingUsage.tokens_used + (aiResponse?.length || 0),
        })
        .eq("user_id", userId);
    } else {
      await serviceClient.from("user_usage").insert({
        user_id: userId,
        requests_count: 1,
        tokens_used: aiResponse?.length || 0,
      });
    }

    // Parse AI response - try to extract JSON
    let structured: Record<string, string> | null = null;
    try {
      // Remove markdown fences if present
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      structured = JSON.parse(cleaned);
    } catch {
      // If not valid JSON, return as raw text
      structured = null;
    }

    return new Response(
      JSON.stringify({
        structured,
        raw: aiResponse,
        provider: providerUsed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function callPlatformAI(userMessage: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (response.status === 402) throw new Error("Usage limit reached. Please add credits.");
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("AI generation failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
