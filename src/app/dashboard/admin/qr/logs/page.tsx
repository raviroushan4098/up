"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  actionType: string;
  entityId: string;
  entityName: string;
  applicationNo?: string;
  previousValue: string;
  newValue: string;
  performedByUid: string;
  performedByName: string;
  performedByRole: string;
  timestamp: string;
}

export default function QrAuditLogsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actorFilter, setActorFilter] = useState<string>("all");

  useEffect(() => {
    if (authLoading) return;
    if (profile?.role !== "admin") return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const logsQuery = query(
          collection(db, "audit_logs"),
          where("actionType", "==", "PARTICIPANT_CHECKED_IN"),
          orderBy("timestamp", "desc"),
        );
        const logsSnap = await getDocs(logsQuery);
        const fetchedLogs: AuditLog[] = [];
        logsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedLogs.push({
            id: docSnap.id,
            actionType: data.actionType,
            entityId: data.entityId,
            entityName: data.entityName,
            applicationNo: data.applicationNo,
            previousValue: data.previousValue,
            newValue: data.newValue,
            performedByUid: data.performedByUid,
            performedByName: data.performedByName,
            performedByRole: data.performedByRole,
            timestamp:
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate().toISOString()
                : new Date().toISOString(),
          });
        });
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Failed to fetch QR scan logs", error);
        toast.error("Failed to load QR audit logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [profile, authLoading]);

  const uniqueActors = Array.from(new Set(logs.map((l) => l.performedByName)));

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      log.entityName.toLowerCase().includes(searchLower) ||
      (log.applicationNo || "").toLowerCase().includes(searchLower) ||
      log.performedByName.toLowerCase().includes(searchLower);

    const matchesActor = actorFilter === "all" || log.performedByName === actorFilter;

    return matchesSearch && matchesActor;
  });

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export.");
      return;
    }

    const data = filteredLogs.map((log) => ({
      "Date & Time": new Date(log.timestamp).toLocaleString("en-IN"),
      "Application No.": log.applicationNo || "N/A",
      "Applicant Name": log.entityName,
      "Change Made": "Checked In",
      "Scanned By": log.performedByName,
      "Scanner Role": log.performedByRole,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QR Scan Logs");
    XLSX.writeFile(workbook, `qr_scan_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="p-8 text-center text-destructive font-bold">Access Denied: Admins Only</div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-primary flex items-center gap-2">
          <ShieldCheck className="size-8" />
          QR Scan Audit Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete ledger of all VIP passes scanned by administrators and managers.
        </p>
      </div>

      <Card className="border-0 shadow-card">
        <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>All Scans</CardTitle>
            <CardDescription>
              Monitor checking operations globally across your event.
            </CardDescription>
          </div>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2 shrink-0">
            <Download className="size-4" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by pass, applicant, or scanner name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-0 w-full"
              />
            </div>

            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="bg-secondary/50 border-0 w-full sm:w-[250px] shrink-0">
                <SelectValue placeholder="Filter by Scanner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scanners</SelectItem>
                {uniqueActors.map((actor) => (
                  <SelectItem key={actor} value={actor}>
                    {actor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                    <th className="px-6 py-4 whitespace-nowrap">Pass Details</th>
                    <th className="px-6 py-4">Scanned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        No QR scan logs found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-primary">{log.entityName}</div>
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            {log.applicationNo || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">{log.performedByName}</span>
                            <Badge
                              variant="outline"
                              className="w-fit bg-secondary/50 text-xs text-muted-foreground capitalize"
                            >
                              {log.performedByRole}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
