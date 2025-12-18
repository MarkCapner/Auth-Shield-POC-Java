import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  Mouse,
  Keyboard,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import type { BehavioralPattern } from "@shared/schema";

// Demo data for behavioral patterns
const demoMouseStats = {
  avgSpeed: 245.8,
  speedVariance: 89.2,
  avgAcceleration: 12.4,
  straightLineRatio: 0.67,
  curveComplexity: 0.42,
  sampleCount: 15420,
};

const demoKeystrokeStats = {
  avgHoldTime: 87.3,
  holdVariance: 23.5,
  avgFlightTime: 112.6,
  flightVariance: 41.2,
  typingSpeed: 62.4,
  errorRate: 0.023,
  sampleCount: 8945,
};

const demoSpeedDistribution = [
  { range: "0-50", count: 12 },
  { range: "50-100", count: 28 },
  { range: "100-200", count: 45 },
  { range: "200-300", count: 38 },
  { range: "300-400", count: 22 },
  { range: "400-500", count: 15 },
  { range: "500+", count: 8 },
];

const demoHoldTimeDistribution = [
  { range: "0-50ms", count: 8 },
  { range: "50-75ms", count: 24 },
  { range: "75-100ms", count: 42 },
  { range: "100-125ms", count: 35 },
  { range: "125-150ms", count: 18 },
  { range: "150ms+", count: 12 },
];

const demoPatternTimeline = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  mouseConfidence: 0.6 + Math.random() * 0.35,
  keystrokeConfidence: 0.55 + Math.random() * 0.4,
}));

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: any;
  description?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-4 bg-muted/50 rounded-md">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-1" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/50 rounded-md">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{title}</span>
      </div>
      <p className="text-2xl font-semibold">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-popover-border rounded-md p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Behavioral() {
  const { data: patterns, isLoading } = useQuery<BehavioralPattern[]>({
    queryKey: ["/api/behavioral-patterns"],
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Behavioral Patterns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mouse movement and keystroke dynamics analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Active Users:</span>
            <span className="font-medium">247</span>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {(demoMouseStats.sampleCount + demoKeystrokeStats.sampleCount).toLocaleString()} samples
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mouse Patterns</p>
                <p className="text-2xl font-semibold">{demoMouseStats.sampleCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total data points</p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-1/10 flex items-center justify-center">
                <Mouse className="h-6 w-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Keystroke Events</p>
                <p className="text-2xl font-semibold">{demoKeystrokeStats.sampleCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total keystrokes</p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-2/10 flex items-center justify-center">
                <Keyboard className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Typing Speed</p>
                <p className="text-2xl font-semibold">{demoKeystrokeStats.typingSpeed.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Words per minute</p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-3/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-semibold">{(demoKeystrokeStats.errorRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Typo frequency</p>
              </div>
              <div className="h-12 w-12 rounded-md bg-chart-4/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mouse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mouse" className="gap-2">
            <Mouse className="h-4 w-4" />
            Mouse Dynamics
          </TabsTrigger>
          <TabsTrigger value="keystroke" className="gap-2">
            <Keyboard className="h-4 w-4" />
            Keystroke Dynamics
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            Confidence Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mouse" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mouse Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Mouse Movement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Avg Speed"
                  value={demoMouseStats.avgSpeed.toFixed(1)}
                  unit="px/s"
                  icon={TrendingUp}
                  isLoading={isLoading}
                />
                <StatCard
                  title="Speed Variance"
                  value={demoMouseStats.speedVariance.toFixed(1)}
                  icon={Activity}
                  isLoading={isLoading}
                />
                <StatCard
                  title="Acceleration"
                  value={demoMouseStats.avgAcceleration.toFixed(1)}
                  unit="px/s2"
                  icon={TrendingUp}
                  isLoading={isLoading}
                />
                <StatCard
                  title="Straight Line Ratio"
                  value={(demoMouseStats.straightLineRatio * 100).toFixed(0)}
                  unit="%"
                  icon={Activity}
                  description="Direct vs curved paths"
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Speed Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Speed Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={demoSpeedDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="range"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keystroke" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Keystroke Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Keystroke Dynamics Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Avg Hold Time"
                  value={demoKeystrokeStats.avgHoldTime.toFixed(1)}
                  unit="ms"
                  icon={Clock}
                  description="Key press duration"
                  isLoading={isLoading}
                />
                <StatCard
                  title="Hold Variance"
                  value={demoKeystrokeStats.holdVariance.toFixed(1)}
                  unit="ms"
                  icon={Activity}
                  isLoading={isLoading}
                />
                <StatCard
                  title="Avg Flight Time"
                  value={demoKeystrokeStats.avgFlightTime.toFixed(1)}
                  unit="ms"
                  icon={Clock}
                  description="Between key releases"
                  isLoading={isLoading}
                />
                <StatCard
                  title="Flight Variance"
                  value={demoKeystrokeStats.flightVariance.toFixed(1)}
                  unit="ms"
                  icon={Activity}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Hold Time Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Hold Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={demoHoldTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="range"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">24-Hour Confidence Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={demoPatternTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}:00`}
                  />
                  <YAxis
                    domain={[0, 1]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${Math.round(val * 100)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="mouseConfidence"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    name="Mouse Pattern Match"
                  />
                  <Line
                    type="monotone"
                    dataKey="keystrokeConfidence"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                    name="Keystroke Pattern Match"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-1" />
                  <span className="text-sm text-muted-foreground">Mouse Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-2" />
                  <span className="text-sm text-muted-foreground">Keystroke Confidence</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
