import { PromptWizard } from "@/components/app/prompt/PromptWizard";

export default function WorkspacePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Prompt Workspace</h1>
        <p className="text-muted-foreground mt-1">Transform your ideas into production-grade AI prompts.</p>
      </div>
      <PromptWizard />
    </div>
  );
}
