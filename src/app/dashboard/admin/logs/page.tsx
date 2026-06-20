"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, limit, Timestamp, where } from "firebase/firestore";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  entityPhone?: string;
}

export default function AuditLogsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("applications");

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") {
      fetchLogs();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const fetchLogs = async () => {
    try {
      const q = query(
        collection(db, "audit_logs"),
        where("actionType", "in", ["APP_STATUS_CHANGED", "PROFILE_VERIFICATION_CHANGED"]),
      );
      const snap = await getDocs(q);
      const fetchedLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
      // Sort by timestamp desc locally
      fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
      "Action Type": l.actionType === "APP_STATUS_CHANGED" ? "App Status" : "Profile Verification",
      Name: l.entityName,
      Phone: l.entityPhone || "N/A",
      "Previous Value": l.previousValue,
      "New Value": l.newValue,
      "Performed By": l.performedByName,
      Role: l.performedByRole,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.writeFile(
      workbook,
      `audit_${activeTab}_logs_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // Reset status filter when active tab changes
  useEffect(() => {
    setStatusFilter("all");
  }, [activeTab]);

  const currentTabLogs = logs.filter((log) => {
    if (activeTab === "applications") {
      return log.actionType === "APP_STATUS_CHANGED";
    } else {
      return log.actionType === "PROFILE_VERIFICATION_CHANGED";
    }
  });

  const filteredLogs = currentTabLogs.filter((log) => {
    // Search by name, phone, or application number
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      log.entityName.toLowerCase().includes(searchLower) ||
      log.performedByName.toLowerCase().includes(searchLower) ||
      (log.entityPhone && log.entityPhone.includes(searchLower)) ||
      (log.applicationNo && log.applicationNo.toLowerCase().includes(searchLower));

    // Actor/Auditor filter
    const matchesActor = actorFilter === "all" || log.performedByName === actorFilter;

    // Status filter
    const matchesStatus = statusFilter === "all" || log.newValue === statusFilter;

    return matchesSearch && matchesActor && matchesStatus;
  });

  // Grouping for applications only (to show list grouped by App ID)
  const groupedLogs = filteredLogs.reduce(
    (acc, log) => {
      const groupKey =
        activeTab === "applications"
          ? log.applicationNo || log.entityId || "Unknown App"
          : log.entityId || "Unknown User";

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(log);
      return acc;
    },
    {} as Record<string, AuditLog[]>,
  );

  const uniqueActors = Array.from(new Set(currentTabLogs.map((l) => l.performedByName)));

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
          Track and review application status changes and user profile approvals securely.
        </p>
      </div>

      <Tabs defaultValue="applications" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center mb-6">
          <TabsList className="bg-secondary/50 p-1 max-w-md w-full flex">
            <TabsTrigger value="applications" className="flex-1">
              📝 Applications ({logs.filter((l) => l.actionType === "APP_STATUS_CHANGED").length})
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex-1">
              👤 User Profiles (
              {logs.filter((l) => l.actionType === "PROFILE_VERIFICATION_CHANGED").length})
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone number, or application number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 border-0 w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
                <Select value={actorFilter} onValueChange={setActorFilter}>
                  <SelectTrigger className="bg-secondary/50 border-0 w-full sm:w-[200px]">
                    <SelectValue placeholder="Audited By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Auditors</SelectItem>
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
                    {activeTab === "applications" ? (
                      <>
                        <SelectItem value="accepted">Accepted (Under Review)</SelectItem>
                        <SelectItem value="selected">Selected (VIP Pass)</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  className="gap-2 w-full sm:w-auto shrink-0"
                >
                  <Download className="size-4" />
                  Export Tab
                </Button>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">
                        {activeTab === "applications" ? "Application No." : "User ID"}
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">Date & Time</th>
                      <th className="px-4 py-3">
                        {activeTab === "applications" ? "Applicant Details" : "User Details"}
                      </th>
                      <th className="px-4 py-3">Change Made</th>
                      <th className="px-4 py-3">Audited By</th>
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
                      Object.entries(groupedLogs).map(([groupKey, logsInGroup]) => (
                        <tr
                          key={`group-${groupKey}`}
                          className="hover:bg-secondary/20 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-primary align-top">
                            {activeTab === "applications"
                              ? groupKey.startsWith("BUP")
                                ? groupKey
                                : "N/A"
                              : groupKey.substring(0, 10) + "..."}
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
                                <div
                                  key={`${log.id}-details`}
                                  className="h-[40px] flex flex-col justify-center"
                                >
                                  <span>{log.entityName}</span>
                                  {log.entityPhone && (
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {log.entityPhone}
                                    </span>
                                  )}
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
                                      log.newValue === "approved" ||
                                      log.newValue === "verified"
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
      </Tabs>
    </div>
  );
}
