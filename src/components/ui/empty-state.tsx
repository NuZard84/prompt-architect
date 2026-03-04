import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 text-center animate-fade-in-up ${className}`}
    >
      <div className="mb-4 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
        <Icon className="h-12 w-12 text-primary/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-primary text-primary-foreground border-0 hover:bg-primary/90">
          {action.label}
        </Button>
      )}
    </div>
  );
}
