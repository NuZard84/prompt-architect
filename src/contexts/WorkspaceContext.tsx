import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  default_template_id: string | null;
  default_model: string;
  context_enabled: boolean;
  context_summary: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceContextType = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string | null) => void;
  isLoading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  activeWorkspace: null,
  setActiveWorkspaceId: () => {},
  isLoading: false,
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Workspace[];
    },
    enabled: !!user,
  });

  // Auto-select first workspace if none active
  useEffect(() => {
    if (!activeId && workspaces.length > 0) {
      setActiveId(workspaces[0].id);
    }
  }, [workspaces, activeId]);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        setActiveWorkspaceId: setActiveId,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
