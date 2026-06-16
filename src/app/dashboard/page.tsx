"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Trophy,
  Users,
  Calendar,
  XCircle,
  Plus,
  ShieldAlert,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EventApplication } from "@/types/events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { VerificationStatusBadge } from "@/components/layout/VerificationBanner";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UPEvent } from "@/types/events";

export default function DashboardHome() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const role = profile?.role || "user";
  const fullName = profile?.fullName || "";

  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalApplications: 0,
    totalEvents: 0,
    approvedApplications: 0,
  });
  const [appsList, setAppsList] = useState<any[]>([]);
  const [openEvents, setOpenEvents] = useState<UPEvent[]>([]);

  useEffect(() => {
    if (!profile || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        if (role === "admin") {
          // Fetch global stats
          const statsDoc = await getDoc(doc(db, "counters", "global"));
          if (statsDoc.exists()) {
            setGlobalStats({
              totalApplications: statsDoc.data().totalApplications || 0,
              totalEvents: statsDoc.data().totalEvents || 0,
              approvedApplications: statsDoc.data().approvedApplications || 0,
            });
          }
        } else if (role === "manager") {
          // Fetch apps for the manager's district
          if (profile.district) {
            const appsQ = query(
              collection(db, "applications"),
              where("applicantDistrict", "==", profile.district),
            );
            const snap = await getDocs(appsQ);
            setAppsList(
              snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as EventApplication)
                .filter((a) => !a.isTeamPass),
            );
          }
        } else if (role === "team") {
          router.push("/dashboard/manager");
        } else {
          // Fetch user's own apps
          const userAppsQ = query(collection(db, "applications"), where("userId", "==", user.uid));
          const userAppsSnap = await getDocs(userAppsQ);
          setAppsList(
            userAppsSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as EventApplication)
              .filter((a) => !a.isTeamPass),
          );

          // Fetch open and coming soon events
          const eventsQ = query(
            collection(db, "events"),
            where("status", "in", ["Open", "Coming Soon"]),
          );
          const eventsSnap = await getDocs(eventsQ);
          let fetchedEvents = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as UPEvent);

          // Filter out events the user has already applied to
          const appliedEventIds = userAppsSnap.docs.map((d) => d.data().eventId);
          fetchedEvents = fetchedEvents.filter((e) => !appliedEventIds.includes(e.id));

          // Filter out events where the deadline has passed
          const now = new Date();
          fetchedEvents = fetchedEvents.filter((e) => {
            if (!e.deadline) return true;
            return new Date(e.deadline) >= now;
          });

          // Limit to 3
          setOpenEvents(fetchedEvents.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role, profile, user, router]);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "applications", appId), {
        status: newStatus.toLowerCase(),
        updatedAt: new Date().toISOString(),
      });
      setAppsList((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus.toLowerCase() } : app)),
      );
      toast.success(`Application marked as ${newStatus}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "team") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Redirecting to Scanner Console...</span>
      </div>
    );
  }

  if (role === "admin") {
    // -------------------------------------------------------------
    // ADMIN DASHBOARD
    // -------------------------------------------------------------
    const adminWidgets = [
      {
        i: Users,
        l: "Global Registrations",
        v: globalStats.totalApplications.toLocaleString("en-IN"),
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        i: Calendar,
        l: "Total Events",
        v: globalStats.totalEvents.toLocaleString("en-IN"),
        color: "text-accent-foreground",
        bg: "bg-accent/25",
      },
      {
        i: CheckCircle2,
        l: "Global Approved Apps",
        v: globalStats.approvedApplications.toLocaleString("en-IN"),
        color: "text-success",
        bg: "bg-success/10",
      },
      {
        i: ShieldAlert,
        l: "Admin Log Audit",
        v: "Secure",
        color: "text-info-foreground",
        bg: "bg-blue-500/10",
      },
    ];

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-hero text-primary-foreground p-6 sm:p-8 shadow-elegant relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <p className="text-sm opacity-80">Welcome back,</p>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
              {fullName} (Admin) 👑
            </h1>
            <p className="mt-2 opacity-80 max-w-md">
              You have complete access to the state-level user portal management systems, analytics
              dashboards, and event builders.
            </p>
            <div className="mt-5 flex gap-2">
              <Button asChild className="bg-accent text-primary hover:bg-accent-glow font-semibold">
                <Link href="/dashboard/events">
                  Manage Events <Plus className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/dashboard/applications">View All Applications</Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {adminWidgets.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-card">
                <CardContent className="p-5">
                  <div className={`size-10 rounded-xl grid place-items-center ${w.bg}`}>
                    <w.i className={`size-5 ${w.color}`} />
                  </div>
                  <div className="font-display font-extrabold text-2xl mt-3 text-primary">
                    {w.v}
                  </div>
                  <div className="text-xs text-muted-foreground">{w.l}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display font-bold text-primary">System Health</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Server Load</span>
                    <span className="font-bold">14%</span>
                  </div>
                  <Progress value={14} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Database Operations</span>
                    <span className="font-bold">Optimal</span>
                  </div>
                  <Progress value={92} className="h-2 bg-success/20" />
                </div>
              </div>
              <div className="pt-4 border-t flex flex-col gap-2">
                <div className="text-xs text-muted-foreground">
                  Connected to Firebase Project:{" "}
                  <span className="font-semibold text-primary">Live DB</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Active Region:{" "}
                  <span className="font-semibold text-primary">asia-south1 (Mumbai)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (role === "manager") {
    // -------------------------------------------------------------
    // MANAGER DASHBOARD
    // -------------------------------------------------------------
    const managerDistrict = profile?.district || "Unknown District";
    const pendingApps = appsList.filter(
      (a) => a.status === "pending" || a.status === "under review",
    );
    const approvedAppsCount = appsList.filter(
      (a) => a.status === "approved" || a.status === "selected",
    ).length;

    const managerWidgets = [
      {
        i: FileText,
        l: "Total Applications",
        v: appsList.length,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        i: Clock,
        l: "Pending Review",
        v: pendingApps.length,
        color: "text-warning-foreground",
        bg: "bg-warning/20",
      },
      {
        i: CheckCircle2,
        l: "Approved by District",
        v: approvedAppsCount,
        color: "text-success",
        bg: "bg-success/10",
      },
      {
        i: MapPin,
        l: "Assigned District",
        v: managerDistrict,
        color: "text-accent-foreground",
        bg: "bg-accent/25",
      },
    ];

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-hero text-primary-foreground p-6 sm:p-8 shadow-elegant relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <p className="text-sm opacity-80">Welcome back,</p>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
              {fullName} (Manager) 💼
            </h1>
            <p className="mt-2 opacity-80 max-w-md">
              You are assigned to oversee applications and initiatives within the{" "}
              <strong>{managerDistrict}</strong> district.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {managerWidgets.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-card">
                <CardContent className="p-5">
                  <div className={`size-10 rounded-xl grid place-items-center ${w.bg}`}>
                    <w.i className={`size-5 ${w.color}`} />
                  </div>
                  <div className="font-display font-extrabold text-2xl mt-3 text-primary">
                    {w.v}
                  </div>
                  <div className="text-xs text-muted-foreground">{w.l}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-card lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-primary mb-4">
                Pending Applications Review Queue
              </h3>
              {pendingApps.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <CheckCircle2 className="size-8 text-success mx-auto mb-2" />
                  No pending applications left to review in your district.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-secondary/40 transition-base gap-3"
                    >
                      <div>
                        <div className="font-semibold text-primary">
                          {app.eventId || "Application"} ({app.applicationNo})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {app.id} · Applied:{" "}
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleDateString("en-IN")
                            : "Unknown"}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(app.id, "rejected")}
                          className="text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                          <XCircle className="size-4 mr-1.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(app.id, "approved")}
                          className="bg-success text-success-foreground hover:opacity-90"
                        >
                          <CheckCircle2 className="size-4 mr-1.5" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // USER DASHBOARD (DEFAULT)
  // -------------------------------------------------------------
  const userWidgets = [
    {
      i: FileText,
      l: "Total Applications",
      v: appsList.length,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      i: Clock,
      l: "Under Review",
      v: appsList.filter((a) => a.status === "pending" || a.status === "under review").length,
      color: "text-warning-foreground",
      bg: "bg-warning/20",
    },
    {
      i: CheckCircle2,
      l: "Approved",
      v: appsList.filter((a) => a.status === "approved" || a.status === "selected").length,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      i: Trophy,
      l: "Selected",
      v: appsList.filter((a) => a.status === "selected").length,
      color: "text-accent-foreground",
      bg: "bg-accent/20",
    },
  ];

  // Dynamically calculate profile completion
  const profileChecks = [
    { label: "Full Name", done: !!profile?.fullName },
    { label: "Phone Number", done: !!profile?.phoneNumber },
    { label: "District Selected", done: !!profile?.district },
  ];
  const profileCompletion = Math.round(
    (profileChecks.filter((c) => c.done).length / profileChecks.length) * 100,
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-hero text-primary-foreground p-6 sm:p-8 shadow-elegant relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <p className="text-sm opacity-80">Welcome back,</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{fullName} 👋</h1>
            <VerificationStatusBadge status={profile?.verificationStatus} />
          </div>
          <p className="mt-2 opacity-80 max-w-md">
            You have {appsList.filter((a) => a.status === "pending").length} applications under
            review.
          </p>
          <Button
            asChild
            className="mt-5 bg-accent text-primary hover:bg-accent-glow font-semibold"
          >
            <Link href="/dashboard/events">
              Explore Events <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userWidgets.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 shadow-card">
              <CardContent className="p-5">
                <div className={`size-10 rounded-xl grid place-items-center ${w.bg}`}>
                  <w.i className={`size-5 ${w.color}`} />
                </div>
                <div className="font-display font-extrabold text-2xl mt-3 text-primary">{w.v}</div>
                <div className="text-xs text-muted-foreground">{w.l}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary">Your Applications</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/applications">View all</Link>
              </Button>
            </div>
            {appsList.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                You haven't applied to any events yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {appsList.slice(0, 5).map((app) => (
                  <li
                    key={app.id}
                    className="flex justify-between items-center p-3 border rounded-xl hover:bg-secondary/40 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-primary">
                        {app.eventId || "Event Application"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.applicationNo} • Applied on{" "}
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                    <div className="text-sm font-medium capitalize px-2 py-1 bg-secondary rounded-md">
                      {app.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-primary">Profile Completion</h3>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall</span>
              <span className="font-display font-bold text-primary">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="mt-2 h-2" />
            <ul className="mt-5 space-y-2 text-sm">
              {profileChecks.map((check, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 ${check.done ? "text-foreground/80" : "text-muted-foreground"}`}
                >
                  <CheckCircle2
                    className={`size-4 ${check.done ? "text-success" : "text-muted-foreground"}`}
                  />{" "}
                  {check.label}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full mt-5">
              <Link href="/dashboard/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary">Upcoming Events</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/events">View all</Link>
              </Button>
            </div>
            {openEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No open events available right now.
              </div>
            ) : (
              <ul className="space-y-3">
                {openEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-base"
                  >
                    <img src={e.image} alt="" className="size-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-primary truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Deadline{" "}
                        {e.deadline
                          ? new Date(e.deadline).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : "TBA"}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/events/${e.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary">Recent Notifications</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/applications">View Applications</Link>
              </Button>
            </div>
            {appsList.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No recent notifications.
              </div>
            ) : (
              <ul className="space-y-3">
                {appsList.slice(0, 4).map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-base"
                  >
                    <div
                      className={`size-2 mt-2 rounded-full shrink-0 ${
                        n.status === "approved" || n.status === "selected"
                          ? "bg-success"
                          : n.status === "rejected"
                            ? "bg-destructive"
                            : "bg-warning"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-primary text-sm capitalize">
                        Application {n.status}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Your application for {n.eventId || "an event"} is {n.status}.
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
