import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppTopBar() {
  const { signOut, profile, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-1 items-center justify-end gap-3">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors outline-none ring-0 focus:ring-2 focus:ring-primary/20">
            <Avatar className="h-8 w-8 ring-1 ring-border">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block max-w-[140px] truncate">
              {profile?.full_name || user?.email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem disabled className="text-muted-foreground">
            <span className="truncate">{user?.email}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
