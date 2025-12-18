import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import Dashboard from "@/pages/dashboard";
import AuthDemo from "@/pages/auth-demo";
import AuthPage from "@/pages/auth-page";
import Devices from "@/pages/devices";
import TLS from "@/pages/tls";
import Behavioral from "@/pages/behavioral";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import Experiments from "@/pages/experiments";
import AuditLogs from "@/pages/audit-logs";
import MLAnalytics from "@/pages/ml-analytics";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, logoutMutation } = useAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={() => logoutMutation.mutate()} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="text-username">
                {user.username}
              </span>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/auth-demo" component={AuthDemo} />
              <Route path="/devices" component={Devices} />
              <Route path="/tls" component={TLS} />
              <Route path="/behavioral" component={Behavioral} />
              <Route path="/settings" component={Settings} />
              <Route path="/admin" component={Admin} />
              <Route path="/experiments" component={Experiments} />
              <Route path="/audit-logs" component={AuditLogs} />
              <Route path="/ml-analytics" component={MLAnalytics} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
