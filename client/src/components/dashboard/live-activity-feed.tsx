import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { LiveActivityItem } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface LiveActivityFeedProps {
  activities: LiveActivityItem[];
  isLoading?: boolean;
}

function ActivityIcon({ type }: { type: LiveActivityItem["type"] }) {
  switch (type) {
    case "auth_attempt":
      return <Shield className="h-4 w-4" />;
    case "device_seen":
      return <Monitor className="h-4 w-4" />;
    case "behavior_captured":
      return <Activity className="h-4 w-4" />;
    case "risk_calculated":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function ConfidenceBadge({ level }: { level?: "high" | "medium" | "low" }) {
  if (!level) return null;

  const variants = {
    high: "bg-status-online/10 text-status-online border-status-online/20",
    medium: "bg-status-away/10 text-status-away border-status-away/20",
    low: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Badge variant="outline" className={variants[level]}>
      {level}
    </Badge>
  );
}

function StatusIcon({ level }: { level?: "high" | "medium" | "low" }) {
  switch (level) {
    case "high":
      return <CheckCircle className="h-3 w-3 text-status-online" />;
    case "low":
      return <XCircle className="h-3 w-3 text-destructive" />;
    default:
      return <AlertTriangle className="h-3 w-3 text-status-away" />;
  }
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function LiveActivityFeed({ activities, isLoading }: LiveActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm font-medium">Live Activity</CardTitle>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-status-online"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px] px-4">
          {isLoading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here as users authenticate
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-3 first:pt-0"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-tight line-clamp-2">
                        {activity.message}
                      </p>
                      <StatusIcon level={activity.confidenceLevel} />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {activity.riskScore !== undefined && (
                        <span className="text-xs text-muted-foreground font-mono">
                          Score: {Math.round(activity.riskScore * 100)}%
                        </span>
                      )}
                      {activity.confidenceLevel && (
                        <ConfidenceBadge level={activity.confidenceLevel} />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
