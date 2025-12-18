import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, Check, Fingerprint, Lock, Info } from "lucide-react";
import { useState } from "react";
import type { TlsFingerprint } from "@shared/schema";

function getTlsTrustExplanation(fingerprint: Partial<TlsFingerprint>): { level: string; reasons: string[] } {
  const score = fingerprint.trustScore || 0;
  const reasons: string[] = [];
  
  if (score >= 0.7) {
    if (fingerprint.seenCount && fingerprint.seenCount >= 3) {
      reasons.push(`TLS signature seen ${fingerprint.seenCount} times - consistent browser`);
    }
    if (fingerprint.ja3Hash) {
      reasons.push("JA3 hash verified - known browser fingerprint");
    }
    if (fingerprint.ja4Hash) {
      reasons.push("JA4 hash captured - enhanced fingerprint confirmed");
    }
    if (fingerprint.tlsVersion === "TLSv1.3") {
      reasons.push("Using TLS 1.3 - modern secure protocol");
    }
    if (fingerprint.cipherSuites && fingerprint.cipherSuites.length > 0) {
      reasons.push(`${fingerprint.cipherSuites.length} cipher suites - matches known profile`);
    }
    return { level: "high", reasons: reasons.length > 0 ? reasons : ["TLS signature matches known secure patterns"] };
  }
  
  if (score >= 0.4) {
    if (fingerprint.seenCount === 1) {
      reasons.push("First time seeing this TLS signature");
    }
    if (fingerprint.seenCount && fingerprint.seenCount < 3) {
      reasons.push(`Only seen ${fingerprint.seenCount} time(s) - building trust`);
    }
    if (!fingerprint.ja4Hash) {
      reasons.push("JA4 fingerprint not available - limited verification");
    }
    if (fingerprint.tlsVersion && fingerprint.tlsVersion !== "TLSv1.3") {
      reasons.push(`Using ${fingerprint.tlsVersion} - older protocol version`);
    }
    return { level: "medium", reasons: reasons.length > 0 ? reasons : ["TLS partially verified - needs more observations"] };
  }
  
  reasons.push("Unknown or suspicious TLS signature");
  if (!fingerprint.seenCount || fingerprint.seenCount === 0) {
    reasons.push("Never seen before - could be new browser or spoofed");
  }
  if (!fingerprint.ja3Hash) {
    reasons.push("No JA3 hash - unable to verify browser identity");
  }
  if (fingerprint.cipherSuites && fingerprint.cipherSuites.length < 5) {
    reasons.push("Limited cipher suites - unusual configuration");
  }
  return { level: "low", reasons };
}

interface TlsSignatureDisplayProps {
  fingerprint: Partial<TlsFingerprint> | null;
  isLoading?: boolean;
}

function HashDisplay({ label, hash }: { label: string; hash?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCopy}
          data-testid={`button-copy-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {copied ? (
            <Check className="h-3 w-3 text-status-online" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <code className="block p-3 bg-muted rounded-md text-xs font-mono break-all">
        {hash}
      </code>
    </div>
  );
}

function ArrayDisplay({ label, items }: { label: string; items?: string[] | null }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 20).map((item, i) => (
          <Badge key={i} variant="secondary" className="font-mono text-xs">
            {item}
          </Badge>
        ))}
        {items.length > 20 && (
          <Badge variant="outline" className="text-xs">
            +{items.length - 20} more
          </Badge>
        )}
      </div>
    </div>
  );
}

export function TlsSignatureDisplay({
  fingerprint,
  isLoading,
}: TlsSignatureDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!fingerprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">TLS Fingerprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No TLS fingerprint captured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              TLS fingerprinting requires server-side analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trustColor = (fingerprint.trustScore || 0) >= 0.7 
    ? "text-status-online" 
    : (fingerprint.trustScore || 0) >= 0.4 
    ? "text-status-away" 
    : "text-destructive";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Fingerprint className="h-4 w-4" />
          TLS Fingerprint
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {fingerprint.tlsVersion && (
            <Badge variant="outline">{fingerprint.tlsVersion}</Badge>
          )}
          {fingerprint.trustScore !== undefined && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0" data-testid="button-tls-trust-info">
                  <Badge variant="outline" className={`${trustColor} cursor-pointer`} data-testid="badge-tls-trust">
                    Trust: {Math.round((fingerprint.trustScore ?? 0) * 100)}%
                    <Info className="h-3 w-3 ml-1" />
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="bottom" align="end">
                <div className="space-y-2">
                  <p className="font-medium capitalize">{getTlsTrustExplanation(fingerprint).level} Trust Score</p>
                  <ul className="text-sm space-y-1">
                    {getTlsTrustExplanation(fingerprint).reasons.map((reason, i) => (
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
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ja3" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ja3">JA3</TabsTrigger>
            <TabsTrigger value="ja4">JA4</TabsTrigger>
          </TabsList>
          <TabsContent value="ja3" className="space-y-4 mt-4">
            <HashDisplay label="JA3 Hash" hash={fingerprint.ja3Hash} />
            {fingerprint.ja3Full && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">JA3 Full String</span>
                <code className="block p-3 bg-muted rounded-md text-xs font-mono break-all max-h-[100px] overflow-auto">
                  {fingerprint.ja3Full}
                </code>
              </div>
            )}
          </TabsContent>
          <TabsContent value="ja4" className="space-y-4 mt-4">
            <HashDisplay label="JA4 Hash" hash={fingerprint.ja4Hash} />
            {fingerprint.ja4Full && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">JA4 Full String</span>
                <code className="block p-3 bg-muted rounded-md text-xs font-mono break-all max-h-[100px] overflow-auto">
                  {fingerprint.ja4Full}
                </code>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-6 pt-4 border-t border-border">
          <ArrayDisplay label="Cipher Suites" items={fingerprint.cipherSuites} />
          <ArrayDisplay label="Extensions" items={fingerprint.extensions} />
          <ArrayDisplay label="Supported Groups" items={fingerprint.supportedGroups} />
          <ArrayDisplay label="Signature Algorithms" items={fingerprint.signatureAlgorithms} />
          <ArrayDisplay label="ALPN Protocols" items={fingerprint.alpnProtocols} />
        </div>

        {fingerprint.seenCount !== undefined && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border text-xs text-muted-foreground">
            <span>Seen {fingerprint.seenCount} time{fingerprint.seenCount !== 1 ? 's' : ''}</span>
            {fingerprint.firstSeen && (
              <span>First seen: {new Date(fingerprint.firstSeen).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
