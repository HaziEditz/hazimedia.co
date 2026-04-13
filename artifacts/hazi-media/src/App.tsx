import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/index";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard/index";
import Orders from "@/pages/dashboard/orders";
import OrderPromotion from "@/pages/dashboard/order-promotion";
import Settings from "@/pages/dashboard/settings";

import AdminDashboard from "@/pages/admin/index";
import AdminOrders from "@/pages/admin/orders";
import AdminClients from "@/pages/admin/clients";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, requireAdmin = false, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard/orders">
        <ProtectedRoute component={Orders} />
      </Route>
      <Route path="/dashboard/order-promotion">
        <ProtectedRoute component={OrderPromotion} />
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} requireAdmin={true} />
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute component={AdminOrders} requireAdmin={true} />
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute component={AdminClients} requireAdmin={true} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
