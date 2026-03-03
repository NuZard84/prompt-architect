
-- Add analytics tracking columns to prompts
ALTER TABLE public.prompts 
  ADD COLUMN IF NOT EXISTS input_tokens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latency_ms integer DEFAULT 0;

-- Create workspace_contexts table for Full Context Engine
CREATE TABLE public.workspace_contexts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  full_context_summary text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_contexts ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_contexts (user owns workspace)
CREATE POLICY "Users can view own workspace contexts"
ON public.workspace_contexts FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspaces WHERE workspaces.id = workspace_contexts.workspace_id AND workspaces.user_id = auth.uid()));

CREATE POLICY "Users can insert own workspace contexts"
ON public.workspace_contexts FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces WHERE workspaces.id = workspace_contexts.workspace_id AND workspaces.user_id = auth.uid()));

CREATE POLICY "Users can update own workspace contexts"
ON public.workspace_contexts FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.workspaces WHERE workspaces.id = workspace_contexts.workspace_id AND workspaces.user_id = auth.uid()));

CREATE POLICY "Users can delete own workspace contexts"
ON public.workspace_contexts FOR DELETE
USING (EXISTS (SELECT 1 FROM public.workspaces WHERE workspaces.id = workspace_contexts.workspace_id AND workspaces.user_id = auth.uid()));

-- Create unique index so we only have one context per workspace
CREATE UNIQUE INDEX idx_workspace_contexts_workspace_id ON public.workspace_contexts(workspace_id);
