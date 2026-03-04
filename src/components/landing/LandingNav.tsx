import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LandingNav() {
  const { signInWithGoogle } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src="/pormpt-brain.png" alt="Prompt Brain" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold font-display tracking-tight">Prompt Brain</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button onClick={signInWithGoogle} className="bg-primary text-primary-foreground border-0 hover:bg-primary/90">
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}
