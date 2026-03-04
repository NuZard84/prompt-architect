import { motion } from "framer-motion";
import { Brain, Target, Shield, Layers, Zap, GitBranch } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Intent Classification",
    description: "Automatically detects whether you're fixing a bug, adding a feature, refactoring, or optimizing performance.",
    gradient: "from-primary/20 to-accent/20",
    iconBg: "bg-primary/15",
  },
  {
    icon: Brain,
    title: "Smart Clarification",
    description: "Asks the right questions about your target AI agent, output format, tech stack, and constraints.",
    gradient: "from-accent/20 to-primary/20",
    iconBg: "bg-accent/15",
  },
  {
    icon: Layers,
    title: "Structured Output",
    description: "Generates prompts with clear sections: Objective, Context, Constraints, Implementation Plan, and more.",
    gradient: "from-primary/15 to-accent/15",
    iconBg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Production-Grade",
    description: "Includes risk analysis, edge cases, rollback plans, and testing strategies in every prompt.",
    gradient: "from-accent/15 to-primary/15",
    iconBg: "bg-accent/10",
  },
  {
    icon: GitBranch,
    title: "Version History",
    description: "Track every iteration of your prompts. Compare, restore, and learn from past generations.",
    gradient: "from-primary/20 to-accent/10",
    iconBg: "bg-primary/15",
  },
  {
    icon: Zap,
    title: "Multi-Agent Support",
    description: "Optimized output for Cursor, GPT, Claude, Codex, and custom AI agents.",
    gradient: "from-accent/20 to-primary/10",
    iconBg: "bg-accent/15",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 mesh-gradient opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold font-display md:text-5xl mb-4">
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
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative rounded-2xl overflow-hidden"
            >
              {/* Gradient border effect on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl scale-95 group-hover:scale-100`} />
              <div className="relative rounded-2xl border bg-card/90 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <div className={`mb-5 inline-flex rounded-xl ${f.iconBg} p-3 ring-1 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300`}>
                  <f.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold font-display mb-3 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                <div className="mt-4 h-px w-0 bg-gradient-to-r from-primary/50 to-accent/50 group-hover:w-full transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
