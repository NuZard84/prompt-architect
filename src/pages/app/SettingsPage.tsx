import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { profile, user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {(profile?.full_name || user?.email || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
            <Badge variant="secondary" className="mt-2">Free Plan</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
