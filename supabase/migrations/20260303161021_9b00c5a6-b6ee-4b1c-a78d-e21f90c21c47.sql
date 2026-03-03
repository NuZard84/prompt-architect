
-- Add new columns to prompt_templates for the template system
ALTER TABLE public.prompt_templates 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS intent_type text,
  ADD COLUMN IF NOT EXISTS clarification_schema jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS output_structure_schema jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_constraints jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS model_compatibility text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS context_depth text DEFAULT 'medium';

-- Allow system templates (user_id = null) by making user_id nullable
ALTER TABLE public.prompt_templates ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy for reading system templates (type = 'system', user_id IS NULL)
CREATE POLICY "Anyone authenticated can view system templates"
ON public.prompt_templates
FOR SELECT
TO authenticated
USING (type = 'system' AND user_id IS NULL);

-- Add index for type lookups
CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON public.prompt_templates(type);

-- Add template_id to prompts table for tracking which template was used
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.prompt_templates(id),
  ADD COLUMN IF NOT EXISTS model_used text;
