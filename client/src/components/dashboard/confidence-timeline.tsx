import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";

interface TimelineDataPoint {
  timestamp: Date;
  deviceScore: number;
  tlsScore: number;
  behavioralScore: number;
  overallScore: number;
}

interface ConfidenceTimelineProps {
  data: TimelineDataPoint[];
  threshold?: number;
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-popover-border rounded-md p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">
        {format(new Date(label), "MMM d, h:mm a")}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs capitalize">
              {entry.dataKey.replace("Score", "")}:
            </span>
            <span className="text-xs font-medium">
              {Math.round(entry.value * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConfidenceTimeline({
  data,
  threshold = 0.7,
  isLoading,
}: ConfidenceTimelineProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    time: new Date(point.timestamp).getTime(),
  }));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium">Confidence Timeline</CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Overall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Device</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-3" />
            <span className="text-muted-foreground">TLS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chart-4" />
            <span className="text-muted-foreground">Behavioral</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">
              No data available yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDevice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBehavioral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tickFormatter={(val) => format(new Date(val), "h:mm")}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(val) => `${Math.round(val * 100)}%`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={threshold}
                stroke="hsl(var(--foreground))"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="overallScore"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorOverall)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="deviceScore"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorDevice)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="tlsScore"
                stroke="hsl(var(--chart-3))"
                fill="url(#colorTls)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="behavioralScore"
                stroke="hsl(var(--chart-4))"
                fill="url(#colorBehavioral)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
