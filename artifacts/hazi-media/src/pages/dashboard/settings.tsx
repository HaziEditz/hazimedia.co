import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { DashboardLayout } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-border/40">
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">Member since {format(new Date(user.createdAt), "MMMM yyyy")}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user.name} disabled className="bg-background/50" />
                <p className="text-xs text-muted-foreground">Contact support to change your name.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue={user.email} disabled className="bg-background/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>Permanent actions for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
              </div>
              <Button variant="destructive" disabled>Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
