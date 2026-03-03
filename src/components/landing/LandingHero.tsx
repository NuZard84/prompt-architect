import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LandingHero() {
  const { signInWithGoogle } = useAuth();

  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Prompt Engineering
          </motion.div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Turn messy explanations into{" "}
            <span className="gradient-text">production-grade</span>{" "}
            AI prompts.
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Brain Prompt Agent transforms your rough developer ideas into structured, deterministic, copy-paste ready prompts — engineered for real-world AI agents.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              onClick={signInWithGoogle}
              className="gradient-bg text-primary-foreground border-0 px-8 py-6 text-base font-semibold hover:opacity-90 glow-border"
            >
              Start Building Prompts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="rounded-2xl border bg-card p-6 shadow-2xl glow-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <div className="h-3 w-3 rounded-full bg-primary/60" />
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="text-muted-foreground">
                <span className="text-primary">→</span> Intent: <span className="text-foreground">New Feature</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">→</span> Agent: <span className="text-foreground">Cursor</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">→</span> Format: <span className="text-foreground">Step-by-step Implementation</span>
              </div>
              <div className="mt-4 rounded-lg bg-secondary/50 p-4 text-foreground">
                <div className="text-primary font-semibold mb-2">## Generated Prompt</div>
                <div className="text-muted-foreground text-xs leading-relaxed">
                  Implement a real-time collaborative editing feature using WebSocket connections. Follow the CRDT pattern for conflict resolution. Ensure backward compatibility with existing REST API endpoints...
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
