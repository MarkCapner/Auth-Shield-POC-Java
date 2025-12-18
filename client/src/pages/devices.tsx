import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Monitor,
  Smartphone,
  Tablet,
  Search,
  ChevronRight,
  Shield,
  Clock,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { DeviceProfile } from "@shared/schema";

// Demo data for display
const demoDevices: Partial<DeviceProfile>[] = [
  {
    id: "1",
    fingerprint: "a1b2c3d4e5f6g7h8",
    browser: "Chrome",
    browserVersion: "120.0.6099",
    os: "Windows",
    osVersion: "10/11",
    deviceType: "desktop",
    screenWidth: 1920,
    screenHeight: 1080,
    timezone: "America/New_York",
    trustScore: 0.92,
    seenCount: 47,
    lastSeen: new Date(Date.now() - 1000 * 60 * 5),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "2",
    fingerprint: "x9y8z7w6v5u4t3s2",
    browser: "Safari",
    browserVersion: "17.2",
    os: "macOS",
    osVersion: "14.2",
    deviceType: "desktop",
    screenWidth: 2560,
    screenHeight: 1440,
    timezone: "America/Los_Angeles",
    trustScore: 0.88,
    seenCount: 23,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    id: "3",
    fingerprint: "m1n2o3p4q5r6s7t8",
    browser: "Chrome",
    browserVersion: "120.0.6099",
    os: "Android",
    osVersion: "14",
    deviceType: "mobile",
    screenWidth: 412,
    screenHeight: 915,
    timezone: "Europe/London",
    trustScore: 0.71,
    seenCount: 8,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: "4",
    fingerprint: "e5f6g7h8i9j0k1l2",
    browser: "Safari",
    browserVersion: "17.2",
    os: "iOS",
    osVersion: "17.2",
    deviceType: "tablet",
    screenWidth: 1024,
    screenHeight: 1366,
    timezone: "Asia/Tokyo",
    trustScore: 0.85,
    seenCount: 15,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 4),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
  },
  {
    id: "5",
    fingerprint: "q2w3e4r5t6y7u8i9",
    browser: "Firefox",
    browserVersion: "121.0",
    os: "Linux",
    osVersion: "Ubuntu 22.04",
    deviceType: "desktop",
    screenWidth: 1920,
    screenHeight: 1200,
    timezone: "Europe/Berlin",
    trustScore: 0.45,
    seenCount: 2,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 12),
    firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
];

function DeviceIcon({ type }: { type?: string }) {
  switch (type) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

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

export default function Devices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Partial<DeviceProfile> | null>(null);

  const { data: apiDevices, isLoading } = useQuery<Partial<DeviceProfile>[]>({
    queryKey: ["/api/devices"],
  });
  
  // Use API data if available, otherwise use demo data
  const devices = apiDevices && apiDevices.length > 0 ? apiDevices : demoDevices;

  const filteredDevices = devices.filter((device) => {
    const query = searchQuery.toLowerCase();
    return (
      device.fingerprint?.toLowerCase().includes(query) ||
      device.browser?.toLowerCase().includes(query) ||
      device.os?.toLowerCase().includes(query) ||
      device.deviceType?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Device Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and analyze recognized device fingerprints
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {devices.length} devices
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by fingerprint, browser, OS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-devices"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Device List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Fingerprint</TableHead>
                      <TableHead>Browser / OS</TableHead>
                      <TableHead>Trust</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredDevices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center">
                            <Monitor className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {searchQuery ? "No devices match your search" : "No devices found"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDevices.map((device) => (
                        <TableRow
                          key={device.id}
                          className={`cursor-pointer ${selectedDevice?.id === device.id ? "bg-muted/50" : ""}`}
                          onClick={() => setSelectedDevice(device)}
                          data-testid={`row-device-${device.id}`}
                        >
                          <TableCell>
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                              <DeviceIcon type={device.deviceType} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs font-mono">
                              {device.fingerprint?.slice(0, 12)}...
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {device.browser} {device.browserVersion?.split(".")[0]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {device.os} {device.osVersion}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <TrustBadge score={device.trustScore} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {device.seenCount} times
                              </span>
                              <span className="text-muted-foreground">
                                {device.lastSeen && formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
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

        {/* Device Details */}
        <div className="space-y-6">
          {selectedDevice ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">Device Details</CardTitle>
                  <TrustBadge score={selectedDevice.trustScore} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                      <DeviceIcon type={selectedDevice.deviceType} />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{selectedDevice.deviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDevice.browser} on {selectedDevice.os}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fingerprint</span>
                      <code className="font-mono text-xs">{selectedDevice.fingerprint}</code>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Screen</span>
                      <span>{selectedDevice.screenWidth}x{selectedDevice.screenHeight}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Timezone</span>
                      <span>{selectedDevice.timezone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trust Score</span>
                      <span className="font-mono">{Math.round((selectedDevice.trustScore || 0) * 100)}%</span>
                    </div>
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
                      <p className="text-sm font-medium">{selectedDevice.seenCount} visits</p>
                      <p className="text-xs text-muted-foreground">Total interactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedDevice.lastSeen && formatDistanceToNow(new Date(selectedDevice.lastSeen), { addSuffix: true })}
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
                        {selectedDevice.firstSeen && formatDistanceToNow(new Date(selectedDevice.firstSeen), { addSuffix: true })}
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
                <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Select a device from the list to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
