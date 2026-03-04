import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden sm:block">
          {profile?.full_name || user?.email}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full" aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
