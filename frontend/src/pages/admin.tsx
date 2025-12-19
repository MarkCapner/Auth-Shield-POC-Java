import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, AlertTriangle, Shield, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AdminSetting, FlaggedSession, AnomalyAlert } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<FlaggedSession | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AnomalyAlert | null>(null);

  const { data: settings = [] } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: flaggedSessions = [] } = useQuery<FlaggedSession[]>({
    queryKey: ["/api/flagged-sessions"],
  });

  const { data: anomalyAlerts = [] } = useQuery<AnomalyAlert[]>({
    queryKey: ["/api/anomaly-alerts"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description, category }: { key: string; value: any; description?: string; category?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/settings/${key}`, { value, description, category });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Setting updated", description: "The setting has been saved successfully." });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async ({ id, resolution, resolvedBy }: { id: string; resolution: string; resolvedBy: string }) => {
      const response = await apiRequest("PATCH", `/api/anomaly-alerts/${id}/resolve`, { resolution, resolvedBy });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anomaly-alerts"] });
      setSelectedAlert(null);
      toast({ title: "Alert resolved", description: "The anomaly alert has been resolved." });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, status, resolution, reviewedBy }: { id: string; status: string; resolution?: string; reviewedBy?: string }) => {
      const response = await apiRequest("PATCH", `/api/flagged-sessions/${id}`, { status, resolution, reviewedBy, reviewedAt: new Date() });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flagged-sessions"] });
      setSelectedSession(null);
      toast({ title: "Session updated", description: "The flagged session has been updated." });
    },
  });

  const [thresholdSettings, setThresholdSettings] = useState({
    silentAuthThreshold: 0.7,
    deviceWeight: 0.4,
    tlsWeight: 0.3,
    behavioralWeight: 0.3,
    impossibleTravelSpeed: 1000,
    maxFailedAttempts: 5,
  });

  useEffect(() => {
    if (settings.length > 0) {
      setThresholdSettings({
        silentAuthThreshold: settings.find(s => s.settingKey === "silent_auth_threshold")?.settingValue ?? 0.7,
        deviceWeight: settings.find(s => s.settingKey === "device_weight")?.settingValue ?? 0.4,
        tlsWeight: settings.find(s => s.settingKey === "tls_weight")?.settingValue ?? 0.3,
        behavioralWeight: settings.find(s => s.settingKey === "behavioral_weight")?.settingValue ?? 0.3,
        impossibleTravelSpeed: settings.find(s => s.settingKey === "impossible_travel_speed")?.settingValue ?? 1000,
        maxFailedAttempts: settings.find(s => s.settingKey === "max_failed_attempts")?.settingValue ?? 5,
      });
    }
  }, [settings]);

  const handleSaveThresholds = () => {
    updateSettingMutation.mutate({ key: "silent_auth_threshold", value: thresholdSettings.silentAuthThreshold, description: "Minimum confidence score for silent authentication", category: "thresholds" });
    updateSettingMutation.mutate({ key: "device_weight", value: thresholdSettings.deviceWeight, description: "Weight for device score in risk calculation", category: "weights" });
    updateSettingMutation.mutate({ key: "tls_weight", value: thresholdSettings.tlsWeight, description: "Weight for TLS score in risk calculation", category: "weights" });
    updateSettingMutation.mutate({ key: "behavioral_weight", value: thresholdSettings.behavioralWeight, description: "Weight for behavioral score in risk calculation", category: "weights" });
    updateSettingMutation.mutate({ key: "impossible_travel_speed", value: thresholdSettings.impossibleTravelSpeed, description: "Speed threshold (km/h) for impossible travel detection", category: "alerts" });
    updateSettingMutation.mutate({ key: "max_failed_attempts", value: thresholdSettings.maxFailedAttempts, description: "Maximum failed attempts before IP blacklisting", category: "alerts" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const unresolvedAlerts = anomalyAlerts.filter(a => !a.resolved);
  const pendingSessions = flaggedSessions.filter(s => s.status === "pending");

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure risk thresholds and manage flagged sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unresolvedAlerts.length > 0 && (
            <Badge variant="destructive" data-testid="badge-unresolved-alerts">
              {unresolvedAlerts.length} Unresolved Alerts
            </Badge>
          )}
          {pendingSessions.length > 0 && (
            <Badge variant="secondary" data-testid="badge-pending-sessions">
              {pendingSessions.length} Pending Reviews
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="thresholds">
        <TabsList>
          <TabsTrigger value="thresholds" data-testid="tab-thresholds">
            <Settings className="h-4 w-4 mr-2" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Anomaly Alerts
          </TabsTrigger>
          <TabsTrigger value="sessions" data-testid="tab-sessions">
            <Shield className="h-4 w-4 mr-2" />
            Flagged Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Authentication Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Silent Auth Threshold</Label>
                    <span className="text-sm font-mono">{Math.round(thresholdSettings.silentAuthThreshold * 100)}%</span>
                  </div>
                  <Slider
                    value={[thresholdSettings.silentAuthThreshold * 100]}
                    onValueChange={([v]) => setThresholdSettings(s => ({ ...s, silentAuthThreshold: v / 100 }))}
                    min={50}
                    max={95}
                    step={5}
                    data-testid="slider-silent-auth-threshold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users with confidence above this threshold will be silently authenticated
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Max Failed Attempts</Label>
                    <span className="text-sm font-mono">{thresholdSettings.maxFailedAttempts}</span>
                  </div>
                  <Slider
                    value={[thresholdSettings.maxFailedAttempts]}
                    onValueChange={([v]) => setThresholdSettings(s => ({ ...s, maxFailedAttempts: v }))}
                    min={3}
                    max={10}
                    step={1}
                    data-testid="slider-max-failed-attempts"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of failed attempts before IP is blacklisted
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Risk Score Weights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Device Weight</Label>
                    <span className="text-sm font-mono">{Math.round(thresholdSettings.deviceWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[thresholdSettings.deviceWeight * 100]}
                    onValueChange={([v]) => setThresholdSettings(s => ({ ...s, deviceWeight: v / 100 }))}
                    min={10}
                    max={60}
                    step={5}
                    data-testid="slider-device-weight"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>TLS Weight</Label>
                    <span className="text-sm font-mono">{Math.round(thresholdSettings.tlsWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[thresholdSettings.tlsWeight * 100]}
                    onValueChange={([v]) => setThresholdSettings(s => ({ ...s, tlsWeight: v / 100 }))}
                    min={10}
                    max={60}
                    step={5}
                    data-testid="slider-tls-weight"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Behavioral Weight</Label>
                    <span className="text-sm font-mono">{Math.round(thresholdSettings.behavioralWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[thresholdSettings.behavioralWeight * 100]}
                    onValueChange={([v]) => setThresholdSettings(s => ({ ...s, behavioralWeight: v / 100 }))}
                    min={10}
                    max={60}
                    step={5}
                    data-testid="slider-behavioral-weight"
                  />
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  Total: {Math.round((thresholdSettings.deviceWeight + thresholdSettings.tlsWeight + thresholdSettings.behavioralWeight) * 100)}%
                  {Math.round((thresholdSettings.deviceWeight + thresholdSettings.tlsWeight + thresholdSettings.behavioralWeight) * 100) !== 100 && (
                    <span className="text-destructive ml-2">(Should equal 100%)</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Anomaly Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Impossible Travel Speed (km/h)</Label>
                    <span className="text-sm font-mono">{thresholdSettings.impossibleTravelSpeed}</span>
                  </div>
                  <Slider
                    value={[thresholdSettings.impossibleTravelSpeed]}
                    onValueChange={([v]) => setThresholdSettings(s => ({ ...s, impossibleTravelSpeed: v }))}
                    min={500}
                    max={2000}
                    step={100}
                    data-testid="slider-impossible-travel-speed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Login attempts requiring travel speed above this will trigger alerts
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-end">
              <Button 
                onClick={handleSaveThresholds}
                disabled={updateSettingMutation.isPending}
                className="w-full"
                data-testid="button-save-thresholds"
              >
                Save All Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Anomaly Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalyAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No anomaly alerts
                        </TableCell>
                      </TableRow>
                    ) : (
                      anomalyAlerts.map((alert) => (
                        <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`}>
                          <TableCell className="font-mono text-xs">{alert.alertType}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{alert.description}</TableCell>
                          <TableCell>
                            <span className="font-mono">{Math.round((alert.riskScore || 0) * 100)}%</span>
                          </TableCell>
                          <TableCell>
                            {alert.resolved ? (
                              <Badge variant="secondary">Resolved</Badge>
                            ) : (
                              <Badge variant="destructive">Open</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!alert.resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedAlert(alert)}
                                data-testid={`button-resolve-alert-${alert.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Flagged Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No flagged sessions
                        </TableCell>
                      </TableRow>
                    ) : (
                      flaggedSessions.map((session) => (
                        <TableRow key={session.id} data-testid={`row-session-${session.id}`}>
                          <TableCell className="font-mono text-xs">{session.sessionId?.slice(0, 8)}...</TableCell>
                          <TableCell className="max-w-xs truncate">{session.reason}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(session.severity || "medium")}>
                              {session.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{Math.round((session.riskScore || 0) * 100)}%</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.status === "pending" ? "destructive" : "secondary"}>
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSession(session)}
                                data-testid={`button-review-session-${session.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Anomaly Alert</DialogTitle>
            <DialogDescription>
              Review the alert details and choose a resolution
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-mono">{selectedAlert.alertType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <p>
                    <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedAlert.description}</p>
                </div>
                {selectedAlert.travelDistanceKm && (
                  <div>
                    <Label className="text-muted-foreground">Distance</Label>
                    <p>{Math.round(selectedAlert.travelDistanceKm)} km</p>
                  </div>
                )}
                {selectedAlert.requiredSpeedKmh && (
                  <div>
                    <Label className="text-muted-foreground">Required Speed</Label>
                    <p>{Math.round(selectedAlert.requiredSpeedKmh)} km/h</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => resolveAlertMutation.mutate({ id: selectedAlert!.id, resolution: "legitimate", resolvedBy: "admin" })}
              data-testid="button-mark-legitimate"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Legitimate
            </Button>
            <Button
              variant="destructive"
              onClick={() => resolveAlertMutation.mutate({ id: selectedAlert!.id, resolution: "blocked", resolvedBy: "admin" })}
              data-testid="button-block-user"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Flagged Session</DialogTitle>
            <DialogDescription>
              Review the session details and take action
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Session ID</Label>
                  <p className="font-mono text-xs">{selectedSession.sessionId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <p>
                    <Badge className={getSeverityColor(selectedSession.severity || "medium")}>{selectedSession.severity}</Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Reason</Label>
                  <p>{selectedSession.reason}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => updateSessionMutation.mutate({ id: selectedSession!.id, status: "dismissed", resolution: "false_positive", reviewedBy: "admin" })}
              data-testid="button-dismiss-session"
            >
              <Clock className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateSessionMutation.mutate({ id: selectedSession!.id, status: "resolved", resolution: "session_revoked", reviewedBy: "admin" })}
              data-testid="button-revoke-session"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Revoke Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
