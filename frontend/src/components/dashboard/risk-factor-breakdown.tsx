import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiskFactorBreakdown as RiskFactorBreakdownType } from "@shared/schema";

interface RiskFactorBreakdownProps {
  factors: RiskFactorBreakdownType | null;
  isLoading?: boolean;
}

const factorLabels: Record<keyof RiskFactorBreakdownType, { label: string; description: string }> = {
  deviceFamiliarity: {
    label: "Device Familiarity",
    description: "How well-known this device is",
  },
  tlsConsistency: {
    label: "TLS Consistency",
    description: "Transport layer signature match",
  },
  behavioralMatch: {
    label: "Behavioral Match",
    description: "Biometric pattern similarity",
  },
  locationRisk: {
    label: "Location Risk",
    description: "Geographic anomaly detection",
  },
  timeOfDayRisk: {
    label: "Time Pattern",
    description: "Typical access time match",
  },
};

function getScoreColor(score: number) {
  if (score >= 0.8) return "bg-status-online";
  if (score >= 0.5) return "bg-status-away";
  return "bg-destructive";
}

function FactorSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function RiskFactorBreakdown({ factors, isLoading }: RiskFactorBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <FactorSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!factors) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Risk Factor Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              No risk analysis available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Risk Factor Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {(Object.keys(factorLabels) as Array<keyof RiskFactorBreakdownType>).map(
          (key) => {
            const score = factors[key];
            const { label, description } = factorLabels[key];
            const percentage = Math.round(score * 100);

            return (
              <div key={key} className="space-y-2" data-testid={`risk-factor-${key}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm font-mono">{percentage}%</span>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-2" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getScoreColor(score)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            );
          }
        )}
      </CardContent>
    </Card>
  );
}
