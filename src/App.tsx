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
import DashboardPage from "@/pages/app/DashboardPage";
import WorkspacesPage from "@/pages/app/WorkspacesPage";
import WorkspaceDetailPage from "@/pages/app/WorkspaceDetailPage";
import WorkspaceHistoryPage from "@/pages/app/WorkspaceHistoryPage";
import PromptDetailPage from "@/pages/app/PromptDetailPage";
import TemplatesPage from "@/pages/app/TemplatesPage";
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
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
              <Route path="workspace/:workspaceId" element={<WorkspaceDetailPage />} />
              <Route path="workspace/:workspaceId/history" element={<WorkspaceHistoryPage />} />
              <Route path="workspace/:workspaceId/prompt/:promptId" element={<PromptDetailPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
