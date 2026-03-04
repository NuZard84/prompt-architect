import { motion } from "framer-motion";
import { Brain, Target, Shield, Layers, Zap, GitBranch } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Intent Classification",
    description: "Automatically detects whether you're fixing a bug, adding a feature, refactoring, or optimizing performance.",
  },
  {
    icon: Brain,
    title: "Smart Clarification",
    description: "Asks the right questions about your target AI agent, output format, tech stack, and constraints.",
  },
  {
    icon: Layers,
    title: "Structured Output",
    description: "Generates prompts with clear sections: Objective, Context, Constraints, Implementation Plan, and more.",
  },
  {
    icon: Shield,
    title: "Production-Grade",
    description: "Includes risk analysis, edge cases, rollback plans, and testing strategies in every prompt.",
  },
  {
    icon: GitBranch,
    title: "Version History",
    description: "Track every iteration of your prompts. Compare, restore, and learn from past generations.",
  },
  {
    icon: Zap,
    title: "Multi-Agent Support",
    description: "Optimized output for Cursor, GPT, Claude, Codex, and custom AI agents.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold md:text-5xl mb-4">
            Engineered for <span className="gradient-text">developers</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every feature is designed to help you communicate with AI agents more effectively.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border bg-card p-6 transition-all hover:glow-border hover:border-primary/30"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary group-hover:gradient-bg group-hover:text-primary-foreground transition-all">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
