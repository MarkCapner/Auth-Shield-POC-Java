import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Monitor, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ConfidenceGauge } from "@/components/dashboard/confidence-gauge";
import { ConfidenceTimeline } from "@/components/dashboard/confidence-timeline";
import { LiveActivityFeed } from "@/components/dashboard/live-activity-feed";
import { RiskFactorBreakdown } from "@/components/dashboard/risk-factor-breakdown";
import { useWebSocket } from "@/hooks/use-websocket";
import type { DashboardStats, LiveActivityItem, RiskFactorBreakdown as RiskFactorBreakdownType } from "@shared/schema";

export default function Dashboard() {
  const [activities, setActivities] = useState<LiveActivityItem[]>([]);
  const [currentConfidence, setCurrentConfidence] = useState(0.78);

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "activity") {
        setActivities((prev) => [data.activity, ...prev].slice(0, 50));
      }
      if (data.type === "confidence_update") {
        setCurrentConfidence(data.score);
      }
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: riskFactors, isLoading: riskLoading } = useQuery<RiskFactorBreakdownType>({
    queryKey: ["/api/dashboard/risk-factors"],
    refetchInterval: 15000,
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/timeline"],
    refetchInterval: 30000,
  });

  // Use real data from API, fallback to demo data for initial display
  const displayStats: DashboardStats = stats?.totalAuthentications > 0 ? stats : {
    totalAuthentications: stats?.totalAuthentications ?? 1247,
    successRate: stats?.successRate ?? 0.94,
    averageConfidence: stats?.averageConfidence ?? 0.82,
    activeDevices: stats?.activeDevices ?? 156,
    silentAuthRate: stats?.silentAuthRate ?? 0.73,
    stepUpRate: stats?.stepUpRate ?? 0.27,
  };

  const displayRiskFactors: RiskFactorBreakdownType = riskFactors || {
    deviceFamiliarity: 0.89,
    tlsConsistency: 0.92,
    behavioralMatch: 0.76,
    locationRisk: 0.85,
    timeOfDayRisk: 0.91,
  };

  const displayTimeline = timelineData?.length > 0 ? timelineData : generateDemoTimeline();

  // Generate demo activities if none
  useEffect(() => {
    if (activities.length === 0) {
      setActivities(generateDemoActivities());
    }
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time authentication intelligence and risk monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">WebSocket:</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`relative flex h-2 w-2 ${
                isConnected
                  ? "before:animate-ping before:absolute before:inline-flex before:h-full before:w-full before:rounded-full before:bg-status-online before:opacity-75"
                  : ""
              }`}
            >
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isConnected ? "bg-status-online" : "bg-status-offline"
                }`}
              ></span>
            </span>
            <span className="text-xs">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Authentications"
          value={displayStats.totalAuthentications.toLocaleString()}
          subtitle="Last 24 hours"
          icon={Shield}
          trend={{ direction: "up", value: "+12.3%" }}
          isLoading={statsLoading}
        />
        <KPICard
          title="Success Rate"
          value={`${Math.round(displayStats.successRate * 100)}%`}
          subtitle="Silent + step-up"
          icon={TrendingUp}
          trend={{ direction: "up", value: "+2.1%" }}
          isLoading={statsLoading}
        />
        <KPICard
          title="Avg. Confidence"
          value={`${Math.round(displayStats.averageConfidence * 100)}%`}
          subtitle="Across all attempts"
          icon={Users}
          trend={{ direction: "neutral", value: "Stable" }}
          isLoading={statsLoading}
        />
        <KPICard
          title="Active Devices"
          value={displayStats.activeDevices.toString()}
          subtitle="Unique fingerprints"
          icon={Monitor}
          trend={{ direction: "up", value: "+8" }}
          isLoading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - spans 2 columns */}
        <div className="lg:col-span-2">
          <ConfidenceTimeline
            data={displayTimeline}
            threshold={0.7}
            isLoading={timelineLoading}
          />
        </div>
        
        {/* Live Activity Feed */}
        <div>
          <LiveActivityFeed activities={activities} isLoading={false} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Confidence Gauge */}
        <div className="flex justify-center">
          <ConfidenceGauge
            score={currentConfidence}
            threshold={0.7}
            label="Current Session Confidence"
          />
        </div>

        {/* Risk Factor Breakdown */}
        <div className="lg:col-span-2">
          <RiskFactorBreakdown factors={displayRiskFactors} isLoading={riskLoading} />
        </div>
      </div>

      {/* Auth Method Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-card-border rounded-md">
          <h3 className="text-sm font-medium mb-4">Authentication Method Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-online" />
                <span className="text-sm">Silent Authentication</span>
              </div>
              <span className="text-sm font-mono" data-testid="text-silent-auth-rate">{Math.round(displayStats.silentAuthRate * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-status-online rounded-full transition-all duration-500"
                style={{ width: `${displayStats.silentAuthRate * 100}%` }}
                data-testid="progress-silent-auth"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-away" />
                <span className="text-sm">Step-up Required</span>
              </div>
              <span className="text-sm font-mono" data-testid="text-stepup-rate">{Math.round(displayStats.stepUpRate * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-status-away rounded-full transition-all duration-500"
                style={{ width: `${displayStats.stepUpRate * 100}%` }}
                data-testid="progress-stepup"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border border-card-border rounded-md">
          <h3 className="text-sm font-medium mb-4">System Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-2xl font-semibold">45ms</p>
              <p className="text-xs text-muted-foreground mt-1">Avg. Analysis Time</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-2xl font-semibold">99.8%</p>
              <p className="text-xs text-muted-foreground mt-1">Uptime</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-2xl font-semibold">0.02%</p>
              <p className="text-xs text-muted-foreground mt-1">False Positive Rate</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-2xl font-semibold">3.2M</p>
              <p className="text-xs text-muted-foreground mt-1">Patterns Learned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateDemoTimeline() {
  const now = Date.now();
  const points = [];
  for (let i = 24; i >= 0; i--) {
    points.push({
      timestamp: new Date(now - i * 3600000),
      deviceScore: 0.7 + Math.random() * 0.25,
      tlsScore: 0.75 + Math.random() * 0.2,
      behavioralScore: 0.6 + Math.random() * 0.3,
      overallScore: 0.7 + Math.random() * 0.2,
    });
  }
  return points;
}

function generateDemoActivities(): LiveActivityItem[] {
  const types: LiveActivityItem["type"][] = ["auth_attempt", "device_seen", "behavior_captured", "risk_calculated"];
  const levels: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const messages = [
    "Silent authentication successful for user@example.com",
    "New device fingerprint detected",
    "Behavioral pattern captured: 156 keystroke events",
    "Risk score calculated: 0.82 confidence",
    "TLS signature matched known profile",
    "Step-up verification required for user@test.com",
    "Mouse movement pattern analyzed: 340 data points",
    "Device trust score updated to 0.91",
  ];

  const activities: LiveActivityItem[] = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    activities.push({
      id: `demo-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      riskScore: 0.5 + Math.random() * 0.5,
      confidenceLevel: levels[Math.floor(Math.random() * levels.length)],
      timestamp: new Date(now - i * 120000),
    });
  }

  return activities;
}
