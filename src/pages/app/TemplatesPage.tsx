import { Layout } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Prompt Templates</h1>
      <p className="text-muted-foreground mb-8">Save and reuse your favorite prompt configurations.</p>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layout className="h-12 w-12 mb-4 opacity-30" />
        <p>No templates saved yet. Save a configuration from the Workspace to create one.</p>
      </div>
    </div>
  );
}
