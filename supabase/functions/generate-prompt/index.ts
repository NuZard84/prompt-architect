import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_JSON_KEYS = [
  "objective",
  "current_context",
  "target_outcome",
  "constraints",
  "implementation_plan",
  "code_level_instructions",
  "risk_edge_cases",
  "testing_plan",
  "rollback_plan",
  "validation_checklist",
];

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

Return ONLY the JSON object.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ------------------------
    // 1️⃣ AUTH VALIDATION
    // ------------------------

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Unauthorized", 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables missing");
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }

    const userId = user.id;

    // ------------------------
    // 2️⃣ REQUEST BODY
    // ------------------------

    const body = await req.json();
    const {
      rawInput,
      intent,
      targetAgent,
      outputFormat,
      techStack,
      contextStrictness,
      constraints,
      additionalOptions,
      templateId,
    } = body;

    if (!rawInput) {
      return jsonError("rawInput is required", 400);
    }

    // Load template if provided
    let templateContext = "";
    if (templateId) {
      const { data: tmpl } = await userClient
        .from("prompt_templates")
        .select("name, default_constraints, clarification_schema, output_structure_schema, context_depth")
        .eq("id", templateId)
        .maybeSingle();

      if (tmpl) {
        const defConstraints = Array.isArray(tmpl.default_constraints)
          ? (tmpl.default_constraints as string[]).join(", ")
          : "";
        templateContext = `\nTemplate: ${tmpl.name}\nTemplate Constraints: ${defConstraints}\nContext Depth: ${tmpl.context_depth || "medium"}\n`;
      }
    }

    const userMessage = `
Intent: ${intent || "General"}
Target Agent: ${targetAgent || "General"}
Output Format: ${outputFormat || "Structured"}
Tech Stack: ${techStack?.join(", ") || "Not specified"}
Context Strictness: ${contextStrictness || "Balanced"}
Constraints: ${constraints?.join(", ") || "None"}
Additional Options: ${additionalOptions?.join(", ") || "None"}
${templateContext}
User raw input:
${rawInput}
`;

    // ------------------------
    // 3️⃣ LOAD AI SETTINGS
    // ------------------------

    const { data: aiSettings } = await userClient
      .from("user_ai_settings")
      .select("use_custom_key, gemini_api_key")
      .eq("user_id", userId)
      .maybeSingle();

    const useCustomKey = aiSettings?.use_custom_key && aiSettings?.gemini_api_key;

    // ------------------------
    // 4️⃣ AI CALL
    // ------------------------

    let aiResponse: string;
    let providerUsed = "platform";

    if (useCustomKey) {
      try {
        aiResponse = await callGemini(aiSettings!.gemini_api_key!, SYSTEM_PROMPT, userMessage);
        providerUsed = "custom";
      } catch (err) {
        console.error("Custom key failed, fallback:", err);
        aiResponse = await callPlatformAI(userMessage);
        providerUsed = "platform_fallback";
      }
    } else {
      aiResponse = await callPlatformAI(userMessage);
    }

    // ------------------------
    // 5️⃣ SAFE JSON PARSE
    // ------------------------

    const structured = validateAndParseJSON(aiResponse);

    // ------------------------
    // 6️⃣ ATOMIC USAGE TRACKING
    // ------------------------

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
      const { data: existing } = await serviceClient
        .from("user_usage")
        .select("id, requests_count, tokens_used")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await serviceClient.from("user_usage").update({
          requests_count: (existing.requests_count || 0) + 1,
          tokens_used: (existing.tokens_used || 0) + aiResponse.length,
        }).eq("user_id", userId);
      } else {
        await serviceClient.from("user_usage").insert({
          user_id: userId,
          requests_count: 1,
          tokens_used: aiResponse.length,
        });
      }
    } catch (e) {
      console.error("Usage tracking error:", e);
    }

    // ------------------------
    // 7️⃣ RESPONSE
    // ------------------------

    return new Response(
      JSON.stringify({
        structured,
        raw: aiResponse,
        provider: providerUsed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return jsonError(err instanceof Error ? err.message : "Internal error", 500);
  }
});

// ------------------------
// HELPERS
// ------------------------

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateAndParseJSON(text: string) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    for (const key of REQUIRED_JSON_KEYS) {
      if (!(key in parsed)) {
        throw new Error(`Missing required key: ${key}`);
      }
    }

    return parsed;
  } catch (err) {
    console.error("Invalid AI JSON:", err);
    return null;
  }
}

async function callGemini(apiKey: string, system: string, user: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system + "\n\n" + user }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini error: ${t}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callPlatformAI(userMessage: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
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
    const t = await response.text();
    throw new Error(`Platform AI error: ${t}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
