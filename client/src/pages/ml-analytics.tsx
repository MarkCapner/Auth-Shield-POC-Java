import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, AlertTriangle, Shield, Activity, TrendingUp, RefreshCw, User, Fingerprint } from "lucide-react";

interface AnomalyFactor {
  factor: string;
  zScore: number;
  isAnomaly: boolean;
  currentValue: number;
  baselineMean: number;
  baselineStd: number;
}

interface BehavioralScore {
  overallScore: number;
  isAnomaly: boolean;
  confidenceLevel: string;
  anomalyFactors: AnomalyFactor[];
  recommendation: string;
}

interface BaselineMetric {
  mean: number;
  stdDev: number;
}

interface Baseline {
  avgMouseSpeed?: BaselineMetric;
  avgMouseAcceleration?: BaselineMetric;
  avgKeyHoldTime?: BaselineMetric;
  avgFlightTime?: BaselineMetric;
  typingSpeed?: BaselineMetric;
  straightLineRatio?: BaselineMetric;
  curveComplexity?: BaselineMetric;
  patternCount?: number;
}

interface RiskScore {
  overallScore: number;
  recommendation: string;
  confidenceLevel: string;
  components: {
    device: number;
    tls: number;
    behavioral: number;
  };
  weights: {
    device: number;
    tls: number;
    behavioral: number;
  };
}

