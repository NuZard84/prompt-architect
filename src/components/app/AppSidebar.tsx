import type { LucideIcon } from "lucide-react";
import { FolderOpen, Layout, Settings, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
};

const items: NavItem[] = [
  { title: "Dashboard", url: "/app/dashboard", icon: BarChart3 },
  {
    title: "Workspaces",
    url: "/app/workspaces",
    icon: FolderOpen,
    isActive: (pathname) =>
      pathname === "/app/workspaces" || pathname.startsWith("/app/workspace/"),
  },
  { title: "Templates", url: "/app/templates", icon: Layout },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <img src="/pormpt-brain.png" alt="Prompt Brain" className="h-8 w-8 flex-shrink-0 object-contain" />
          {!collapsed && <span className="text-sm font-bold font-display tracking-tight">Prompt Brain</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      isActive={item.isActive}
                      className="hover:bg-muted/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-l-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
