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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { EventApplication } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  sendApplicationAcceptedEmail,
  sendApplicationSelectedEmail,
  sendApplicationRejectedEmail,
} from "@/actions/email";
import {
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && profile) {
      fetchApplications();
    }
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
      setApplications(fetched);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: string, newStatus: "accepted" | "selected" | "rejected") => {
    try {
      const appData = applications.find((a) => a.id === appId);
      if (!appData) return;

      await updateDoc(doc(db, "applications", appId), { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)),
      );
      toast.success(`Application marked as ${newStatus}`);

      // Try to get event title for the email
      let eventTitle = "Bhavishya UP Event";
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
        if (newStatus === "accepted") {
          await sendApplicationAcceptedEmail(
            appData.applicantEmail,
            appData.applicantName,
            eventTitle,
          );
        } else if (newStatus === "selected") {
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

                {/* Video Link */}
                <div className="sm:col-span-2 pt-2">
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
                </div>
              </div>

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
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus(app.id, "rejected")}
                      >
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
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus(app.id, "rejected")}
                      >
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

  return (
    <div className="space-y-6">
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : isPrivileged ? (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 flex w-full max-w-2xl mx-auto overflow-x-auto hide-scrollbar">
            <TabsTrigger value="pending" className="flex-1 min-w-fit px-4 gap-2">
              📥 Pending{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {applications.filter((a) => a.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1 min-w-fit px-4 gap-2">
              ⏳ Under Review{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {applications.filter((a) => a.status === "accepted").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="selected" className="flex-1 min-w-fit px-4 gap-2">
              🏆 Selected{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {applications.filter((a) => a.status === "selected").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 min-w-fit px-4 gap-2">
              ❌ Rejected{" "}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                {applications.filter((a) => a.status === "rejected").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {renderApplicationsList(
              applications.filter((a) => a.status === "pending"),
              isPrivileged,
            )}
          </TabsContent>
          <TabsContent value="accepted" className="mt-0">
            {renderApplicationsList(
              applications.filter((a) => a.status === "accepted"),
              isPrivileged,
            )}
          </TabsContent>
          <TabsContent value="selected" className="mt-0">
            {renderApplicationsList(
              applications.filter((a) => a.status === "selected"),
              isPrivileged,
            )}
          </TabsContent>
          <TabsContent value="rejected" className="mt-0">
            {renderApplicationsList(
              applications.filter((a) => a.status === "rejected"),
              isPrivileged,
            )}
          </TabsContent>
        </Tabs>
      ) : (
        renderApplicationsList(applications, isPrivileged)
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-border">
          <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <DialogTitle className="text-white">{selectedVideo?.title}</DialogTitle>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full size-8 shrink-0 shadow-lg mt-0"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          <div className="relative pt-16 pb-4 px-4 flex items-center justify-center min-h-[50vh]">
            {selectedVideo && (
              <video
                src={selectedVideo.url}
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
                className="max-h-[70vh] w-full rounded-md shadow-2xl"
                onContextMenu={(e) => e.preventDefault()}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
