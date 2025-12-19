import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Search, Download, Eye, Shield, AlertTriangle, Settings, UserX } from "lucide-react";
import type { AuditLog } from "@shared/schema";

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    eventType: "",
    limit: 100,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const queryParams = new URLSearchParams();
  if (filters.eventType) queryParams.set("eventType", filters.eventType);
  queryParams.set("limit", filters.limit.toString());

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", filters],
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "auth_attempt": return <Shield className="h-4 w-4" />;
      case "threshold_change": return <Settings className="h-4 w-4" />;
      case "user_blocked": return <UserX className="h-4 w-4" />;
      case "alert_resolved": return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "auth_attempt": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "threshold_change": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "user_blocked": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "alert_resolved": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDecisionColor = (decision?: string | null) => {
    switch (decision) {
      case "approved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "denied": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "step_up": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Event Type", "Actor", "Action", "Target", "Decision", "IP Address"].join(","),
      ...logs.map(log => [
        formatDate(log.createdAt),
        log.eventType,
        log.actorId || "system",
        log.action,
        log.targetId || "-",
        log.decision || "-",
        log.ipAddress || "-",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compliance reporting and authentication decision history
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export-logs">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Select
                value={filters.eventType || "all"}
                onValueChange={(v) => setFilters(f => ({ ...f, eventType: v === "all" ? "" : v }))}
              >
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="auth_attempt">Authentication Attempts</SelectItem>
                  <SelectItem value="threshold_change">Threshold Changes</SelectItem>
                  <SelectItem value="user_blocked">User Blocked</SelectItem>
                  <SelectItem value="alert_resolved">Alert Resolved</SelectItem>
                  <SelectItem value="session_reviewed">Session Reviewed</SelectItem>
                  <SelectItem value="experiment_created">Experiment Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select
                value={filters.limit.toString()}
                onValueChange={(v) => setFilters(f => ({ ...f, limit: parseInt(v) }))}
              >
                <SelectTrigger data-testid="select-limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 logs</SelectItem>
                  <SelectItem value="100">100 logs</SelectItem>
                  <SelectItem value="500">500 logs</SelectItem>
                  <SelectItem value="1000">1000 logs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-sm font-medium">
            Audit Trail ({logs.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getEventColor(log.eventType)}>
                          <span className="flex items-center gap-1">
                            {getEventIcon(log.eventType)}
                            {log.eventType.replace(/_/g, " ")}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {log.actorType === "system" ? (
                            <Badge variant="outline">System</Badge>
                          ) : (
                            log.actorId?.slice(0, 8) || "-"
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.action}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.targetId ? `${log.targetType}: ${log.targetId.slice(0, 8)}...` : "-"}
                      </TableCell>
                      <TableCell>
                        {log.decision ? (
                          <Badge className={getDecisionColor(log.decision)}>
                            {log.decision}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {log.riskScore != null ? (
                          <span className="font-mono">{Math.round(log.riskScore * 100)}%</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          data-testid={`button-view-log-${log.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Event ID</p>
                  <p className="font-mono text-xs">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p>{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Event Type</p>
                  <Badge className={getEventColor(selectedLog.eventType)}>
                    {selectedLog.eventType.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <p className="font-mono">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actor</p>
                  <p>
                    <Badge variant="outline">{selectedLog.actorType}</Badge>
                    {selectedLog.actorId && <span className="ml-2 font-mono text-xs">{selectedLog.actorId}</span>}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target</p>
                  <p>
                    {selectedLog.targetType && <Badge variant="outline">{selectedLog.targetType}</Badge>}
                    {selectedLog.targetId && <span className="ml-2 font-mono text-xs">{selectedLog.targetId}</span>}
                  </p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.decision && (
                  <div>
                    <p className="text-muted-foreground">Decision</p>
                    <Badge className={getDecisionColor(selectedLog.decision)}>{selectedLog.decision}</Badge>
                  </div>
                )}
                {selectedLog.decisionReason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Decision Reason</p>
                    <p>{selectedLog.decisionReason}</p>
                  </div>
                )}
              </div>

              {(selectedLog.previousValue || selectedLog.newValue) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Changes</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.previousValue && (
                      <div className="p-3 bg-red-500/5 rounded-md">
                        <p className="text-xs text-muted-foreground mb-2">Previous Value</p>
                        <pre className="text-xs font-mono overflow-auto">
                          {JSON.stringify(selectedLog.previousValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValue && (
                      <div className="p-3 bg-green-500/5 rounded-md">
                        <p className="text-xs text-muted-foreground mb-2">New Value</p>
                        <pre className="text-xs font-mono overflow-auto">
                          {JSON.stringify(selectedLog.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Metadata</p>
                  <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
