import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetAdminSummary } from "@workspace/api-client-react";
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, LogOut, Loader2, Shield, Users, ClipboardList, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();

  const { data: adminSummary } = useGetAdminSummary({
    query: {
      enabled: !!user?.isAdmin,
      refetchInterval: 30000,
    },
  });

  const pendingCount = adminSummary?.pendingOrders ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/dashboard/order-promotion", label: "New Promotion", icon: PlusCircle },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const adminItems = user?.isAdmin
    ? [
        { href: "/admin", label: "Admin Panel", icon: Shield, badge: 0 },
        { href: "/admin/orders", label: "All Orders", icon: ClipboardList, badge: pendingCount },
        { href: "/admin/clients", label: "Clients", icon: Users, badge: 0 },
      ]
    : [];

  return (
    <div className="min-h-screen flex bg-background/50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-xl hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary" />
            HAZI MEDIA
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}

          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
                {pendingCount > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Bell className="h-3 w-3" />
                    <span className="text-xs font-bold">{pendingCount}</span>
                  </div>
                )}
              </div>
              {adminItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-border/40 bg-card/30 backdrop-blur-xl md:hidden">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary" />
            HAZI MEDIA
          </Link>
          {user?.isAdmin && pendingCount > 0 && (
            <Link href="/admin/orders">
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium">
                <Bell className="h-4 w-4" />
                <span>{pendingCount} pending</span>
              </div>
            </Link>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