export default function MLAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: baseline, isLoading: baselineLoading, refetch: refetchBaseline } = useQuery<{ hasBaseline: boolean; baseline?: Baseline; message?: string }>({
    queryKey: ["/api/ml/baseline", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/ml/baseline/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch baseline");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const anomalyCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ml/anomaly-check", {
        userId: user?.id,
        currentBehavior: {
          avgKeystrokeInterval: Math.random() * 200 + 100,
          avgScrollSpeed: Math.random() * 500 + 200,
          avgMouseSpeed: Math.random() * 300 + 100,
        },
      });
      return response.json();
    },
  });

  const riskScoreMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ml/score", {
        userId: user?.id,
        currentBehavior: {
          avgKeystrokeInterval: Math.random() * 200 + 100,
          avgScrollSpeed: Math.random() * 500 + 200,
          avgMouseSpeed: Math.random() * 300 + 100,
        },
      });
      return response.json();
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-green-500";
    if (score >= 0.4) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.7) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Low Risk</Badge>;
    if (score >= 0.4) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium Risk</Badge>;
    return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">High Risk</Badge>;
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "allow":
        return <Badge className="bg-green-500">Allow</Badge>;
      case "step_up":
        return <Badge className="bg-yellow-500">Step-Up Auth</Badge>;
      case "block":
        return <Badge className="bg-red-500">Block</Badge>;
      default:
        return <Badge variant="secondary">{recommendation}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Brain className="h-6 w-6" />
            ML Analytics
          </h1>
          <p className="text-muted-foreground">
            View machine learning insights and anomaly detection for your account
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetchBaseline()}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-ml-analytics">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="baseline" data-testid="tab-baseline">Your Baseline</TabsTrigger>
          <TabsTrigger value="anomaly" data-testid="tab-anomaly">Anomaly Check</TabsTrigger>
          <TabsTrigger value="scoring" data-testid="tab-scoring">Risk Scoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Baseline Status</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {baselineLoading ? (
                  <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
                ) : baseline?.hasBaseline ? (
                  <>
                    <div className="text-2xl font-bold text-green-500" data-testid="text-baseline-status">Established</div>
                    <p className="text-xs text-muted-foreground">
                      {baseline.baseline?.patternCount} patterns analyzed
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-500" data-testid="text-baseline-status">Building</div>
                    <p className="text-xs text-muted-foreground">
                      Need more behavioral data
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anomaly Detection</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-anomaly-status">
                  {anomalyCheckMutation.data?.isAnomaly ? (
                    <span className="text-red-500">Detected</span>
                  ) : anomalyCheckMutation.data ? (
                    <span className="text-green-500">Normal</span>
                  ) : (
                    <span className="text-muted-foreground">Not Checked</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Run anomaly check to analyze
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {riskScoreMutation.data ? (
                  <>
                    <div className={`text-2xl font-bold ${getScoreColor(riskScoreMutation.data.overallScore)}`} data-testid="text-risk-score">
                      {(riskScoreMutation.data.overallScore * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {riskScoreMutation.data.recommendation}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-muted-foreground" data-testid="text-risk-score">--</div>
                    <p className="text-xs text-muted-foreground">
                      Run scoring to calculate
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize" data-testid="text-confidence">
                  {riskScoreMutation.data?.confidenceLevel || baseline?.baseline ? "High" : "Low"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on data volume
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Test the ML scoring engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => anomalyCheckMutation.mutate()}
                  disabled={anomalyCheckMutation.isPending}
                  className="w-full"
                  data-testid="button-run-anomaly-check"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {anomalyCheckMutation.isPending ? "Checking..." : "Run Anomaly Check"}
                </Button>
                <Button
                  onClick={() => riskScoreMutation.mutate()}
                  disabled={riskScoreMutation.isPending}
                  variant="outline"
                  className="w-full"
                  data-testid="button-calculate-risk"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {riskScoreMutation.isPending ? "Calculating..." : "Calculate Risk Score"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
                <CardDescription>Understanding the ML engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>1. Baseline Learning:</strong> The system learns your normal behavior patterns over time.</p>
                <p><strong>2. Anomaly Detection:</strong> Current behavior is compared against your baseline using z-scores.</p>
                <p><strong>3. Risk Scoring:</strong> Device (35%) + TLS (25%) + Behavioral (40%) signals combined.</p>
                <p><strong>4. Recommendations:</strong> Allow, Step-up authentication, or Block based on risk.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="baseline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Behavioral Baseline
              </CardTitle>
              <CardDescription>
                Statistical patterns learned from your behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              {baselineLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading baseline data...</div>
              ) : baseline?.hasBaseline && baseline.baseline ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Keystroke Dynamics</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Key hold time: <span className="font-mono" data-testid="text-keystroke-mean">{baseline.baseline.avgKeyHoldTime?.mean?.toFixed(2) ?? "N/A"}ms</span></p>
                        <p>Flight time: <span className="font-mono" data-testid="text-keystroke-std">{baseline.baseline.avgFlightTime?.mean?.toFixed(2) ?? "N/A"}ms</span></p>
                        <p>Typing speed: <span className="font-mono">{baseline.baseline.typingSpeed?.mean?.toFixed(1) ?? "N/A"} WPM</span></p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Mouse Movement</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Avg speed: <span className="font-mono" data-testid="text-mouse-mean">{baseline.baseline.avgMouseSpeed?.mean?.toFixed(2) ?? "N/A"} px/s</span></p>
                        <p>Std deviation: <span className="font-mono" data-testid="text-mouse-std">{baseline.baseline.avgMouseSpeed?.stdDev?.toFixed(2) ?? "N/A"}</span></p>
                        <p>Acceleration: <span className="font-mono">{baseline.baseline.avgMouseAcceleration?.mean?.toFixed(2) ?? "N/A"}</span></p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Movement Patterns</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>Straight line ratio: <span className="font-mono">{baseline.baseline.straightLineRatio?.mean?.toFixed(2) ?? "N/A"}</span></p>
                        <p>Curve complexity: <span className="font-mono">{baseline.baseline.curveComplexity?.mean?.toFixed(2) ?? "N/A"}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Baseline established from your behavioral patterns
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Baseline Not Yet Established</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {baseline?.message || "The system needs to collect at least 3 behavioral patterns to build your baseline. Keep using the application normally."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomaly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>
                Check if current behavior deviates from your baseline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => anomalyCheckMutation.mutate()}
                disabled={anomalyCheckMutation.isPending}
                data-testid="button-run-anomaly-check-tab"
              >
                {anomalyCheckMutation.isPending ? "Analyzing..." : "Run Anomaly Check"}
              </Button>

              {anomalyCheckMutation.data && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-sm text-muted-foreground mr-2">Status:</span>
                      {anomalyCheckMutation.data.isAnomaly ? (
                        <Badge variant="destructive" data-testid="badge-anomaly-result">Anomaly Detected</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20" data-testid="badge-anomaly-result">Normal</Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground mr-2">Confidence:</span>
                      <Badge variant="secondary" data-testid="badge-confidence">{anomalyCheckMutation.data.confidenceLevel}</Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground mr-2">Recommendation:</span>
                      {getRecommendationBadge(anomalyCheckMutation.data.recommendation)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Score Breakdown</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm w-24">Overall:</span>
                      <Progress value={anomalyCheckMutation.data.overallScore * 100} className="flex-1" />
                      <span className={`text-sm font-mono w-16 text-right ${getScoreColor(anomalyCheckMutation.data.overallScore)}`}>
                        {(anomalyCheckMutation.data.overallScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {anomalyCheckMutation.data.anomalyFactors && anomalyCheckMutation.data.anomalyFactors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Factor Analysis</h4>
                      <div className="space-y-2">
                        {anomalyCheckMutation.data.anomalyFactors.map((factor: AnomalyFactor, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="w-32 capitalize">{factor.factor.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <Badge variant={factor.isAnomaly ? "destructive" : "secondary"} className="text-xs">
                              z={factor.zScore.toFixed(2)}
                            </Badge>
                            <span className="text-muted-foreground">
                              {factor.currentValue.toFixed(2)} vs baseline {factor.baselineMean.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Scoring
              </CardTitle>
              <CardDescription>
                Combined risk assessment from all signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => riskScoreMutation.mutate()}
                disabled={riskScoreMutation.isPending}
                data-testid="button-calculate-risk-tab"
              >
                {riskScoreMutation.isPending ? "Calculating..." : "Calculate Risk Score"}
              </Button>

              {riskScoreMutation.data && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold" data-testid="text-overall-score">
                        <span className={getScoreColor(riskScoreMutation.data.overallScore)}>
                          {(riskScoreMutation.data.overallScore * 100).toFixed(0)}%
                        </span>
                      </span>
                      {getScoreBadge(riskScoreMutation.data.overallScore)}
                    </div>
                    <div>
                      {getRecommendationBadge(riskScoreMutation.data.recommendation)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Component Scores</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-2">
                            <Fingerprint className="h-4 w-4" />
                            Device Trust ({((riskScoreMutation.data.weights?.device || 0.35) * 100).toFixed(0)}% weight)
                          </span>
                          <span className={`text-sm font-mono ${getScoreColor(riskScoreMutation.data.components?.device)}`}>
                            {((riskScoreMutation.data.components?.device || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={(riskScoreMutation.data.components?.device || 0) * 100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            TLS Signature ({((riskScoreMutation.data.weights?.tls || 0.25) * 100).toFixed(0)}% weight)
                          </span>
                          <span className={`text-sm font-mono ${getScoreColor(riskScoreMutation.data.components?.tls)}`}>
                            {((riskScoreMutation.data.components?.tls || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={(riskScoreMutation.data.components?.tls || 0) * 100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Behavioral ({((riskScoreMutation.data.weights?.behavioral || 0.40) * 100).toFixed(0)}% weight)
                          </span>
                          <span className={`text-sm font-mono ${getScoreColor(riskScoreMutation.data.components?.behavioral)}`}>
                            {((riskScoreMutation.data.components?.behavioral || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={(riskScoreMutation.data.components?.behavioral || 0) * 100} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
