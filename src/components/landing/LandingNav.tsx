import { Brain } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LandingNav() {
  const { signInWithGoogle } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="gradient-bg rounded-lg p-1.5">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Brain Prompt Agent</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button onClick={signInWithGoogle} className="gradient-bg text-primary-foreground border-0 hover:opacity-90">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}
