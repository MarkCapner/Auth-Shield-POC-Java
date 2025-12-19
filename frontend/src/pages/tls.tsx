import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Fingerprint,
  Search,
  ChevronRight,
  Shield,
  Clock,
  Eye,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { TlsFingerprint } from "@shared/schema";

// Demo data for display
const demoFingerprints: Partial<TlsFingerprint>[] = [
  {
    id: "1",
    ja3Hash: "e7d705a3286e19ea42f587b344ee6865",
    ja4Hash: "t13d1516h2_8daaf6152771_02d4dd3fe9",
    tlsVersion: "TLS 1.3",
    cipherSuites: ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
    extensions: ["server_name", "ec_point_formats", "supported_groups", "signature_algorithms", "application_layer_protocol_negotiation"],
    trustScore: 0.95,
    seenCount: 156,
    lastSeen: new Date(Date.now() - 1000 * 60 * 2),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
  },
  {
    id: "2",
    ja3Hash: "b32309a26951912be7dba376398abc3b",
    ja4Hash: "t13d1412h2_9b3c17a8f210_a1b2c3d4e5",
    tlsVersion: "TLS 1.3",
    cipherSuites: ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256", "TLS_AES_128_GCM_SHA256"],
    extensions: ["server_name", "supported_groups", "ec_point_formats", "signature_algorithms"],
    trustScore: 0.88,
    seenCount: 89,
    lastSeen: new Date(Date.now() - 1000 * 60 * 15),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "3",
    ja3Hash: "a0e9f5d64349fb13191bc781f81f42e1",
    ja4Hash: "t12d1110h1_7d8e9f0a1b2c_x9y8z7w6v5",
    tlsVersion: "TLS 1.2",
    cipherSuites: ["TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"],
    extensions: ["server_name", "renegotiation_info", "supported_groups"],
    trustScore: 0.72,
    seenCount: 34,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    id: "4",
    ja3Hash: "c5b9876543210fedcba9876543210fed",
    ja4Hash: "t13d1516h2_1a2b3c4d5e6f_m1n2o3p4q5",
    tlsVersion: "TLS 1.3",
    cipherSuites: ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384"],
    extensions: ["server_name", "supported_versions", "key_share", "psk_key_exchange_modes"],
    trustScore: 0.45,
    seenCount: 3,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 6),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
  },
];

function TrustBadge({ score }: { score?: number }) {
  if (score === undefined) return null;

  const getVariant = () => {
    if (score >= 0.8) return "bg-status-online/10 text-status-online border-status-online/20";
    if (score >= 0.5) return "bg-status-away/10 text-status-away border-status-away/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getLabel = () => {
    if (score >= 0.8) return "High Trust";
    if (score >= 0.5) return "Medium";
    return "Low Trust";
  };

  return (
    <Badge variant="outline" className={getVariant()}>
      {getLabel()}
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 text-status-online" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export default function TLS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFingerprint, setSelectedFingerprint] = useState<Partial<TlsFingerprint> | null>(null);

  const { data: apiFingerprints, isLoading } = useQuery<Partial<TlsFingerprint>[]>({
    queryKey: ["/api/tls-fingerprints"],
  });
  
  // Use API data if available, otherwise use demo data
  const fingerprints = apiFingerprints && apiFingerprints.length > 0 ? apiFingerprints : demoFingerprints;

  const filteredFingerprints = fingerprints.filter((fp) => {
    const query = searchQuery.toLowerCase();
    return (
      fp.ja3Hash?.toLowerCase().includes(query) ||
      fp.ja4Hash?.toLowerCase().includes(query) ||
      fp.tlsVersion?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">TLS Fingerprints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            JA3/JA4-style transport layer signatures for identity verification
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {fingerprints.length} signatures
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by JA3, JA4, or TLS version..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-tls"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fingerprint List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">TLS Signatures</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>JA3 Hash</TableHead>
                      <TableHead>TLS Version</TableHead>
                      <TableHead>Trust</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      [...Array(4)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredFingerprints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center">
                            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {searchQuery ? "No fingerprints match your search" : "No TLS fingerprints found"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFingerprints.map((fp) => (
                        <TableRow
                          key={fp.id}
                          className={`cursor-pointer ${selectedFingerprint?.id === fp.id ? "bg-muted/50" : ""}`}
                          onClick={() => setSelectedFingerprint(fp)}
                          data-testid={`row-tls-${fp.id}`}
                        >
                          <TableCell>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                              <Fingerprint className="h-4 w-4" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono">
                              {fp.ja3Hash?.slice(0, 16)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{fp.tlsVersion}</Badge>
                          </TableCell>
                          <TableCell>
                            <TrustBadge score={fp.trustScore} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {fp.seenCount} times
                              </span>
                              <span className="text-muted-foreground">
                                {fp.lastSeen && formatDistanceToNow(new Date(fp.lastSeen), { addSuffix: true })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Fingerprint Details */}
        <div className="space-y-6">
          {selectedFingerprint ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">Signature Details</CardTitle>
                  <TrustBadge score={selectedFingerprint.trustScore} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedFingerprint.tlsVersion}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFingerprint.cipherSuites?.length || 0} cipher suites
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">JA3 Hash</span>
                        <CopyButton text={selectedFingerprint.ja3Hash || ""} />
                      </div>
                      <code className="text-xs font-mono block p-2 bg-muted rounded break-all">
                        {selectedFingerprint.ja3Hash}
                      </code>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">JA4 Hash</span>
                        <CopyButton text={selectedFingerprint.ja4Hash || ""} />
                      </div>
                      <code className="text-xs font-mono block p-2 bg-muted rounded break-all">
                        {selectedFingerprint.ja4Hash}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Cipher Suites</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {selectedFingerprint.cipherSuites?.map((suite, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">
                        {suite}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Extensions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {selectedFingerprint.extensions?.map((ext, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ext}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Eye className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedFingerprint.seenCount} occurrences</p>
                      <p className="text-xs text-muted-foreground">Total matches</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedFingerprint.lastSeen && formatDistanceToNow(new Date(selectedFingerprint.lastSeen), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">Last seen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedFingerprint.firstSeen && formatDistanceToNow(new Date(selectedFingerprint.firstSeen), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">First seen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Select a signature from the list to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
