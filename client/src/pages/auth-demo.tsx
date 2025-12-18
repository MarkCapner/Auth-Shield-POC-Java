import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { MouseTracker } from "@/components/auth/mouse-tracker";
import { KeystrokeTracker } from "@/components/auth/keystroke-tracker";
import { ScrollTracker } from "@/components/auth/scroll-tracker";
import { TouchTracker } from "@/components/auth/touch-tracker";
import { DeviceFingerprintDisplay } from "@/components/auth/device-fingerprint-display";
import { TlsSignatureDisplay } from "@/components/auth/tls-signature-display";
import { AuthenticationFlow } from "@/components/auth/authentication-flow";
import { ConfidenceGauge } from "@/components/dashboard/confidence-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collectDeviceFingerprint, type DeviceFingerprint } from "@/lib/device-fingerprint";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Play, Pause } from "lucide-react";
import type { DeviceProfile, TlsFingerprint } from "@shared/schema";

interface BiometricData {
  mousePoints: number;
  keystrokeEvents: number;
  avgMouseSpeed: number;
  avgKeystrokeHold: number;
  scrollEvents: number;
  avgScrollSpeed: number;
  scrollFrequency: number;
  mouseAcceleration: number;
  flightTime: number;
  typingSpeed: number;
}

export default function AuthDemo() {
  const [isCapturing, setIsCapturing] = useState(true);
  const [deviceProfile, setDeviceProfile] = useState<Partial<DeviceProfile> | null>(null);
  const [tlsFingerprint, setTlsFingerprint] = useState<Partial<TlsFingerprint> | null>(null);
  const [biometricData, setBiometricData] = useState<BiometricData>({
    mousePoints: 0,
    keystrokeEvents: 0,
    avgMouseSpeed: 0,
    avgKeystrokeHold: 0,
    scrollEvents: 0,
    avgScrollSpeed: 0,
    scrollFrequency: 0,
    mouseAcceleration: 0,
    flightTime: 0,
    typingSpeed: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [scores, setScores] = useState({
    device: 0,
    tls: 0,
    behavioral: 0,
    overall: 0,
  });
  const [isCollecting, setIsCollecting] = useState(false);
  const { toast } = useToast();

  // Mutation to send device fingerprint to backend
  const deviceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/devices", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.trustScore) {
        setDeviceProfile(prev => prev ? { ...prev, trustScore: data.trustScore, seenCount: data.seenCount } : prev);
      }
    },
  });

  // Mutation to calculate risk score
  const riskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calculate-risk", data);
      return response.json();
    },
    onSuccess: (data) => {
      setScores({
        device: data.factors?.deviceFamiliarity || scores.device,
        tls: data.factors?.tlsConsistency || scores.tls,
        behavioral: data.factors?.behavioralMatch || scores.behavioral,
        overall: data.overallScore,
      });
      toast({
        title: data.passed ? "Authentication Approved" : "Step-up Required",
        description: `Confidence: ${Math.round(data.overallScore * 100)}%`,
      });
    },
  });

  // Mutation to get ML-based behavioral score
  const mlScoreMutation = useMutation({
    mutationFn: async (data: { userId: string; currentBehavior: any }) => {
      const response = await apiRequest("POST", "/api/ml/score", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.behavioralScore !== undefined) {
        setScores(prev => ({
          ...prev,
          behavioral: data.behavioralScore,
          overall: (prev.device * 0.35 + prev.tls * 0.25 + data.behavioralScore * 0.40),
        }));
      }
    },
  });

  // Reference to track last save time
  const lastPatternSaveRef = useRef<number>(0);

  // Collect device fingerprint on mount and send to backend
  useEffect(() => {
    const collect = async () => {
      setIsCollecting(true);
      try {
        const fingerprint = await collectDeviceFingerprint();
        
        // Set local state first
        const profile = {
          ...fingerprint,
          trustScore: 0.75,
          seenCount: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
        } as Partial<DeviceProfile>;
        setDeviceProfile(profile);

        // Send to backend to register/update device
        deviceMutation.mutate({
          fingerprint: fingerprint.fingerprint,
          userAgent: fingerprint.userAgent,
          browser: fingerprint.browser,
          browserVersion: fingerprint.browserVersion,
          os: fingerprint.os,
          osVersion: fingerprint.osVersion,
          deviceType: fingerprint.deviceType,
          screenWidth: fingerprint.screenWidth,
          screenHeight: fingerprint.screenHeight,
          colorDepth: fingerprint.colorDepth,
          timezone: fingerprint.timezone,
          language: fingerprint.language,
          platform: fingerprint.platform,
          hardwareConcurrency: fingerprint.hardwareConcurrency,
          deviceMemory: fingerprint.deviceMemory,
          touchSupport: fingerprint.touchSupport,
          webglVendor: fingerprint.webglVendor,
          webglRenderer: fingerprint.webglRenderer,
          canvasFingerprint: fingerprint.canvasFingerprint,
          audioFingerprint: fingerprint.audioFingerprint,
          fonts: fingerprint.fonts,
          plugins: fingerprint.plugins,
        });

        // Simulate TLS fingerprint (server-side in production)
        const tlsData = {
          ja3Hash: generateRandomHash(),
          ja3Full: "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
          ja4Hash: generateRandomHash(),
          ja4Full: "t13d1516h2_8daaf6152771_" + generateRandomHash().slice(0, 12),
          tlsVersion: "TLS 1.3",
          cipherSuites: ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
          extensions: ["server_name", "ec_point_formats", "supported_groups", "signature_algorithms"],
          supportedGroups: ["x25519", "secp256r1", "secp384r1"],
          signatureAlgorithms: ["ecdsa_secp256r1_sha256", "rsa_pss_rsae_sha256"],
          alpnProtocols: ["h2", "http/1.1"],
          trustScore: 0.85,
          seenCount: 1,
          firstSeen: new Date(),
          lastSeen: new Date(),
        };
        setTlsFingerprint(tlsData);
      } catch (error) {
        console.error("Failed to collect fingerprint:", error);
      }
      setIsCollecting(false);
    };

    collect();
  }, []);

  // Fetch current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", { credentials: "include" });
        if (response.ok) {
          const user = await response.json();
          setUserId(user.id);
        }
      } catch (error) {
        console.log("Not logged in or error fetching user");
      }
    };
    fetchUser();
  }, []);

  // Update scores and call ML scoring when behavioral data changes significantly
  useEffect(() => {
    const deviceScore = deviceProfile?.trustScore || 0;
    const tlsScore = tlsFingerprint?.trustScore || 0;
    
    // Calculate a base behavioral score from event counts (for users without baseline)
    const totalBiometricEvents = biometricData.mousePoints + biometricData.keystrokeEvents + biometricData.scrollEvents;
    const baseBehavioralScore = Math.min(1, totalBiometricEvents / 100) * 0.5 + 0.3;

    // If we have a user ID and enough data, call the ML scoring engine
    if (userId && totalBiometricEvents > 20) {
      mlScoreMutation.mutate({
        userId,
        currentBehavior: {
          mouseVelocity: biometricData.avgMouseSpeed,
          mouseAcceleration: biometricData.mouseAcceleration,
          clickInterval: 500, // Default estimate
          dwellTime: biometricData.avgKeystrokeHold,
          flightTime: biometricData.flightTime,
          typingSpeed: biometricData.typingSpeed,
          scrollSpeed: biometricData.avgScrollSpeed,
          scrollFrequency: biometricData.scrollFrequency,
        },
      });
    }

    // Update with base score (ML mutation will update if successful)
    setScores(prev => ({
      device: deviceScore,
      tls: tlsScore,
      behavioral: prev.behavioral > 0 ? prev.behavioral : baseBehavioralScore,
      overall: (deviceScore * 0.35 + tlsScore * 0.25 + (prev.behavioral > 0 ? prev.behavioral : baseBehavioralScore) * 0.40),
    }));
  }, [deviceProfile, tlsFingerprint, biometricData, userId]);

  const handleMouseData = useCallback((points: any[]) => {
    const speeds = points.map(p => p.speed || 0).filter(s => s > 0);
    const accelerations = points.map(p => p.acceleration || 0).filter(a => a !== 0);
    setBiometricData(prev => ({
      ...prev,
      mousePoints: points.length,
      avgMouseSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      mouseAcceleration: accelerations.length > 0 ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0,
    }));
  }, []);

  const handleKeystrokeData = useCallback((events: any[]) => {
    const holdTimes = events.map(e => e.holdTime).filter(t => t > 0);
    const flightTimes = events.map(e => e.flightTime).filter(t => t > 0);
    const typingSpeeds = events.length > 1 ? events.slice(1).map((e, i) => {
      const prevTimestamp = events[i].timestamp;
      const currentTimestamp = e.timestamp;
      return currentTimestamp - prevTimestamp;
    }).filter(t => t > 0 && t < 2000) : [];
    
    setBiometricData(prev => ({
      ...prev,
      keystrokeEvents: events.length,
      avgKeystrokeHold: holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0,
      flightTime: flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0,
      typingSpeed: typingSpeeds.length > 0 ? 60000 / (typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length) : 0,
    }));
  }, []);

  const handleScrollData = useCallback((data: { events: any[]; avgSpeed: number; frequency: number }) => {
    setBiometricData(prev => ({
      ...prev,
      scrollEvents: data.events.length,
      avgScrollSpeed: data.avgSpeed,
      scrollFrequency: data.frequency,
    }));
  }, []);

  // Periodically save behavioral patterns to database for baseline building
  useEffect(() => {
    const totalEvents = biometricData.mousePoints + biometricData.keystrokeEvents + biometricData.scrollEvents;
    const now = Date.now();
    
    // Only save if we have enough data and haven't saved recently (every 10 seconds)
    if (totalEvents > 50 && now - lastPatternSaveRef.current > 10000) {
      lastPatternSaveRef.current = now;
      
      // Save mouse pattern
      if (biometricData.avgMouseSpeed > 0) {
        apiRequest("POST", "/api/behavioral-patterns", {
          patternType: "mouse",
          avgMouseSpeed: biometricData.avgMouseSpeed,
          avgMouseAcceleration: biometricData.mouseAcceleration,
          sampleCount: biometricData.mousePoints,
        }).catch(console.error);
      }
      
      // Save keystroke pattern
      if (biometricData.avgKeystrokeHold > 0) {
        apiRequest("POST", "/api/behavioral-patterns", {
          patternType: "keystroke",
          avgKeyHoldTime: biometricData.avgKeystrokeHold,
          avgFlightTime: biometricData.flightTime,
          typingSpeed: biometricData.typingSpeed,
          sampleCount: biometricData.keystrokeEvents,
        }).catch(console.error);
      }
      
      // Save scroll pattern (if we have scroll data)
      if (biometricData.avgScrollSpeed > 0) {
        apiRequest("POST", "/api/behavioral-patterns", {
          patternType: "scroll",
          sampleCount: biometricData.scrollEvents,
        }).catch(console.error);
      }
    }
  }, [biometricData]);

  const handleRefresh = async () => {
    setIsCollecting(true);
    try {
      const fingerprint = await collectDeviceFingerprint();
      setDeviceProfile({
        ...fingerprint,
        trustScore: deviceProfile?.trustScore || 0.75,
        seenCount: (deviceProfile?.seenCount || 0) + 1,
        firstSeen: deviceProfile?.firstSeen || new Date(),
        lastSeen: new Date(),
      } as Partial<DeviceProfile>);
      
      // Re-send to backend
      deviceMutation.mutate({
        fingerprint: fingerprint.fingerprint,
        userAgent: fingerprint.userAgent,
        browser: fingerprint.browser,
        browserVersion: fingerprint.browserVersion,
        os: fingerprint.os,
        osVersion: fingerprint.osVersion,
        deviceType: fingerprint.deviceType,
        screenWidth: fingerprint.screenWidth,
        screenHeight: fingerprint.screenHeight,
        colorDepth: fingerprint.colorDepth,
        timezone: fingerprint.timezone,
        language: fingerprint.language,
        platform: fingerprint.platform,
        hardwareConcurrency: fingerprint.hardwareConcurrency,
        deviceMemory: fingerprint.deviceMemory,
        touchSupport: fingerprint.touchSupport,
        webglVendor: fingerprint.webglVendor,
        webglRenderer: fingerprint.webglRenderer,
        canvasFingerprint: fingerprint.canvasFingerprint,
        audioFingerprint: fingerprint.audioFingerprint,
        fonts: fingerprint.fonts,
        plugins: fingerprint.plugins,
      });
    } catch (error) {
      console.error("Failed to refresh fingerprint:", error);
    }
    setIsCollecting(false);
  };

  // Handle auth flow starting - call backend risk calculation
  const handleAuthStart = useCallback(() => {
    setIsCapturing(true);
    
    // Use the current scores from state (which includes ML-based behavioral score)
    riskMutation.mutate({
      deviceFingerprint: deviceProfile?.fingerprint,
      deviceScore: scores.device,
      tlsScore: scores.tls,
      behavioralScore: scores.behavioral,
    });
  }, [deviceProfile, scores, riskMutation]);

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Authentication Demo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Experience passwordless, risk-based authentication in action
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCapturing(!isCapturing)}
            data-testid="button-toggle-capture"
          >
            {isCapturing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Capture
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Capture
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isCollecting}
            data-testid="button-refresh-fingerprint"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCollecting ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Auth Flow and Biometrics */}
        <div className="space-y-6">
          <AuthenticationFlow
            currentConfidence={scores.overall}
            threshold={0.7}
            deviceScore={scores.device}
            tlsScore={scores.tls}
            behavioralScore={scores.behavioral}
            onAuthStart={handleAuthStart}
            onAuthComplete={(success, method) => {
              console.log(`Auth ${success ? "succeeded" : "failed"} via ${method}`);
            }}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Biometric Capture Stats</CardTitle>
              <Badge variant={isCapturing ? "default" : "secondary"}>
                {isCapturing ? "Active" : "Paused"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-semibold" data-testid="text-mouse-points">{biometricData.mousePoints}</p>
                  <p className="text-xs text-muted-foreground">Mouse Points</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-semibold" data-testid="text-keystroke-events">{biometricData.keystrokeEvents}</p>
                  <p className="text-xs text-muted-foreground">Keystrokes</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-semibold" data-testid="text-scroll-events">{biometricData.scrollEvents}</p>
                  <p className="text-xs text-muted-foreground">Scroll Events</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-semibold" data-testid="text-avg-speed">{biometricData.avgMouseSpeed.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg Mouse Speed</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-semibold" data-testid="text-avg-hold">{biometricData.avgKeystrokeHold.toFixed(0)}ms</p>
                  <p className="text-xs text-muted-foreground">Avg Key Hold</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xl font-semibold" data-testid="text-scroll-speed">{biometricData.avgScrollSpeed.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg Scroll Speed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <MouseTracker
            onDataCapture={handleMouseData}
            isActive={isCapturing}
          />

          <KeystrokeTracker
            onDataCapture={handleKeystrokeData}
            isActive={isCapturing}
          />

          <ScrollTracker
            onDataCapture={handleScrollData}
            isActive={isCapturing}
          />

          <TouchTracker
            isActive={isCapturing}
          />
        </div>

        {/* Right Column - Fingerprints and Scores */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <ConfidenceGauge
              score={scores.overall}
              threshold={0.7}
              size={180}
              label="Overall Confidence"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Device Score</span>
                  <span className="font-mono">{Math.round(scores.device * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-1 rounded-full transition-all duration-500"
                    style={{ width: `${scores.device * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>TLS Score</span>
                  <span className="font-mono">{Math.round(scores.tls * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-2 rounded-full transition-all duration-500"
                    style={{ width: `${scores.tls * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Behavioral Score</span>
                  <span className="font-mono">{Math.round(scores.behavioral * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-3 rounded-full transition-all duration-500"
                    style={{ width: `${scores.behavioral * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="device" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="device">Device Profile</TabsTrigger>
              <TabsTrigger value="tls">TLS Signature</TabsTrigger>
            </TabsList>
            <TabsContent value="device" className="mt-4">
              <DeviceFingerprintDisplay
                profile={deviceProfile}
                isLoading={isCollecting && !deviceProfile}
              />
            </TabsContent>
            <TabsContent value="tls" className="mt-4">
              <TlsSignatureDisplay
                fingerprint={tlsFingerprint}
                isLoading={isCollecting && !tlsFingerprint}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function generateRandomHash(): string {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 32; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}
