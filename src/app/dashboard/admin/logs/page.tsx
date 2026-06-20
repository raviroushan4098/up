"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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

export default function AuditLogsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") {
      fetchLogs();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const fetchLogs = async () => {
    try {
      const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(500));
      const snap = await getDocs(q);
      const fetchedLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export.");
      return;
    }

    const data = filteredLogs.map((l) => ({
      "Application No.": l.applicationNo || "N/A",
      Date: new Date(l.timestamp).toLocaleString("en-IN"),
      "Action Type": l.actionType,
      "Applicant / Record": l.entityName,
      "Previous Value": l.previousValue,
      "New Value": l.newValue,
      "Performed By": l.performedByName,
      Role: l.performedByRole,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const filteredLogs = logs.filter((log) => {
    // Search
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      log.entityName.toLowerCase().includes(searchLower) ||
      log.performedByName.toLowerCase().includes(searchLower);

    // Actor filter
    const matchesActor = actorFilter === "all" || log.performedByName === actorFilter;

    // Status filter
    const matchesStatus = statusFilter === "all" || log.newValue === statusFilter;

    return matchesSearch && matchesActor && matchesStatus;
  });

  const groupedLogs = filteredLogs.reduce(
    (acc, log) => {
      const appNo = log.applicationNo || log.entityId || "Unknown App";
      if (!acc[appNo]) {
        acc[appNo] = [];
      }
      acc[appNo].push(log);
      return acc;
    },
    {} as Record<string, AuditLog[]>,
  );

  const uniqueActors = Array.from(new Set(logs.map((l) => l.performedByName)));

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
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-primary flex items-center gap-2">
          <ShieldCheck className="size-8" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          Track and review all application status changes and manager actions securely.
        </p>
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by applicant or manager name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-0 w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
              <Select value={actorFilter} onValueChange={setActorFilter}>
                <SelectTrigger className="bg-secondary/50 border-0 w-full sm:w-[200px]">
                  <SelectValue placeholder="Managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {uniqueActors.map((actor) => (
                    <SelectItem key={actor} value={actor}>
                      {actor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-secondary/50 border-0 w-full sm:w-[160px]">
                  <SelectValue placeholder="Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="gap-2 w-full sm:w-auto shrink-0"
              >
                <Download className="size-4" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Application No.</th>
                    <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-3">Applicant / Record</th>
                    <th className="px-4 py-3">Change Made</th>
                    <th className="px-4 py-3">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.keys(groupedLogs).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No audit logs found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedLogs).map(([appNo, logsInGroup]) => (
                      <tr
                        key={`group-${appNo}`}
                        className="hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-primary align-top">
                          {appNo.startsWith("BUP") ? appNo : "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground align-top">
                          <div className="flex flex-col gap-4">
                            {logsInGroup.map((log) => (
                              <div key={`${log.id}-time`} className="h-[40px] flex items-center">
                                {new Date(log.timestamp).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-primary align-top">
                          <div className="flex flex-col gap-4">
                            {logsInGroup.map((log) => (
                              <div key={`${log.id}-name`} className="h-[40px] flex items-center">
                                {log.entityName}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-4">
                            {logsInGroup.map((log) => (
                              <div
                                key={`${log.id}-change`}
                                className="h-[40px] flex items-center gap-2"
                              >
                                <Badge
                                  variant="outline"
                                  className="capitalize text-muted-foreground"
                                >
                                  {log.previousValue}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge
                                  variant="default"
                                  className={
                                    log.newValue === "accepted" ||
                                    log.newValue === "selected" ||
                                    log.newValue === "approved"
                                      ? "bg-success hover:bg-success text-success-foreground"
                                      : log.newValue === "rejected"
                                        ? "bg-destructive hover:bg-destructive text-destructive-foreground"
                                        : "capitalize"
                                  }
                                >
                                  {log.newValue}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-4">
                            {logsInGroup.map((log) => (
                              <div
                                key={`${log.id}-user`}
                                className="h-[40px] flex flex-col justify-center"
                              >
                                <span className="font-semibold">{log.performedByName}</span>
                                <span className="text-xs text-muted-foreground capitalize leading-none">
                                  {log.performedByRole}
                                </span>
                              </div>
                            ))}
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
