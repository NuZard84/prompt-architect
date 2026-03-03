import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Describe Your Intent",
    description: "Paste your rough idea, bug description, or feature request. Be as messy as you want.",
  },
  {
    step: "02",
    title: "Clarify & Configure",
    description: "Answer targeted questions about your target agent, tech stack, constraints, and output format.",
  },
  {
    step: "03",
    title: "Get Production Prompt",
    description: "Receive a structured, deterministic, copy-paste ready prompt with all edge cases covered.",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold md:text-5xl mb-4">
            Three steps to <span className="gradient-text">perfect prompts</span>
          </h2>
        </motion.div>

        <div className="mx-auto max-w-3xl space-y-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 gradient-bg rounded-xl h-14 w-14 flex items-center justify-center text-primary-foreground font-bold text-lg">
                {s.step}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
