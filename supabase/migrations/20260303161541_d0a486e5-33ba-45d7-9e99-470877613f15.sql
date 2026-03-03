
-- Create workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid NOT NULL,
  default_template_id uuid REFERENCES public.prompt_templates(id) ON DELETE SET NULL,
  default_model text DEFAULT 'gemini-3-flash-preview',
  context_enabled boolean DEFAULT false,
  context_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces"
ON public.workspaces FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
ON public.workspaces FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
ON public.workspaces FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add workspace_id to prompts
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Add workspace_id to prompt_templates (for workspace-specific templates)
ALTER TABLE public.prompt_templates
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Index for fast workspace lookups
CREATE INDEX idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX idx_prompts_workspace_id ON public.prompts(workspace_id);
