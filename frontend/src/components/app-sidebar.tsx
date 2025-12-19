import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Fingerprint,
  Shield,
  Activity,
  Monitor,
  Settings,
  Lock,
  AlertTriangle,
  FlaskConical,
  FileText,
  LogOut,
  User,
  Brain,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User as UserType } from "@shared/schema";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Auth Demo",
    url: "/auth-demo",
    icon: Lock,
  },
  {
    title: "Device Profiles",
    url: "/devices",
    icon: Monitor,
  },
  {
    title: "TLS Fingerprints",
    url: "/tls",
    icon: Fingerprint,
  },
  {
    title: "Behavioral Patterns",
    url: "/behavioral",
    icon: Activity,
  },
  {
    title: "ML Analytics",
    url: "/ml-analytics",
    icon: Brain,
  },
];

const systemNavItems = [
  {
    title: "Risk Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Admin Panel",
    url: "/admin",
    icon: AlertTriangle,
  },
  {
    title: "A/B Experiments",
    url: "/experiments",
    icon: FlaskConical,
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: FileText,
  },
];

interface AppSidebarProps {
  user?: UserType | null;
  onLogout?: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-sidebar-foreground">
              IdentityIQ
            </span>
            <span className="text-xs text-muted-foreground">
              Risk-Based Auth
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="space-y-3">
          {user && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">System Status</span>
            <Badge variant="outline" className="bg-status-online/10 text-status-online border-status-online/20">
              Online
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
