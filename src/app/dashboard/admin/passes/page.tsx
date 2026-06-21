"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/hooks/useAuth";
import { EventApplication, UPEvent } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { sendDigitalPassEmail } from "@/actions/email";
import {
  Loader2,
  Ticket,
  CheckCircle2,
  User,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Users,
  Download,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DigitalPassCard } from "@/components/events/DigitalPassCard";
import Link from "next/link";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function PassesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);
  const [teamDesignations, setTeamDesignations] = useState<Record<string, string>>({});
  const [teamSelectedEvents, setTeamSelectedEvents] = useState<Record<string, string>>({});
  const [teamFilterStatus, setTeamFilterStatus] = useState<"all" | "generated" | "pending">("all");
  const [teamFilterRole, setTeamFilterRole] = useState<"all" | "admin" | "manager" | "team">("all");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [eventsMap, setEventsMap] = useState<Record<string, string>>({});

  // For pass popup
  const [selectedPass, setSelectedPass] = useState<
    (EventApplication & { profilePhotoUrl?: string }) | null
  >(null);

  // For silent PDF capture
  const [capturingApp, setCapturingApp] = useState<
    (EventApplication & { passId: string; eventTitle: string; profilePhotoUrl?: string }) | null
  >(null);

  const [downloadingPassId, setDownloadingPassId] = useState<string | null>(null);

  const downloadPass = async (
    app: EventApplication & { passId: string; eventTitle: string; profilePhotoUrl?: string },
  ) => {
    setDownloadingPassId(app.id);
    try {
      const node = document.getElementById("pass-popup-capture-node");
      if (node) {
        const { toJpeg } = await import("html-to-image");
        const { jsPDF } = await import("jspdf");

        const dataUrl = await toJpeg(node, {
          quality: 0.95,
          pixelRatio: 2,
          skipFonts: true,
          fontEmbedCSS: "",
        });

        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "b3" });
        pdf.addImage(
          dataUrl,
          "JPEG",
          0,
          0,
          pdf.internal.pageSize.getWidth(),
          pdf.internal.pageSize.getHeight(),
        );
        pdf.save(`${app.passId}_VIP_Pass.pdf`);
        toast.success("Pass downloaded successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download pass");
    } finally {
      setDownloadingPassId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && user && (profile?.role === "admin" || profile?.role === "manager")) {
      fetchData();
    }
  }, [user, profile, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events map first
      const eventsObj: Record<string, string> = {};
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        eventsSnapshot.docs.forEach((docSnap) => {
          eventsObj[docSnap.id] = docSnap.data().title || "  UP Event";
        });
        setEventsMap(eventsObj);
      } catch (e) {
        console.error("Failed to fetch events map", e);
      }

      // Fetch Applications
      const q = query(collection(db, "applications"), where("status", "==", "selected"));
      const snapshot = await getDocs(q);
      const fetched = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let profilePhotoUrl = "";
          try {
            if (data.userId) {
              const userDoc = await getDoc(doc(db, "users", data.userId));
              if (userDoc.exists()) {
                profilePhotoUrl = userDoc.data().profilePhotoUrl || "";
              }
            }
          } catch (e) {
            console.error("Failed to fetch user profile", e);
          }
          return {
            id: docSnap.id,
            profilePhotoUrl,
            ...data,
          } as EventApplication & { profilePhotoUrl?: string };
        }),
      );
      setApplications(fetched);

      // Fetch Team Users
      const qTeam = query(
        collection(db, "users"),
        where("role", "in", ["admin", "manager", "team"]),
      );
      const teamSnap = await getDocs(qTeam);
      const fetchedTeam = teamSnap.docs.map((d) => d.data() as UserProfile);
      setTeamUsers(fetchedTeam);

      // Pre-fill designations and selected events if they have an existing pass
      const tDesignations: Record<string, string> = {};
      const tSelectedEvents: Record<string, string> = {};
      for (const tUser of fetchedTeam) {
        const tApp = fetched.find((a) => a.userId === tUser.uid && a.isTeamPass);
        if (tApp) {
          if (tApp.designation) {
            tDesignations[tUser.uid] = tApp.designation;
          } else {
            tDesignations[tUser.uid] = tUser.role.toUpperCase();
          }
          if (tApp.eventId) {
            tSelectedEvents[tUser.uid] = tApp.eventId;
          }
        } else {
          tDesignations[tUser.uid] = tUser.role.toUpperCase();
        }
      }
      setTeamDesignations(tDesignations);
      setTeamSelectedEvents(tSelectedEvents);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const generatePass = async (app: EventApplication) => {
    setProcessingId(app.id);
    try {
      // 1. Fetch Event Details for Email
      const eventDoc = await getDoc(doc(db, "events", app.eventId));
      let eventTitle = "  UP Event";
      let eventLocation = "Check Official Portal";
      if (eventDoc.exists()) {
        const eventData = eventDoc.data() as UPEvent;
        eventTitle = eventData.title;
        eventLocation = eventData.venue || eventLocation;
      }

      // 2. Generate Unique Pass ID
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPassId = `UP-PASS-${randomStr}`;

      // 3. Render it to the DOM for capturing
      setCapturingApp({ ...app, passId: newPassId, eventTitle });

      // Wait for React to mount the hidden node
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 4. Capture it as PDF
      let pdfBase64 = undefined;
      const node = document.getElementById("pdf-capture-node");
      if (node) {
        try {
          const { toJpeg } = await import("html-to-image");
          const { jsPDF } = await import("jspdf");

          const dataUrl = await toJpeg(node, {
            quality: 0.95,
            pixelRatio: 2,
            skipFonts: true,
            fontEmbedCSS: "",
          });

          // B3 portrait format
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: "b3",
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
          pdfBase64 = pdf.output("datauristring");
        } catch (captureErr) {
          console.error("PDF Capture Error", captureErr);
        }
      }

      setCapturingApp(null); // Clear after capture

      // 5. Update Database
      const appRef = doc(db, "applications", app.id);
      await updateDoc(appRef, {
        passGenerated: true,
        passId: newPassId,
      });

      // 6. Send VIP Email
      if (sendEmail) {
        const emailRes = await sendDigitalPassEmail(
          app.applicantEmail,
          app.applicantName,
          eventTitle,
          newPassId,
          eventLocation,
          "TBA",
          app.schoolCollegeName ? "STUDENT" : "PARTICIPANT",
          "Uttar Pradesh", // Assuming default as we might not have applicantDistrict in app object
          app.applicantPhone || "Verified",
          pdfBase64,
        );

        if (emailRes.success) {
          toast.success(`VIP Pass Generated & Emailed to ${app.applicantName}`);
        } else {
          toast.warning(
            `VIP Pass Generated but failed to send email: ${emailRes.error || "Unknown error"}`,
          );
        }
      } else {
        toast.success(`VIP Pass Generated for ${app.applicantName}`);
      }

      // Optimistic UI Update - ALWAYS update UI after database update, regardless of email success
      setApplications((apps) =>
        apps.map((a) => (a.id === app.id ? { ...a, passGenerated: true, passId: newPassId } : a)),
      );
    } catch (error) {
      console.error(error);
      toast.error("Error generating pass");
    } finally {
      setProcessingId(null);
      setCapturingApp(null);
    }
  };

  const generateTeamPass = async (userProf: UserProfile) => {
    setProcessingId(userProf.uid);
    try {
      const selectedEventIdForUser = teamSelectedEvents[userProf.uid] || "general";
      const eventTitle =
        selectedEventIdForUser === "general"
          ? "Uttar Pradesh Connect Event"
          : eventsMap[selectedEventIdForUser] || "Uttar Pradesh Connect Event";

      let eventLocation = "Check Official Portal";
      if (selectedEventIdForUser !== "general") {
        try {
          const eventDocSnap = await getDoc(doc(db, "events", selectedEventIdForUser));
          if (eventDocSnap.exists()) {
            eventLocation = eventDocSnap.data().venue || eventLocation;
          }
        } catch (err) {
          console.error("Failed to fetch event location", err);
        }
      }

      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newPassId = `UP-STAFF-${randomStr}`;
      const designation = teamDesignations[userProf.uid] || userProf.role.toUpperCase();

      // Create a mock application doc for the team member
      const mockApp: any = {
        id: `team_${userProf.uid}`,
        eventId: selectedEventIdForUser,
        userId: userProf.uid,
        applicantName: userProf.fullName,
        applicantEmail: userProf.email,
        applicantPhone: userProf.phoneNumber || "Verified",
        applicantDistrict: userProf.district || "Uttar Pradesh",
        schoolCollegeName: "",
        passGenerated: true,
        passId: newPassId,
        isTeamPass: true,
        designation,
        status: "selected",
        appliedAt: new Date().toISOString(),
      };

      setCapturingApp({ ...mockApp, eventTitle, profilePhotoUrl: userProf.profilePhotoUrl });
      await new Promise((resolve) => setTimeout(resolve, 800));

      let pdfBase64 = undefined;
      const node = document.getElementById("pdf-capture-node");
      if (node) {
        try {
          const { toJpeg } = await import("html-to-image");
          const { jsPDF } = await import("jspdf");

          const dataUrl = await toJpeg(node, {
            quality: 0.95,
            pixelRatio: 2,
            skipFonts: true,
            fontEmbedCSS: "",
          });

          const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "b3" });
          pdf.addImage(
            dataUrl,
            "JPEG",
            0,
            0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight(),
          );
          pdfBase64 = pdf.output("datauristring");
        } catch (captureErr) {
          console.error("PDF Capture Error", captureErr);
        }
      }
      setCapturingApp(null);

      // Save to applications collection
      const newDocRef = doc(db, "applications", mockApp.id);
      await setDoc(newDocRef, mockApp);

      if (sendEmail) {
        const emailRes = await sendDigitalPassEmail(
          mockApp.applicantEmail,
          mockApp.applicantName,
          eventTitle,
          newPassId,
          eventLocation,
          "TBA",
          designation,
          mockApp.applicantDistrict,
          mockApp.applicantPhone,
          pdfBase64,
        );

        if (emailRes.success) {
          toast.success(`Staff Pass Generated & Emailed to ${userProf.fullName}`);
        } else {
          toast.warning(
            `Staff Pass Generated but failed to send email: ${emailRes.error || "Unknown error"}`,
          );
        }
      } else {
        toast.success(`Staff Pass Generated for ${userProf.fullName}`);
      }
      fetchData(); // Refresh UI to show the new pass ID
    } catch (error) {
      console.error(error);
      toast.error("Error generating team pass");
    } finally {
      setProcessingId(null);
      setCapturingApp(null);
    }
  };

  if (authLoading) return null;

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          Only administrators and managers can access the Pass Generation portal.
        </p>
      </div>
    );
  }

  const eventFilteredApplications =
    selectedEventId === "all"
      ? applications
      : applications.filter((app) => app.eventId === selectedEventId);

  const pendingApps = eventFilteredApplications.filter((app) => !app.passId && !app.isTeamPass);
  const issuedApps = eventFilteredApplications.filter((app) => !!app.passId && !app.isTeamPass);
  const checkedInApps = eventFilteredApplications.filter((app) => app.checkedIn);

  const filteredTeamUsers = teamUsers.filter((tUser) => {
    if (teamFilterRole !== "all" && tUser.role !== teamFilterRole) return false;
    const hasPass = applications.some((a) => a.userId === tUser.uid && a.isTeamPass);
    if (teamFilterStatus === "generated" && !hasPass) return false;
    if (teamFilterStatus === "pending" && hasPass) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">VIP Pass Generation</h1>
          <p className="text-muted-foreground mt-1">
            Generate digital access passes for selected delegates and team members.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="flex items-center space-x-2 bg-background border border-input rounded-md px-3 py-2 h-10 select-none cursor-pointer">
            <Checkbox
              id="send-email-checkbox"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(!!checked)}
            />
            <label
              htmlFor="send-email-checkbox"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Send Email
            </label>
          </div>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="flex h-10 w-full sm:w-[250px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">All Events</option>
            {Object.entries(eventsMap).map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
          <div className="flex gap-4">
            <div className="bg-success/10 border border-success/20 text-success px-4 py-2 rounded-lg flex items-center gap-3">
              <QrCode className="size-5" />
              <div>
                <p className="text-xs uppercase font-bold tracking-wider opacity-80">Checked In</p>
                <p className="text-xl font-black leading-none">{checkedInApps.length}</p>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/10 text-primary px-4 py-2 rounded-lg flex items-center gap-3">
              <Ticket className="size-5" />
              <div>
                <p className="text-xs uppercase font-bold tracking-wider opacity-80">
                  Total Issued
                </p>
                <p className="text-xl font-black leading-none">{issuedApps.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="delegates" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 mb-6">
            <TabsTrigger value="delegates" className="flex gap-2">
              <Users className="size-4" /> Delegate Passes
            </TabsTrigger>
            <TabsTrigger value="team" className="flex gap-2">
              <ShieldCheck className="size-4" /> Team Passes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <select
                value={teamFilterStatus}
                onChange={(e) => setTeamFilterStatus(e.target.value as any)}
                className="flex h-10 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="generated">Generated</option>
                <option value="pending">Not Generated</option>
              </select>
              <select
                value={teamFilterRole}
                onChange={(e) => setTeamFilterRole(e.target.value as any)}
                className="flex h-10 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="team">Team</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredTeamUsers.map((tUser) => {
                const existingTeamApp = applications.find(
                  (a) => a.userId === tUser.uid && a.isTeamPass,
                );
                return (
                  <Card key={tUser.uid} className="border-0 shadow-soft">
                    <CardHeader className="pb-3 border-b bg-secondary/20">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <Avatar className="size-12 border border-primary/20">
                            <AvatarImage src={tUser.profilePhotoUrl} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {tUser.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {tUser.fullName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 capitalize font-bold">
                              {tUser.role} Account
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            existingTeamApp
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }
                        >
                          {existingTeamApp ? "Pass Issued" : "Ready to Issue"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="text-sm space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-4 shrink-0" />
                          <span className="text-primary truncate">{tUser.email}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Pass Designation
                          </label>
                          <Input
                            placeholder="e.g. VIP, Organizer, Staff"
                            value={teamDesignations[tUser.uid] || ""}
                            onChange={(e) =>
                              setTeamDesignations((prev) => ({
                                ...prev,
                                [tUser.uid]: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Select Event
                          </label>
                          <select
                            value={teamSelectedEvents[tUser.uid] || "general"}
                            onChange={(e) =>
                              setTeamSelectedEvents((prev) => ({
                                ...prev,
                                [tUser.uid]: e.target.value,
                              }))
                            }
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <option value="general">Uttar Pradesh Connect Event (General)</option>
                            {Object.entries(eventsMap).map(([id, title]) => (
                              <option key={id} value={id}>
                                {title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {existingTeamApp && (
                          <button
                            onClick={() => setSelectedPass(existingTeamApp)}
                            className="flex-1 inline-flex justify-center items-center gap-2 bg-success/10 text-success hover:bg-success/20 py-2 rounded-md transition-colors text-sm font-semibold"
                          >
                            <ExternalLink className="size-4" /> View
                          </button>
                        )}
                        <Button
                          onClick={() => generateTeamPass(tUser)}
                          disabled={processingId === tUser.uid}
                          className={`flex-[2] gap-2 font-semibold ${existingTeamApp ? "bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none" : "bg-gradient-saffron text-primary hover:opacity-90 transition-all"}`}
                          variant={existingTeamApp ? "outline" : "default"}
                        >
                          {processingId === tUser.uid ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Ticket className="size-4" />
                          )}
                          {existingTeamApp ? "Regenerate" : "Generate Staff Pass"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="delegates">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-2 bg-secondary/50 p-1 mb-6">
                <TabsTrigger value="pending" className="px-6">
                  Pending Generation{" "}
                  <Badge variant="secondary" className="ml-2">
                    {pendingApps.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="issued" className="px-6">
                  Issued Passes{" "}
                  <Badge variant="secondary" className="ml-2">
                    {issuedApps.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingApps.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed">
                    No passes pending generation.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {pendingApps.map((app) => (
                      <Card key={app.id} className="border-0 shadow-soft">
                        <CardHeader className="pb-3 border-b bg-secondary/20">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <Avatar className="size-12 border border-primary/20">
                                <AvatarImage src={(app as any).profilePhotoUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {app.applicantName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {app.applicantName}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Application ID {app.applicationNo || app.id.substring(0, 8)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                            >
                              Ready to Issue
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="text-sm space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="size-4 shrink-0" />
                              <span className="text-primary truncate">{app.applicantEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="size-4 shrink-0" />
                              <span className="text-primary truncate">
                                {app.applicantPhone || "N/A"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground uppercase text-[10px] tracking-wider mb-1">
                                Topic
                              </p>
                              <p className="text-primary text-sm font-medium leading-tight">
                                {app.selectedTopic}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => generatePass(app)}
                            disabled={processingId === app.id}
                            className="w-full gap-2 bg-gradient-saffron text-primary hover:opacity-90 transition-all font-semibold"
                          >
                            {processingId === app.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Ticket className="size-4" />
                            )}
                            Generate & Email VIP Pass
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="issued" className="space-y-4">
                {issuedApps.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed">
                    No passes issued yet.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {issuedApps.map((app) => (
                      <Card
                        key={app.id}
                        className="border-0 shadow-soft bg-success/5 border-success/20"
                      >
                        <CardHeader className="pb-3 border-b border-success/10 bg-success/10">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <Avatar className="size-12 border border-success/20">
                                <AvatarImage src={(app as any).profilePhotoUrl} />
                                <AvatarFallback className="bg-success/10 text-success">
                                  {app.applicantName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <CheckCircle2 className="size-4 text-success shrink-0" />
                                  <span className="truncate">{app.applicantName}</span>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Application ID {app.applicationNo || app.id.substring(0, 8)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-success/20 text-success border-success/30 font-mono"
                            >
                              {app.passId}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="text-sm space-y-3">
                            <div className="flex items-center gap-2 text-success/70">
                              <Mail className="size-4 shrink-0" />
                              <span className="text-primary font-medium truncate">
                                {app.applicantEmail}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-success/70">
                              <Phone className="size-4 shrink-0" />
                              <span className="text-primary font-medium truncate">
                                {app.applicantPhone || "N/A"}
                              </span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-success/10">
                              <p className="font-medium text-success/70 uppercase text-[10px] tracking-wider mb-1">
                                Generated On
                              </p>
                              <p className="text-primary text-xs font-medium">
                                Auto-generated via System
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-success/10 flex gap-2">
                            <button
                              onClick={() => setSelectedPass(app)}
                              className="flex-1 inline-flex justify-center items-center gap-2 bg-success/10 text-success hover:bg-success/20 py-2 rounded-md transition-colors text-sm font-semibold"
                            >
                              <ExternalLink className="size-4" /> View Pass
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to regenerate this pass? The old QR code will become invalid.",
                                  )
                                ) {
                                  generatePass(app);
                                }
                              }}
                              disabled={processingId === app.id}
                              className="flex-1 inline-flex justify-center items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 py-2 rounded-md transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                              {processingId === app.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Ticket className="size-4" />
                              )}
                              Regenerate
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      )}
      {/* Hidden container for PDF capture */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        {capturingApp && capturingApp.passId && (
          <div id="pdf-capture-node" style={{ width: "340px", background: "white" }}>
            <DigitalPassCard
              application={capturingApp}
              passId={capturingApp.passId}
              profilePhotoUrl={capturingApp.profilePhotoUrl}
              verifyUrl={`${typeof window !== "undefined" ? window.location.origin : "https://bhavishyaeuttarpradesh.in"}/dashboard/admin/verify/${capturingApp.passId}`}
              eventTitle={capturingApp.eventTitle}
            />
          </div>
        )}
      </div>

      {/* Pass Popup Dialog */}
      <Dialog open={!!selectedPass} onOpenChange={(open) => !open && setSelectedPass(null)}>
        <DialogContent className="max-w-[400px] p-0 bg-transparent border-none shadow-none flex flex-col items-center justify-center">
          <DialogTitle className="sr-only">Digital Pass Preview</DialogTitle>

          {selectedPass && selectedPass.passId && (
            <div className="flex flex-col justify-center items-center w-full gap-4">
              <div
                id="pass-popup-capture-node"
                className="flex justify-center w-full bg-white rounded-xl overflow-hidden"
              >
                <DigitalPassCard
                  application={selectedPass}
                  passId={selectedPass.passId}
                  profilePhotoUrl={selectedPass.profilePhotoUrl}
                  verifyUrl={`${typeof window !== "undefined" ? window.location.origin : "https://bhavishyaeuttarpradesh.in"}/dashboard/admin/verify/${selectedPass.passId}`}
                  eventTitle={eventsMap[selectedPass.eventId] || "Uttar Pradesh Connect Event"}
                />
              </div>
              <Button
                onClick={() =>
                  downloadPass({
                    ...selectedPass,
                    passId: selectedPass.passId!,
                    eventTitle: eventsMap[selectedPass.eventId] || "Uttar Pradesh Connect Event",
                  })
                }
                disabled={downloadingPassId === selectedPass.id}
                className="w-full max-w-[340px] bg-primary text-primary-foreground font-bold flex gap-2 h-12"
              >
                {downloadingPassId === selectedPass.id ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Download className="size-5" />
                )}
                Download Pass
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
