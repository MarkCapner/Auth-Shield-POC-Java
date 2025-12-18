import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Fingerprint,
  Monitor,
  Activity,
} from "lucide-react";

type AuthState = 
  | "idle"
  | "collecting"
  | "analyzing"
  | "silent_success"
  | "step_up_required"
  | "step_up_verifying"
  | "success"
  | "failed";

interface AuthenticationFlowProps {
  onAuthStart?: () => void;
  onAuthComplete?: (success: boolean, method: "silent" | "step_up") => void;
  currentConfidence?: number;
  threshold?: number;
  deviceScore?: number;
  tlsScore?: number;
  behavioralScore?: number;
}

const stageLabels: Record<AuthState, { title: string; description: string }> = {
  idle: {
    title: "Ready to Authenticate",
    description: "Click to begin the authentication process",
  },
  collecting: {
    title: "Collecting Identity Signals",
    description: "Gathering device, TLS, and behavioral data",
  },
  analyzing: {
    title: "Analyzing Risk Profile",
    description: "Computing confidence score from collected signals",
  },
  silent_success: {
    title: "Silent Authentication Successful",
    description: "High confidence - identity verified without additional steps",
  },
  step_up_required: {
    title: "Additional Verification Required",
    description: "Confidence below threshold - please verify your identity",
  },
  step_up_verifying: {
    title: "Verifying Code",
    description: "Checking your verification code",
  },
  success: {
    title: "Authentication Complete",
    description: "Your identity has been verified successfully",
  },
  failed: {
    title: "Authentication Failed",
    description: "Unable to verify identity - please try again",
  },
};

export function AuthenticationFlow({
  onAuthStart,
  onAuthComplete,
  currentConfidence = 0,
  threshold = 0.7,
  deviceScore = 0,
  tlsScore = 0,
  behavioralScore = 0,
}: AuthenticationFlowProps) {
  const [state, setState] = useState<AuthState>("idle");
  const [progress, setProgress] = useState(0);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (state === "collecting") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setState("analyzing");
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }

    if (state === "analyzing") {
      const timer = setTimeout(() => {
        if (currentConfidence >= threshold) {
          setState("silent_success");
          setTimeout(() => {
            setState("success");
            onAuthComplete?.(true, "silent");
          }, 1500);
        } else {
          setState("step_up_required");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, currentConfidence, threshold, onAuthComplete]);

  const handleStart = () => {
    setState("collecting");
    setProgress(0);
    onAuthStart?.();
  };

  const handleReset = () => {
    setState("idle");
    setProgress(0);
    setOtpCode("");
  };

  const handleVerifyOtp = () => {
    setState("step_up_verifying");
    setTimeout(() => {
      if (otpCode.length >= 4) {
        setState("success");
        onAuthComplete?.(true, "step_up");
      } else {
        setState("failed");
        onAuthComplete?.(false, "step_up");
      }
    }, 1500);
  };

  const getStateIcon = () => {
    switch (state) {
      case "idle":
        return <Shield className="h-12 w-12 text-muted-foreground" />;
      case "collecting":
      case "analyzing":
      case "step_up_verifying":
        return <Loader2 className="h-12 w-12 text-primary animate-spin" />;
      case "silent_success":
      case "success":
        return <CheckCircle className="h-12 w-12 text-status-online" />;
      case "step_up_required":
        return <AlertTriangle className="h-12 w-12 text-status-away" />;
      case "failed":
        return <XCircle className="h-12 w-12 text-destructive" />;
    }
  };

  const confidenceColor = currentConfidence >= threshold 
    ? "text-status-online" 
    : currentConfidence >= threshold * 0.7 
    ? "text-status-away" 
    : "text-destructive";

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          {getStateIcon()}
        </div>
        <CardTitle className="text-lg">{stageLabels[state].title}</CardTitle>
        <CardDescription>{stageLabels[state].description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(state === "collecting" || state === "analyzing") && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {state === "collecting" ? "Collecting data..." : "Analyzing..."}
              </span>
              <span className="font-mono">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {(state === "analyzing" || state === "silent_success" || state === "step_up_required" || state === "success") && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confidence Score</span>
              <span className={`text-lg font-semibold ${confidenceColor}`}>
                {Math.round(currentConfidence * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-background rounded-md">
                <Monitor className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="text-sm font-mono">{Math.round(deviceScore * 100)}%</p>
              </div>
              <div className="p-2 bg-background rounded-md">
                <Fingerprint className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">TLS</p>
                <p className="text-sm font-mono">{Math.round(tlsScore * 100)}%</p>
              </div>
              <div className="p-2 bg-background rounded-md">
                <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Behavior</p>
                <p className="text-sm font-mono">{Math.round(behavioralScore * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Threshold:</span>
              <Badge variant="outline">{Math.round(threshold * 100)}%</Badge>
            </div>
          </div>
        )}

        {state === "step_up_required" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp" className="text-sm">Verification Code</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Enter the code sent to your registered device
              </p>
              <Input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
                data-testid="input-otp-code"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleVerifyOtp}
              disabled={otpCode.length < 4}
              data-testid="button-verify-otp"
            >
              Verify Code
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {state === "idle" && (
          <Button className="w-full" onClick={handleStart} data-testid="button-start-auth">
            Begin Authentication
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {(state === "success" || state === "failed") && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleReset}
            data-testid="button-reset-auth"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
