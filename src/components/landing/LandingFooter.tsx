import { motion } from "framer-motion";
import { Github, MessageCircle, Twitter } from "lucide-react";

const socialLinks = [
  { name: "GitHub", icon: Github, href: "https://github.com" },
  { name: "Discord", icon: MessageCircle, href: "https://discord.com" },
  { name: "X", icon: Twitter, href: "https://x.com" },
];

export function LandingFooter() {
  return (
    <footer className="relative border-t overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-muted/30 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand & tagline */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <img src="/pormpt-brain.png" alt="Prompt Brain" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold font-display tracking-tight">Prompt Brain</span>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mb-8">
              Turn messy developer ideas into production-grade AI prompts. Built for developers who think in production.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Stay in the loop</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Get updates on new features and prompt engineering tips.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 min-w-0 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Prompt Brain. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground/80 italic">
            Built for developers who think in production.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
