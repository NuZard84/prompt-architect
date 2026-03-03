import { Brain } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-bg rounded-lg p-1.5">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Brain Prompt Agent</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Brain Prompt Agent. Built for developers who think in production.
        </p>
      </div>
    </footer>
  );
}
