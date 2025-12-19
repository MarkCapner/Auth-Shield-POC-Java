import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Play, Pause, BarChart3, FlaskConical, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AbExperiment } from "@shared/schema";

export default function Experiments() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: "",
    description: "",
    primaryMetric: "silent_auth_rate",
    trafficSplit: 0.5,
    controlConfig: { threshold: 0.7, weights: { device: 0.4, tls: 0.3, behavioral: 0.3 } },
    variantConfig: { threshold: 0.65, weights: { device: 0.35, tls: 0.35, behavioral: 0.3 } },
  });

  const { data: experiments = [] } = useQuery<AbExperiment[]>({
    queryKey: ["/api/experiments"],
  });

  const createExperimentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/experiments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiments"] });
      setIsCreateDialogOpen(false);
      setNewExperiment({
        name: "",
        description: "",
        primaryMetric: "silent_auth_rate",
        trafficSplit: 0.5,
        controlConfig: { threshold: 0.7, weights: { device: 0.4, tls: 0.3, behavioral: 0.3 } },
        variantConfig: { threshold: 0.65, weights: { device: 0.35, tls: 0.35, behavioral: 0.3 } },
      });
      toast({ title: "Experiment created", description: "The experiment has been created successfully." });
    },
  });

  const updateExperimentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AbExperiment> }) => {
      const response = await apiRequest("PATCH", `/api/experiments/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiments"] });
      toast({ title: "Experiment updated", description: "The experiment status has been updated." });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "paused": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const calculateSignificance = (controlSuccess: number, controlTotal: number, variantSuccess: number, variantTotal: number) => {
    if (controlTotal < 30 || variantTotal < 30) return { significant: false, pValue: 1, improvement: 0 };
    
    const controlRate = controlSuccess / controlTotal;
    const variantRate = variantSuccess / variantTotal;
    const improvement = ((variantRate - controlRate) / controlRate) * 100;
    
    const pooledRate = (controlSuccess + variantSuccess) / (controlTotal + variantTotal);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlTotal + 1/variantTotal));
    const z = (variantRate - controlRate) / se;
    const pValue = 2 * (1 - normCDF(Math.abs(z)));
    
    return { significant: pValue < 0.05, pValue, improvement };
  };

  const normCDF = (x: number) => {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1 + sign * y);
  };

  const activeExperiments = experiments.filter(e => e.status === "running");
  const completedExperiments = experiments.filter(e => e.status === "completed");

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">A/B Experiments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test and compare different risk scoring algorithms
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-experiment">
              <Plus className="h-4 w-4 mr-2" />
              New Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Experiment</DialogTitle>
              <DialogDescription>
                Set up an A/B test to compare different risk scoring configurations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experiment Name</Label>
                  <Input
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment(s => ({ ...s, name: e.target.value }))}
                    placeholder="e.g., Higher TLS Weight Test"
                    data-testid="input-experiment-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Metric</Label>
                  <Select
                    value={newExperiment.primaryMetric}
                    onValueChange={(v) => setNewExperiment(s => ({ ...s, primaryMetric: v }))}
                  >
                    <SelectTrigger data-testid="select-primary-metric">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silent_auth_rate">Silent Auth Rate</SelectItem>
                      <SelectItem value="step_up_rate">Step-up Rate</SelectItem>
                      <SelectItem value="false_positive_rate">False Positive Rate</SelectItem>
                      <SelectItem value="fraud_detection_rate">Fraud Detection Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment(s => ({ ...s, description: e.target.value }))}
                  placeholder="Describe what this experiment is testing..."
                  data-testid="input-experiment-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Traffic Split (% to Variant)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={10}
                    max={90}
                    value={Math.round(newExperiment.trafficSplit * 100)}
                    onChange={(e) => setNewExperiment(s => ({ ...s, trafficSplit: parseInt(e.target.value) / 100 }))}
                    className="w-24"
                    data-testid="input-traffic-split"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-4 bg-muted rounded-full flex-1 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${newExperiment.trafficSplit * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-24">
                      {Math.round((1 - newExperiment.trafficSplit) * 100)}% Control
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Control Group</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Threshold:</span>
                      <span className="font-mono">{(newExperiment.controlConfig.threshold * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device Weight:</span>
                      <span className="font-mono">{(newExperiment.controlConfig.weights.device * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TLS Weight:</span>
                      <span className="font-mono">{(newExperiment.controlConfig.weights.tls * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Behavioral Weight:</span>
                      <span className="font-mono">{(newExperiment.controlConfig.weights.behavioral * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Variant Group</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Threshold:</span>
                      <Input
                        type="number"
                        min={50}
                        max={95}
                        value={Math.round(newExperiment.variantConfig.threshold * 100)}
                        onChange={(e) => setNewExperiment(s => ({
                          ...s,
                          variantConfig: { ...s.variantConfig, threshold: parseInt(e.target.value) / 100 }
                        }))}
                        className="w-16 h-6 text-xs"
                        data-testid="input-variant-threshold"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device Weight:</span>
                      <Input
                        type="number"
                        min={10}
                        max={60}
                        value={Math.round(newExperiment.variantConfig.weights.device * 100)}
                        onChange={(e) => setNewExperiment(s => ({
                          ...s,
                          variantConfig: { ...s.variantConfig, weights: { ...s.variantConfig.weights, device: parseInt(e.target.value) / 100 }}
                        }))}
                        className="w-16 h-6 text-xs"
                        data-testid="input-variant-device-weight"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TLS Weight:</span>
                      <Input
                        type="number"
                        min={10}
                        max={60}
                        value={Math.round(newExperiment.variantConfig.weights.tls * 100)}
                        onChange={(e) => setNewExperiment(s => ({
                          ...s,
                          variantConfig: { ...s.variantConfig, weights: { ...s.variantConfig.weights, tls: parseInt(e.target.value) / 100 }}
                        }))}
                        className="w-16 h-6 text-xs"
                        data-testid="input-variant-tls-weight"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Behavioral Weight:</span>
                      <Input
                        type="number"
                        min={10}
                        max={60}
                        value={Math.round(newExperiment.variantConfig.weights.behavioral * 100)}
                        onChange={(e) => setNewExperiment(s => ({
                          ...s,
                          variantConfig: { ...s.variantConfig, weights: { ...s.variantConfig.weights, behavioral: parseInt(e.target.value) / 100 }}
                        }))}
                        className="w-16 h-6 text-xs"
                        data-testid="input-variant-behavioral-weight"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createExperimentMutation.mutate(newExperiment)}
                disabled={!newExperiment.name || createExperimentMutation.isPending}
                data-testid="button-submit-experiment"
              >
                Create Experiment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Play className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="text-active-experiments">{activeExperiments.length}</p>
                <p className="text-sm text-muted-foreground">Active Experiments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="text-completed-experiments">{completedExperiments.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FlaskConical className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="text-total-experiments">{experiments.length}</p>
                <p className="text-sm text-muted-foreground">Total Experiments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {experiments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No experiments yet. Create your first A/B test to get started.</p>
              </CardContent>
            </Card>
          ) : (
            experiments.map((experiment) => {
              const stats = calculateSignificance(
                experiment.controlSuccesses || 0,
                experiment.controlSamples || 0,
                experiment.variantSuccesses || 0,
                experiment.variantSamples || 0
              );
              const controlRate = experiment.controlSamples ? ((experiment.controlSuccesses || 0) / experiment.controlSamples * 100) : 0;
              const variantRate = experiment.variantSamples ? ((experiment.variantSuccesses || 0) / experiment.variantSamples * 100) : 0;

              return (
                <Card key={experiment.id} data-testid={`card-experiment-${experiment.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <div>
                      <CardTitle className="text-base">{experiment.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{experiment.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(experiment.status || "draft")}>
                        {experiment.status}
                      </Badge>
                      {experiment.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => updateExperimentMutation.mutate({ id: experiment.id, updates: { status: "running", startDate: new Date() } })}
                          data-testid={`button-start-experiment-${experiment.id}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {experiment.status === "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateExperimentMutation.mutate({ id: experiment.id, updates: { status: "paused" } })}
                          data-testid={`button-pause-experiment-${experiment.id}`}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {experiment.status === "paused" && (
                        <Button
                          size="sm"
                          onClick={() => updateExperimentMutation.mutate({ id: experiment.id, updates: { status: "running" } })}
                          data-testid={`button-resume-experiment-${experiment.id}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Control Group</p>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Success Rate</span>
                            <span className="font-mono">{controlRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={controlRate} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {experiment.controlSuccesses || 0} / {experiment.controlSamples || 0} samples
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Variant Group</p>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Success Rate</span>
                            <span className="font-mono">{variantRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={variantRate} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {experiment.variantSuccesses || 0} / {experiment.variantSamples || 0} samples
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Results</p>
                        <div className="flex items-center gap-2">
                          {stats.improvement !== 0 && (
                            <TrendingUp className={`h-4 w-4 ${stats.improvement > 0 ? "text-green-500" : "text-red-500"}`} />
                          )}
                          <span className={`font-mono ${stats.improvement > 0 ? "text-green-500" : stats.improvement < 0 ? "text-red-500" : ""}`}>
                            {stats.improvement > 0 ? "+" : ""}{stats.improvement.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          p-value: {stats.pValue.toFixed(4)}
                        </p>
                        {stats.significant ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Statistically Significant
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Not Significant (need {Math.max(0, 30 - (experiment.controlSamples || 0))} more samples)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
