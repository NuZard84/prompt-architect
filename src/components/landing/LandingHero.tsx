import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const MESSY_PROMPT = `Hey so I was thinking we need
that realtime collaborative thing
you know - websockets probably???
and we gotta handle when 2 people
edit the same stuff at once - 
maybe crdt or something?
oh and keep the old api working pls`;

const CLEAN_PROMPT = `Implement a real-time collaborative editing feature using WebSocket connections. Follow the CRDT pattern for conflict resolution. Ensure backward compatibility with existing REST API endpoints...`;

export function LandingHero() {
  const { signInWithGoogle } = useAuth();
  const [phase, setPhase] = useState<"messy" | "transforming" | "clean">("messy");

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    const runCycle = () => {
      setPhase("messy");
      t1 = setTimeout(() => setPhase("transforming"), 2800);
      t2 = setTimeout(() => setPhase("clean"), 4200);
      t3 = setTimeout(runCycle, 7800);
    };
    runCycle();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-32 pb-20 mesh-gradient">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10 dot-grid opacity-40" />
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/12 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-accent/12 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
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

          <h1 className="mb-6 text-5xl font-extrabold font-display leading-tight tracking-tight md:text-7xl">
            Turn messy explanations into{" "}
            <span className="gradient-text">production-grade</span>{" "}
            AI prompts.
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Prompt Brain transforms your rough developer ideas into structured, deterministic, copy-paste ready prompts — engineered for real-world AI agents.
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
              className="bg-primary text-primary-foreground border-0 px-8 py-6 text-base font-semibold hover:bg-primary/90"
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

        {/* Messy → Beautiful prompt transformation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mx-auto mt-20 max-w-5xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
            {/* Messy prompt (before) - highlighted when result NOT shown, highlight stops when after appears */}
            <motion.div
              animate={{
                scale: phase === "messy" ? [1, 1.01, 1] : 1,
                opacity: phase === "messy" ? 1 : 0.85,
                boxShadow: phase === "messy"
                  ? "0 0 0 2px hsl(var(--primary) / 0.45), 0 0 35px -8px hsl(var(--primary) / 0.3)"
                  : "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
                borderColor: phase === "messy" ? "hsl(var(--primary) / 0.55)" : "hsl(var(--muted-foreground) / 0.2)",
                backgroundColor: phase === "messy" ? "hsl(var(--primary) / 0.06)" : "hsl(var(--muted) / 0.4)",
                transition: {
                  scale: { repeat: phase === "messy" ? Infinity : 0, duration: 2.5, ease: "easeInOut" },
                  boxShadow: { duration: 0.5 },
                  borderColor: { duration: 0.5 },
                  opacity: { duration: 0.4 },
                  backgroundColor: { duration: 0.5 },
                },
              }}
              className="relative rounded-2xl border-2 border-dashed p-6 md:p-8 overflow-hidden min-h-[200px]"
            >
              <div className="absolute top-3 right-3 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                Before
              </div>
              <div className="font-mono text-base md:text-[15px] whitespace-pre-wrap text-muted-foreground/90 leading-[1.9] pr-8">
                <span className="block" style={{ transform: "rotate(-1.2deg)" }}>{MESSY_PROMPT.split("\n")[0]}</span>
                <span className="block mt-2" style={{ transform: "rotate(0.8deg)" }}>{MESSY_PROMPT.split("\n").slice(1, 4).join("\n")}</span>
                <span className="block mt-2 opacity-90" style={{ transform: "rotate(-0.6deg)" }}>{MESSY_PROMPT.split("\n").slice(4).join("\n")}</span>
              </div>
            </motion.div>

            {/* Transformation arrow */}
            <div className="flex items-center justify-center px-2 py-2">
              <motion.div
                animate={{
                  scale: phase === "transforming" ? [1, 1.2, 1] : 1,
                  opacity: phase === "transforming" ? 1 : 0.7,
                  rotate: 0,
                }}
                transition={{ duration: 0.3 }}
                className="relative md:rotate-0 rotate-90"
              >
                <ArrowRight className="h-8 w-8 md:h-10 md:w-10 text-primary" strokeWidth={2} />
                {phase === "transforming" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -inset-3 md:-inset-4 rounded-full bg-primary/20 blur-xl"
                  />
                )}
              </motion.div>
            </div>

            {/* Beautiful prompt (after) - starts HIDDEN, appears during transformation */}
            <motion.div
              animate={{
                boxShadow: phase === "clean" ? "0 0 30px -5px hsl(var(--glow) / 0.4)" : "0 25px 50px -12px rgba(0,0,0,0.1)",
                transition: { duration: 0.5 },
              }}
              className="relative rounded-2xl border bg-card p-5 md:p-6 shadow-2xl overflow-hidden min-h-[200px]"
            >
              <div className="absolute top-2 right-2 text-[10px] font-medium text-primary uppercase tracking-wider z-20">
                After
              </div>
              {/* Full overlay when messy - result is hidden, anticipating. Sweep reveals during transforming */}
              <motion.div
                initial={false}
                animate={{
                  opacity: phase === "messy" ? 1 : 0,
                  pointerEvents: phase === "messy" ? "auto" : "none",
                }}
                transition={{ duration: phase === "transforming" ? 1 : 0.4 }}
                className="absolute inset-0 z-10 rounded-2xl bg-muted/95 dark:bg-card/95 flex items-center justify-center"
              >
                <motion.span
                  animate={{ opacity: phase === "messy" ? [0.3, 0.6, 0.3] : 0 }}
                  transition={{ duration: 2, repeat: phase === "messy" ? Infinity : 0 }}
                  className="font-mono text-sm text-muted-foreground"
                >
                  Generating...
                </motion.span>
              </motion.div>
              {phase === "transforming" && (
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="absolute inset-0 z-20 pointer-events-none"
                >
                  <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </motion.div>
              )}
              <div className="space-y-3 font-mono text-sm relative z-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                </div>
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
                    {CLEAN_PROMPT}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
