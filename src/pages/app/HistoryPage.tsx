import { Clock } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Version History</h1>
      <p className="text-muted-foreground mb-8">Track and compare all versions of your generated prompts.</p>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-30" />
        <p>History will appear here as you generate and iterate on prompts.</p>
      </div>
    </div>
  );
}
