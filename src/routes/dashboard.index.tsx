import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  applications as initialApplications,
  events,
  notifications as initialNotifications,
  dailyRegistrations,
  districtAnalytics,
} from "@/data/mock";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const { profile } = useAuth();
  const role = profile?.role || "user";
  const fullName = profile?.fullName || "Citizen";

  // Shared status management for Manager/Admin demo actions
  const [appsList, setAppsList] = useState(initialApplications);
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleUpdateStatus = (appId: string, newStatus: string) => {
    setAppsList((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
    toast.success(`Application ${appId} marked as ${newStatus}`);

    // Add a new notification
    const matchedApp = appsList.find((a) => a.id === appId);
    const newNotif = {
      id: Date.now(),
      title: `Status Update: ${newStatus}`,
      desc: `Your application for ${matchedApp?.event || "initiative"} has been ${newStatus.toLowerCase()}.`,
      time: "Just now",
      type: newStatus === "Approved" || newStatus === "Selected" ? "success" : "warning",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  if (role === "admin") {
    // -------------------------------------------------------------
    // ADMIN DASHBOARD
    // -------------------------------------------------------------
    const adminWidgets = [
      { i: Users, l: "Global Registrations", v: "2,48,690", color: "text-primary", bg: "bg-primary/10" },
      { i: Calendar, l: "Active Government Events", v: events.length, color: "text-accent-foreground", bg: "bg-accent/25" },
      { i: CheckCircle2, l: "Global Approved Apps", v: "1,12,420", color: "text-success", bg: "bg-success/10" },
      { i: ShieldAlert, l: "Admin Log Audit", v: "Secure", color: "text-info-foreground", bg: "bg-blue-500/10" },
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
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{fullName} (Admin) 👑</h1>
            <p className="mt-2 opacity-80 max-w-md">
              You have complete access to the state-level citizen portal management systems, analytics dashboards, and event builders.
            </p>
            <div className="mt-5 flex gap-2">
              <Button asChild className="bg-accent text-primary hover:bg-accent-glow font-semibold">
                <Link to="/dashboard/events">
                  Manage Events <Plus className="size-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/dashboard/applications">View All Applications</Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {adminWidgets.map((w, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-card">
                <CardContent className="p-5">
                  <div className={`size-10 rounded-xl grid place-items-center ${w.bg}`}><w.i className={`size-5 ${w.color}`} /></div>
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
                <h3 className="font-display font-bold text-primary">Applications by District</h3>
                <Badge variant="outline">Top 6 Districts</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="district" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                    <Bar dataKey="apps" fill="var(--color-primary-glow)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display font-bold text-primary">System Health</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span>Server Load</span><span className="font-bold">14%</span></div>
                  <Progress value={14} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>Database Operations</span><span className="font-bold">Optimal</span></div>
                  <Progress value={92} className="h-2 bg-success/20" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span>Daily API Quotas</span><span className="font-bold">2.4%</span></div>
                  <Progress value={2.4} className="h-2" />
                </div>
              </div>
              <div className="pt-4 border-t flex flex-col gap-2">
                <div className="text-xs text-muted-foreground">Connected to Firebase Project: <span className="font-semibold text-primary">upproject-a9200</span></div>
                <div className="text-xs text-muted-foreground">Active Region: <span className="font-semibold text-primary">asia-south1 (Mumbai)</span></div>
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
    const managerDistrict = profile?.district || "Lucknow";
    const pendingApps = appsList.filter((a) => a.status === "Under Review" || a.status === "Pending");
    const approvedAppsCount = appsList.filter((a) => a.status === "Approved" || a.status === "Selected").length;

    const managerWidgets = [
      { i: FileText, l: "Total Applications", v: appsList.length, color: "text-primary", bg: "bg-primary/10" },
      { i: Clock, l: "Pending Review", v: pendingApps.length, color: "text-warning-foreground", bg: "bg-warning/20" },
      { i: CheckCircle2, l: "Approved by Me", v: approvedAppsCount, color: "text-success", bg: "bg-success/10" },
      { i: MapPin, l: "Assigned District", v: managerDistrict, color: "text-accent-foreground", bg: "bg-accent/25" },
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
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{fullName} (Manager) 💼</h1>
            <p className="mt-2 opacity-80 max-w-md">
              You are assigned to oversee applications and initiatives within the <strong>{managerDistrict}</strong> district.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {managerWidgets.map((w, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-card">
                <CardContent className="p-5">
                  <div className={`size-10 rounded-xl grid place-items-center ${w.bg}`}><w.i className={`size-5 ${w.color}`} /></div>
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
              <h3 className="font-display font-bold text-primary mb-4">Pending Applications Review Queue</h3>
              {pendingApps.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <CheckCircle2 className="size-8 text-success mx-auto mb-2" />
                  No pending applications left to review in your district.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApps.map((app) => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-secondary/40 transition-base gap-3">
                      <div>
                        <div className="font-semibold text-primary">{app.event}</div>
                        <div className="text-xs text-muted-foreground">ID: {app.id} · Applied: {new Date(app.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(app.id, "Rejected")}
                          className="text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                          <XCircle className="size-4 mr-1.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(app.id, "Approved")}
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

          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-primary mb-4">District Activity Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                    <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="var(--color-accent-glow)" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">District registrations over last 7 days</p>
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
    { i: FileText, l: "Total Applications", v: appsList.length, color: "text-primary", bg: "bg-primary/10" },
    { i: Clock, l: "Under Review", v: appsList.filter((a) => a.status === "Under Review" || a.status === "Pending").length, color: "text-warning-foreground", bg: "bg-warning/20" },
    { i: CheckCircle2, l: "Approved", v: appsList.filter((a) => a.status === "Approved" || a.status === "Selected").length, color: "text-success", bg: "bg-success/10" },
    { i: Trophy, l: "Selected", v: appsList.filter((a) => a.status === "Selected").length, color: "text-accent-foreground", bg: "bg-accent/20" },
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
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">{fullName} 👋</h1>
          <p className="mt-2 opacity-80 max-w-md">You have {appsList.filter(a => a.status === "Under Review").length} applications under review and {events.length} opportunities currently open.</p>
          <Button asChild className="mt-5 bg-accent text-primary hover:bg-accent-glow font-semibold">
            <Link to="/dashboard/apply">
              Start new application <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userWidgets.map((w, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-card">
              <CardContent className="p-5">
                <div className={`size-10 rounded-xl grid place-items-center ${w.bg}`}><w.i className={`size-5 ${w.color}`} /></div>
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
              <h3 className="font-display font-bold text-primary">Application Activity</h3>
              <Badge variant="outline">Last 7 days</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRegistrations}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                  <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-primary">Profile Completion</h3>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall</span>
              <span className="font-display font-bold text-primary">76%</span>
            </div>
            <Progress value={76} className="mt-2 h-2" />
            <ul className="mt-5 space-y-2 text-sm">
              {[
                ["Personal Details", true],
                ["Aadhaar Verified", true],
                ["Educational Proofs", true],
                ["Support Documents", false],
              ].map(([l, d], i) => (
                <li key={i} className={`flex items-center gap-2 ${d ? "text-foreground/80" : "text-muted-foreground"}`}>
                  <CheckCircle2 className={`size-4 ${d ? "text-success" : "text-muted-foreground"}`} /> {l}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full mt-5">
              <Link to="/dashboard/profile">Complete Profile</Link>
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
                <Link to="/dashboard/events">View all</Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {events.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-base">
                  <img src={e.image} alt="" className="size-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-primary truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Deadline{" "}
                      {new Date(e.deadline).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/events/$eventId" params={{ eventId: e.id }}>
                      View
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary">Recent Notifications</h3>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/notifications">View all</Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-base">
                  <div
                    className={`size-2 mt-2 rounded-full shrink-0 ${
                      n.type === "success" ? "bg-success" : n.type === "warning" ? "bg-warning" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-primary text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
