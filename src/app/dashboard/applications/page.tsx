"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { EventApplication } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  Video,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && profile) {
      fetchApplications();
    }
  }, [user, profile, authLoading]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let q;
      if (profile?.role === "admin") {
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

  const updateStatus = async (appId: string, newStatus: "accepted" | "rejected") => {
    try {
      await updateDoc(doc(db, "applications", appId), { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)),
      );
      toast.success(`Application marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  if (authLoading) return null;

  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">
          {isAdmin ? "All Applications" : "My Applications"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Review and manage event registrations."
            : "Track the status of your event submissions."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-secondary rounded-xl border border-border border-dashed">
          No applications found.
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => (
            <Card key={app.id} className="border-0 shadow-elegant">
              <CardHeader className="border-b bg-secondary/30 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="size-5 text-primary" />
                      {isAdmin
                        ? `${app.applicationNo || app.id.substring(0, 8)} - ${app.applicantName}`
                        : `Application ID: ${app.applicationNo || app.id.substring(0, 8)}`}
                    </CardTitle>
                    {isAdmin && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {app.schoolCollegeName} • {app.classCourse}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 ${
                      app.status === "accepted"
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

                  {/* Contact (Admin only) */}
                  {isAdmin && (
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
                    <Button asChild variant="outline" size="sm" className="w-fit">
                      <a href={app.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Video className="size-4 mr-2 text-accent" /> Watch Submission{" "}
                        <ExternalLink className="size-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && app.status === "pending" && (
                  <div className="mt-6 pt-4 border-t flex items-center gap-3">
                    <Button
                      onClick={() => updateStatus(app.id, "accepted")}
                      className="bg-success text-success-foreground hover:bg-success/90"
                    >
                      <CheckCircle className="size-4 mr-2" /> Accept
                    </Button>
                    <Button variant="destructive" onClick={() => updateStatus(app.id, "rejected")}>
                      <XCircle className="size-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
