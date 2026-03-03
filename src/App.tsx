import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/app/AppLayout";
import WorkspacePage from "@/pages/app/WorkspacePage";
import PromptsPage from "@/pages/app/PromptsPage";
import HistoryPage from "@/pages/app/HistoryPage";
import TemplatesPage from "@/pages/app/TemplatesPage";
import WorkspacesPage from "@/pages/app/WorkspacesPage";
import SettingsPage from "@/pages/app/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<WorkspacePage />} />
              <Route path="prompts" element={<PromptsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
