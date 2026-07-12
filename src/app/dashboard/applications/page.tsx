"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  doc,
  updateDoc,
  setDoc,
  increment,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { logAuditAction } from "@/lib/audit";
import { EventApplication } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { sendApplicationSelectedEmail, sendApplicationRejectedEmail } from "@/actions/email";
import {
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  Video,
  X,
  Search,
  Download,
  User,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ApplicationsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [statusLogs, setStatusLogs] = useState<Record<string, any[]>>({});
  const [rejectTarget, setRejectTarget] = useState<EventApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);

  const handleDownloadVideo = async (url: string, filename: string) => {
    setDownloadingVideo(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Download started successfully");
    } catch (error) {
      console.error("Direct download failed, falling back to new window:", error);
      // Fallback: Open in new window if CORS/fetch fails
      window.open(url, "_blank");
    } finally {
      setDownloadingVideo(false);
    }
  };

  const handleViewUserProfile = async (userId: string) => {
    setFetchingProfile(true);
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setSelectedUserProfile(userDoc.data());
      } else {
        toast.error("User profile not found.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch user profile.");
    } finally {
      setFetchingProfile(false);
    }
  };

  const openRejectDialog = (app: EventApplication) => {
    setRejectTarget(app);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    await updateStatus(rejectTarget.id, "rejected", rejectionReason.trim());
    setRejectDialogOpen(false);
    setRejectTarget(null);
  };

  useEffect(() => {
    if (!authLoading && user && profile) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let q;
      if (profile?.role === "admin" || profile?.role === "manager") {
        q = query(collection(db, "applications"), orderBy("appliedAt", "desc"));
      } else {
        q = query(
          collection(db, "applications"),
          where("userId", "==", user!.uid),
          orderBy("appliedAt", "desc"),
        );
      }
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventApplication[];
      setApplications(fetched.filter((app) => !app.isTeamPass));

      // Fetch status change logs for privileged users
      if (profile?.role === "admin" || profile?.role === "manager") {
        try {
          const auditQ = query(
            collection(db, "audit_logs"),
            where("actionType", "==", "APP_STATUS_CHANGED"),
          );
          const auditSnap = await getDocs(auditQ);
          const logsMap: Record<string, any[]> = {};
          auditSnap.docs.forEach((d) => {
            const data = d.data();
            const appId = data.entityId;
            if (appId) {
              if (!logsMap[appId]) logsMap[appId] = [];
              logsMap[appId].push({ id: d.id, ...data });
            }
          });
          // Sort each group by timestamp desc
          Object.keys(logsMap).forEach((appId) => {
            logsMap[appId].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            );
          });
          setStatusLogs(logsMap);
        } catch (err) {
          console.error("Failed to fetch status logs:", err);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    appId: string,
    newStatus: "accepted" | "selected" | "rejected",
    rejectionReason?: string,
  ) => {
    try {
      const appData = applications.find((a) => a.id === appId);
      if (!appData) return;

      const updateData: any = { status: newStatus };
      if (newStatus === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      } else {
        updateData.rejectionReason = deleteField();
      }

      await updateDoc(doc(db, "applications", appId), updateData);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: newStatus,
                rejectionReason: newStatus === "rejected" ? rejectionReason : undefined,
              }
            : a,
        ),
      );
      toast.success(`Application marked as ${newStatus}`);

      // Log the audit action
      if (profile && user) {
        const logPayload = {
          actionType: "APP_STATUS_CHANGED",
          entityId: appId,
          entityName: appData.applicantName || appData.applicationNo || "Unknown Applicant",
          applicationNo: appData.applicationNo,
          previousValue: appData.status,
          newValue: newStatus,
          performedByUid: user.uid,
          performedByName: profile.fullName || "Unknown Name",
          performedByRole: profile.role || "unknown",
          entityPhone: appData.applicantPhone || "",
          timestamp: new Date().toISOString(),
        };
        logAuditAction(logPayload);
        setStatusLogs((prev) => ({
          ...prev,
          [appId]: [logPayload, ...(prev[appId] || [])],
        }));
      }

      // Try to get event title for the email
      let eventTitle = "Bhavishya E Uttar Pradesh Event";
      try {
        const eventDoc = await getDoc(doc(db, "events", appData.eventId));
        if (eventDoc.exists()) {
          eventTitle = eventDoc.data().title;
        }
      } catch (e) {
        console.error("Failed to fetch event title for email", e);
      }

      // Trigger the appropriate email action
      if (appData.applicantEmail) {
        if (newStatus === "selected") {
          await sendApplicationSelectedEmail(
            appData.applicantEmail,
            appData.applicantName,
            eventTitle,
          );
        } else if (newStatus === "rejected") {
          await sendApplicationRejectedEmail(
            appData.applicantEmail,
            appData.applicantName,
            eventTitle,
            rejectionReason,
          );
        }
      }

      // Sync Global Counters
      try {
        if (newStatus === "accepted") {
          await setDoc(
            doc(db, "counters", "global"),
            {
              approvedApplications: increment(1),
            },
            { merge: true },
          );
        } else if (newStatus === "selected") {
          await setDoc(
            doc(db, "counters", "global"),
            {
              selectedApplications: increment(1),
            },
            { merge: true },
          );
        }
      } catch (e) {
        console.error("Failed to update global counter", e);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  if (authLoading) return null;

  const isPrivileged = profile?.role === "admin" || profile?.role === "manager";

  const renderApplicationsList = (apps: EventApplication[], isPrivileged: boolean) => {
    if (apps.length === 0) {
      return (
        <div className="text-center py-20 text-muted-foreground bg-secondary rounded-xl border border-border border-dashed">
          No applications found in this category.
        </div>
      );
    }

    return (
      <div className="grid gap-6">
        {apps.map((app) => (
          <Card key={app.id} className="border-0 shadow-elegant">
            <CardHeader className="border-b bg-secondary/30 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="size-5 text-primary" />
                    {isPrivileged
                      ? `${app.applicationNo || app.id.substring(0, 8)} - ${app.applicantName}`
                      : `Application ID: ${app.applicationNo || app.id.substring(0, 8)}`}
                  </CardTitle>
                  {isPrivileged && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {app.schoolCollegeName} • {app.classCourse}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`px-3 py-1 ${
                    app.status === "selected"
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                      : app.status === "accepted"
                        ? "bg-success/20 text-success border-success/30"
                        : app.status === "rejected"
                          ? "bg-destructive/15 text-destructive border-destructive/30"
                          : "bg-warning/20 text-warning-foreground border-warning/30"
                  }`}
                >
                  {app.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                {/* Topic */}
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                    Selected Topic
                  </span>
                  <span className="font-medium text-primary">{app.selectedTopic}</span>
                </div>

                {/* Date */}
                <div>
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                    Applied On
                  </span>
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <Calendar className="size-3.5" />
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Contact (Privileged only) */}
                {isPrivileged && (
                  <>
                    <div>
                      <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                        Email
                      </span>
                      <span className="font-medium text-primary">{app.applicantEmail}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                        Phone
                      </span>
                      <span className="font-medium text-primary">{app.applicantPhone}</span>
                    </div>
                  </>
                )}

                {/* Video Link & User Details */}
                <div className="sm:col-span-2 pt-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                      setSelectedVideo({
                        url: app.videoUrl,
                        title: `Submission for ${app.applicationNo || app.id.substring(0, 8)}`,
                      })
                    }
                  >
                    <Video className="size-4 mr-2 text-accent" /> Watch Submission
                  </Button>

                  {isPrivileged && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => handleViewUserProfile(app.userId)}
                      disabled={fetchingProfile}
                    >
                      {fetchingProfile ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <User className="size-4 mr-2 text-primary" />
                      )}
                      Check User Details
                    </Button>
                  )}
                </div>

                {app.status === "rejected" && app.rejectionReason && (
                  <div className="sm:col-span-2 mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-xs">
                    <p className="font-semibold text-destructive mb-1">Reason for Rejection:</p>
                    <p className="text-destructive/90 leading-relaxed">{app.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Status History Logs */}
              {statusLogs[app.id] && statusLogs[app.id].length > 0 && (
                <div className="mt-6 pt-4 border-t text-xs text-muted-foreground space-y-2 bg-secondary/10 p-3 rounded-lg border border-border">
                  <span className="font-semibold block text-[10px] uppercase tracking-wider text-primary mb-1">
                    Status History Logs:
                  </span>
                  <div className="divide-y divide-border/50 max-h-40 overflow-y-auto pr-1">
                    {statusLogs[app.id].map((log, idx) => (
                      <div
                        key={log.id || idx}
                        className="py-1.5 flex justify-between items-center gap-4"
                      >
                        <span>
                          Status changed from{" "}
                          <strong className="capitalize">{log.previousValue}</strong> to{" "}
                          <strong className="capitalize">{log.newValue}</strong> by{" "}
                          <strong className="text-primary">{log.performedByName}</strong> (
                          {log.performedByRole})
                        </span>
                        <span className="text-[10px] shrink-0 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin/Manager Actions */}
              {isPrivileged && (
                <div className="mt-6 pt-4 border-t flex items-center gap-3">
                  {app.status === "pending" && (
                    <>
                      <Button
                        onClick={() => updateStatus(app.id, "accepted")}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="size-4 mr-2" /> Approve for Review
                      </Button>
                      <Button variant="destructive" onClick={() => openRejectDialog(app)}>
                        <XCircle className="size-4 mr-2" /> Reject
                      </Button>
                    </>
                  )}
                  {app.status === "accepted" && (
                    <>
                      <Button
                        onClick={() => updateStatus(app.id, "selected")}
                        className="bg-amber-500 text-white hover:bg-amber-600"
                      >
                        <CheckCircle className="size-4 mr-2" /> 🏆 Mark as Selected
                      </Button>
                      <Button variant="destructive" onClick={() => openRejectDialog(app)}>
                        <XCircle className="size-4 mr-2" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.applicantName?.toLowerCase().includes(q) ||
      app.applicantEmail?.toLowerCase().includes(q) ||
      app.applicantPhone?.toLowerCase().includes(q) ||
      app.applicationNo?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = async (
    filterStatus: "all" | "pending" | "selected" | "rejected" | "accepted",
  ) => {
    let exportApplications = applications;
    if (filterStatus !== "all") {
      exportApplications = applications.filter((app) => app.status === filterStatus);
    }

    if (exportApplications.length === 0) {
      toast.error(`No ${filterStatus} applications to export.`);
      return;
    }

    // 1. Get unique userIds from applications list
    const userIds = Array.from(
      new Set(exportApplications.map((app) => app.userId).filter(Boolean)),
    );

    // 2. Fetch profiles in chunks of 30 (Firestore limit for 'in' query)
    const usersMap: Record<string, any> = {};
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
      chunks.push(userIds.slice(i, i + 30));
    }

    try {
      await Promise.all(
        chunks.map(async (chunk) => {
          const q = query(collection(db, "users"), where("__name__", "in", chunk));
          const snap = await getDocs(q);
          snap.forEach((doc) => {
            usersMap[doc.id] = doc.data();
          });
        }),
      );
    } catch (err) {
      console.error("Failed to fetch user profiles for export details:", err);
    }

    // 3. Map export data using the snapshot or retrieved profile
    const data = exportApplications.map((app) => {
      const userProfile = usersMap[app.userId];
      return {
        "Application No": app.applicationNo || "N/A",
        "Applicant Name": app.applicantName || "N/A",
        "Selected Topic": app.selectedTopic || "N/A",
        Email: app.applicantEmail || "N/A",
        Phone: app.applicantPhone ? String(app.applicantPhone) : "N/A",
        District: app.applicantDistrict || userProfile?.district || "N/A",
        State: app.applicantState || userProfile?.state || "N/A",
        Status: app.status.toUpperCase(),
        "Date Applied": app.appliedAt ? new Date(app.appliedAt).toLocaleString() : "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    XLSX.writeFile(
      workbook,
      `applications_${filterStatus}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">
            {isPrivileged ? "All Applications" : "My Applications"}
          </h1>
          <p className="text-muted-foreground">
            {isPrivileged
              ? "Review and manage event registrations."
              : "Track the status of your event submissions."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, or phone..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          {isPrivileged && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto shrink-0 gap-2">
                  <Download className="size-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem
                  onClick={() => handleExportExcel("all")}
                  className="cursor-pointer"
                >
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportExcel("pending")}
                  className="cursor-pointer"
                >
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportExcel("accepted")}
                  className="cursor-pointer"
                >
                  Under Review
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportExcel("selected")}
                  className="cursor-pointer"
                >
                  Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportExcel("rejected")}
                  className="cursor-pointer"
                >
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : searchQuery.trim().length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4 text-primary">
            Search Results ({filteredApplications.length})
          </h2>
          {renderApplicationsList(filteredApplications, isPrivileged)}
        </div>
      ) : isPrivileged ? (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 flex w-full max-w-2xl mx-auto overflow-x-auto hide-scrollbar">
            <TabsTrigger value="pending" className="flex-1 min-w-fit px-4 gap-2">
              📥 Pending{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {filteredApplications.filter((a) => a.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1 min-w-fit px-4 gap-2">
              ⏳ Under Review{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {filteredApplications.filter((a) => a.status === "accepted").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="selected" className="flex-1 min-w-fit px-4 gap-2">
              🏆 Selected{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {filteredApplications.filter((a) => a.status === "selected").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 min-w-fit px-4 gap-2">
              ❌ Rejected{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {filteredApplications.filter((a) => a.status === "rejected").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {renderApplicationsList(
              filteredApplications.filter((a) => a.status === "pending"),
              isPrivileged,
            )}
          </TabsContent>
          <TabsContent value="accepted" className="mt-0">
            {renderApplicationsList(
              filteredApplications.filter((a) => a.status === "accepted"),
              isPrivileged,
            )}
          </TabsContent>
          <TabsContent value="selected" className="mt-0">
            {renderApplicationsList(
              filteredApplications.filter((a) => a.status === "selected"),
              isPrivileged,
            )}
          </TabsContent>
          <TabsContent value="rejected" className="mt-0">
            {renderApplicationsList(
              filteredApplications.filter((a) => a.status === "rejected"),
              isPrivileged,
            )}
          </TabsContent>
        </Tabs>
      ) : (
        renderApplicationsList(filteredApplications, isPrivileged)
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-border">
          <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <DialogTitle className="text-white">{selectedVideo?.title}</DialogTitle>
            <div className="flex items-center gap-2">
              {selectedVideo && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full size-8 shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/20 mt-0"
                  onClick={() =>
                    handleDownloadVideo(
                      selectedVideo.url,
                      `${selectedVideo.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.mp4`,
                    )
                  }
                  disabled={downloadingVideo}
                >
                  {downloadingVideo ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  <span className="sr-only">Download</span>
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full size-8 shrink-0 shadow-lg mt-0"
                onClick={() => setSelectedVideo(null)}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="relative pt-16 pb-4 px-4 flex items-center justify-center min-h-[50vh]">
            {selectedVideo && (
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                playsInline
                className="max-h-[70vh] w-full rounded-md shadow-2xl"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <Dialog
        open={!!selectedUserProfile}
        onOpenChange={(open) => !open && setSelectedUserProfile(null)}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="p-6 bg-secondary/30 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <User className="size-5 text-primary" /> User Profile Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-8 shrink-0 mt-0"
              onClick={() => setSelectedUserProfile(null)}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          {selectedUserProfile && (
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b">
                <div className="size-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center border-2 border-border shrink-0">
                  {selectedUserProfile.profilePhotoUrl ? (
                    <img
                      src={selectedUserProfile.profilePhotoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="size-10 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold text-primary">{selectedUserProfile.fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUserProfile.profession || "No profession listed"}
                  </p>
                  <Badge variant="outline" className="mt-2 capitalize">
                    Status: {selectedUserProfile.verificationStatus || "pending"}
                  </Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Father's Name
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.fatherName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Mother's Name
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.motherName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Gender
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.gender || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Date of Birth (Age)
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.dob || "N/A"}{" "}
                    {selectedUserProfile.age ? `(${selectedUserProfile.age} years)` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Phone Number
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.phoneNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Email
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.email || "N/A"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Instagram Handle
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.instagramHandle || "N/A"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">
                    Address
                  </span>
                  <span className="font-medium text-primary">
                    {selectedUserProfile.address || "N/A"}, {selectedUserProfile.villageCity || ""},{" "}
                    {selectedUserProfile.district || ""}, {selectedUserProfile.state || ""} -{" "}
                    {selectedUserProfile.pincode || ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog Modal */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="size-5" /> Reject Application
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This reason will be saved in
              the database and sent in the notification email to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="e.g. Video submission does not meet requirements, incorrect details..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
