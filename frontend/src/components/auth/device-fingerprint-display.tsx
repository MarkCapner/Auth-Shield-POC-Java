import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, Check, Monitor, Globe, Cpu, Palette, Info } from "lucide-react";
import { useState } from "react";
import type { DeviceProfile } from "@shared/schema";

function getDeviceTrustExplanation(profile: Partial<DeviceProfile>): { level: string; reasons: string[] } {
  const score = profile.trustScore || 0;
  const reasons: string[] = [];
  
  if (score >= 0.7) {
    if (profile.seenCount && profile.seenCount >= 3) {
      reasons.push(`Device seen ${profile.seenCount} times - consistent usage builds trust`);
    }
    if (profile.canvasFingerprint) {
      reasons.push("Canvas fingerprint verified - unique hardware signature");
    }
    if (profile.webglRenderer) {
      reasons.push("WebGL signature captured - GPU hardware confirmed");
    }
    if (profile.audioFingerprint) {
      reasons.push("Audio fingerprint stable - consistent hardware profile");
    }
    return { level: "high", reasons: reasons.length > 0 ? reasons : ["Device has been verified through multiple interactions"] };
  }
  
  if (score >= 0.4) {
    if (profile.seenCount === 1) {
      reasons.push("First time seeing this device - needs more verification");
    }
    if (profile.seenCount && profile.seenCount < 3) {
      reasons.push(`Only seen ${profile.seenCount} time(s) - building trust`);
    }
    if (!profile.canvasFingerprint) {
      reasons.push("Canvas fingerprint not available - limited verification");
    }
    if (!profile.webglRenderer) {
      reasons.push("WebGL signature missing - GPU not verified");
    }
    return { level: "medium", reasons: reasons.length > 0 ? reasons : ["Device partially verified - additional signals needed"] };
  }
  
  reasons.push("New or unrecognized device");
  if (!profile.seenCount || profile.seenCount === 0) {
    reasons.push("Never seen before - requires authentication");
  }
  if (!profile.canvasFingerprint && !profile.webglRenderer) {
    reasons.push("No hardware fingerprints captured");
  }
  return { level: "low", reasons };
}

interface DeviceFingerprintDisplayProps {
  profile: Partial<DeviceProfile> | null;
  isLoading?: boolean;
  showCopy?: boolean;
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: any }) {
  if (value === null || value === undefined) return null;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{label}</span>
      </div>
      <span className="text-sm font-mono">{String(value)}</span>
    </div>
  );
}

function FingerprintHash({ hash, onCopy }: { hash: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-muted rounded-md p-3">
      <code className="flex-1 text-xs font-mono break-all" data-testid="text-fingerprint-hash">
        {hash}
      </code>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCopy}
        data-testid="button-copy-fingerprint"
      >
        {copied ? (
          <Check className="h-4 w-4 text-status-online" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function DeviceFingerprintDisplay({
  profile,
  isLoading,
  showCopy = true,
}: DeviceFingerprintDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Device Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Monitor className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No device profile captured
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trustColor = (profile.trustScore || 0) >= 0.7 
    ? "text-status-online" 
    : (profile.trustScore || 0) >= 0.4 
    ? "text-status-away" 
    : "text-destructive";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium">Device Profile</CardTitle>
        {profile.trustScore !== undefined && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0" data-testid="button-device-trust-info">
                <Badge variant="outline" className={`${trustColor} cursor-pointer`} data-testid="badge-device-trust">
                  Trust: {Math.round((profile.trustScore ?? 0) * 100)}%
                  <Info className="h-3 w-3 ml-1" />
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="end">
              <div className="space-y-2">
                <p className="font-medium capitalize">{getDeviceTrustExplanation(profile).level} Trust Score</p>
                <ul className="text-sm space-y-1">
                  {getDeviceTrustExplanation(profile).reasons.map((reason, i) => (
                    <li key={i} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.fingerprint && showCopy && (
          <FingerprintHash hash={profile.fingerprint} onCopy={() => {}} />
        )}
        
        <div className="space-y-0">
          <InfoRow label="Browser" value={`${profile.browser} ${profile.browserVersion || ""}`} icon={Globe} />
          <InfoRow label="Operating System" value={`${profile.os} ${profile.osVersion || ""}`} icon={Monitor} />
          <InfoRow label="Device Type" value={profile.deviceType} icon={Monitor} />
          <InfoRow label="Platform" value={profile.platform} icon={Cpu} />
          <InfoRow 
            label="Screen" 
            value={profile.screenWidth && profile.screenHeight 
              ? `${profile.screenWidth}x${profile.screenHeight}` 
              : undefined
            } 
            icon={Palette} 
          />
          <InfoRow label="Color Depth" value={profile.colorDepth ? `${profile.colorDepth}-bit` : undefined} />
          <InfoRow label="Timezone" value={profile.timezone} />
          <InfoRow label="Language" value={profile.language} />
          <InfoRow label="CPU Cores" value={profile.hardwareConcurrency} icon={Cpu} />
          <InfoRow label="Device Memory" value={profile.deviceMemory ? `${profile.deviceMemory} GB` : undefined} />
          <InfoRow label="Touch Support" value={profile.touchSupport ? "Yes" : "No"} />
        </div>

        {profile.webglRenderer && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">WebGL Renderer</p>
            <p className="text-xs font-mono break-all">{profile.webglRenderer}</p>
          </div>
        )}

        {profile.seenCount !== undefined && (
          <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
            <span>Seen {profile.seenCount} time{profile.seenCount !== 1 ? 's' : ''}</span>
            {profile.firstSeen && (
              <span>First seen: {new Date(profile.firstSeen).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
