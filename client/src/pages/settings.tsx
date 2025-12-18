import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Sliders,
  Bell,
  Monitor,
  Fingerprint,
  Activity,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface RiskSettings {
  authThreshold: number;
  deviceWeight: number;
  tlsWeight: number;
  behavioralWeight: number;
  enableSilentAuth: boolean;
  enableStepUp: boolean;
  stepUpMethod: string;
  sessionTimeout: number;
  maxDevicesPerUser: number;
  trustDecayDays: number;
  enableAnomalyDetection: boolean;
  alertOnLowConfidence: boolean;
  alertThreshold: number;
}

const defaultSettings: RiskSettings = {
  authThreshold: 70,
  deviceWeight: 40,
  tlsWeight: 30,
  behavioralWeight: 30,
  enableSilentAuth: true,
  enableStepUp: true,
  stepUpMethod: "otp",
  sessionTimeout: 30,
  maxDevicesPerUser: 5,
  trustDecayDays: 30,
  enableAnomalyDetection: true,
  alertOnLowConfidence: true,
  alertThreshold: 40,
};

export default function Settings() {
  const [settings, setSettings] = useState<RiskSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const updateSetting = <K extends keyof RiskSettings>(key: K, value: RiskSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your risk configuration has been updated successfully.",
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
    toast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
    });
  };

  const totalWeight = settings.deviceWeight + settings.tlsWeight + settings.behavioralWeight;
  const weightValid = totalWeight === 100;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Risk Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure authentication thresholds and scoring weights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            data-testid="button-reset-settings"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !weightValid}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="thresholds" className="gap-2">
            <Sliders className="h-4 w-4" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="weights" className="gap-2">
            <Shield className="h-4 w-4" />
            Scoring Weights
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Authentication Threshold
              </CardTitle>
              <CardDescription>
                Minimum confidence score required for silent authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Confidence Threshold</Label>
                  <Badge variant={settings.authThreshold >= 70 ? "default" : "secondary"}>
                    {settings.authThreshold}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.authThreshold]}
                  onValueChange={([value]) => updateSetting("authThreshold", value)}
                  min={30}
                  max={95}
                  step={5}
                  data-testid="slider-auth-threshold"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Less Secure (30%)</span>
                  <span>More Secure (95%)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Silent Authentication</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Allow users to authenticate without additional steps when confidence is high
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableSilentAuth}
                    onCheckedChange={(checked) => updateSetting("enableSilentAuth", checked)}
                    data-testid="switch-silent-auth"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Step-Up Verification</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Require additional verification when confidence is below threshold
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableStepUp}
                    onCheckedChange={(checked) => updateSetting("enableStepUp", checked)}
                    data-testid="switch-step-up"
                  />
                </div>

                {settings.enableStepUp && (
                  <div className="space-y-2">
                    <Label>Step-Up Method</Label>
                    <Select
                      value={settings.stepUpMethod}
                      onValueChange={(value) => updateSetting("stepUpMethod", value)}
                    >
                      <SelectTrigger data-testid="select-step-up-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="otp">One-Time Password (OTP)</SelectItem>
                        <SelectItem value="email">Email Verification</SelectItem>
                        <SelectItem value="sms">SMS Verification</SelectItem>
                        <SelectItem value="security_question">Security Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Session Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value) || 30)}
                    min={5}
                    max={1440}
                    data-testid="input-session-timeout"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Devices Per User</Label>
                  <Input
                    type="number"
                    value={settings.maxDevicesPerUser}
                    onChange={(e) => updateSetting("maxDevicesPerUser", parseInt(e.target.value) || 5)}
                    min={1}
                    max={20}
                    data-testid="input-max-devices"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trust Decay Period (days)</Label>
                  <Input
                    type="number"
                    value={settings.trustDecayDays}
                    onChange={(e) => updateSetting("trustDecayDays", parseInt(e.target.value) || 30)}
                    min={7}
                    max={365}
                    data-testid="input-trust-decay"
                  />
                  <p className="text-xs text-muted-foreground">
                    Days before device trust score begins to decay without activity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Risk Score Weights</CardTitle>
              <CardDescription>
                Configure how each factor contributes to the overall risk score
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!weightValid && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Weights must sum to 100% (currently {totalWeight}%)</span>
                </div>
              )}
              
              {weightValid && (
                <div className="flex items-center gap-2 p-3 bg-status-online/10 border border-status-online/20 rounded-md text-status-online text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Weight configuration is valid</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-chart-1" />
                      <Label>Device Score Weight</Label>
                    </div>
                    <Badge variant="outline">{settings.deviceWeight}%</Badge>
                  </div>
                  <Slider
                    value={[settings.deviceWeight]}
                    onValueChange={([value]) => updateSetting("deviceWeight", value)}
                    min={0}
                    max={100}
                    step={5}
                    data-testid="slider-device-weight"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-chart-2" />
                      <Label>TLS Score Weight</Label>
                    </div>
                    <Badge variant="outline">{settings.tlsWeight}%</Badge>
                  </div>
                  <Slider
                    value={[settings.tlsWeight]}
                    onValueChange={([value]) => updateSetting("tlsWeight", value)}
                    min={0}
                    max={100}
                    step={5}
                    data-testid="slider-tls-weight"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-chart-3" />
                      <Label>Behavioral Score Weight</Label>
                    </div>
                    <Badge variant="outline">{settings.behavioralWeight}%</Badge>
                  </div>
                  <Slider
                    value={[settings.behavioralWeight]}
                    onValueChange={([value]) => updateSetting("behavioralWeight", value)}
                    min={0}
                    max={100}
                    step={5}
                    data-testid="slider-behavioral-weight"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total</span>
                  <span className={`font-mono ${weightValid ? "text-status-online" : "text-destructive"}`}>
                    {totalWeight}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alert Configuration
              </CardTitle>
              <CardDescription>
                Configure when and how you receive security alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Anomaly Detection</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically detect suspicious authentication patterns
                  </p>
                </div>
                <Switch
                  checked={settings.enableAnomalyDetection}
                  onCheckedChange={(checked) => updateSetting("enableAnomalyDetection", checked)}
                  data-testid="switch-anomaly-detection"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alert on Low Confidence</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive alerts when authentication confidence falls below threshold
                  </p>
                </div>
                <Switch
                  checked={settings.alertOnLowConfidence}
                  onCheckedChange={(checked) => updateSetting("alertOnLowConfidence", checked)}
                  data-testid="switch-low-confidence-alert"
                />
              </div>

              {settings.alertOnLowConfidence && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Alert Threshold</Label>
                    <Badge variant="secondary">{settings.alertThreshold}%</Badge>
                  </div>
                  <Slider
                    value={[settings.alertThreshold]}
                    onValueChange={([value]) => updateSetting("alertThreshold", value)}
                    min={10}
                    max={60}
                    step={5}
                    data-testid="slider-alert-threshold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Trigger alert when confidence score falls below this percentage
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
