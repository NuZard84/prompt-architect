import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background mesh-gradient relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center px-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
          <Search className="h-3.5 w-3.5" />
          Page not found
        </div>
        <h1 className="text-8xl md:text-9xl font-extrabold font-display gradient-text mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-2 max-w-md mx-auto">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <p className="text-sm text-muted-foreground/80 mb-10">
          Tried to access: <code className="rounded bg-muted px-2 py-0.5 text-foreground/80">{location.pathname}</code>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground border-0 hover:bg-primary/90">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/app">
              <Sparkles className="mr-2 h-4 w-4" />
              Go to App
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
