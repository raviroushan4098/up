import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, FileText, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { applications, events, notifications, dailyRegistrations } from "@/data/mock";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const widgets = [
    { i: FileText, l: "Total Applications", v: applications.length, color: "text-primary", bg: "bg-primary/10" },
    { i: Clock, l: "Under Review", v: applications.filter(a => a.status === "Under Review" || a.status === "Pending").length, color: "text-warning-foreground", bg: "bg-warning/20" },
    { i: CheckCircle2, l: "Approved", v: applications.filter(a => a.status === "Approved" || a.status === "Selected").length, color: "text-success", bg: "bg-success/10" },
    { i: Trophy, l: "Selected", v: applications.filter(a => a.status === "Selected").length, color: "text-accent-foreground", bg: "bg-accent/20" },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-hero text-primary-foreground p-6 sm:p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <p className="text-sm opacity-80">Welcome back,</p>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">Aarav Sharma 👋</h1>
          <p className="mt-2 opacity-80 max-w-md">You have 1 application under review and 3 new events open today.</p>
          <Button asChild className="mt-5 bg-accent text-primary hover:bg-accent-glow font-semibold">
            <Link to="/dashboard/apply">Start new application <ArrowRight className="size-4 ml-1.5" /></Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w, i) => (
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
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.6} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
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
              {[["Personal Details", true], ["Aadhaar", true], ["Education", true], ["Documents Upload", false]].map(([l, d], i) => (
                <li key={i} className={`flex items-center gap-2 ${d ? "text-foreground/80" : "text-muted-foreground"}`}><CheckCircle2 className={`size-4 ${d ? "text-success" : "text-muted-foreground"}`} /> {l}</li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full mt-5"><Link to="/dashboard/profile">Complete Profile</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary">Upcoming Events</h3>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/events">View all</Link></Button>
            </div>
            <ul className="space-y-3">
              {events.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-base">
                  <img src={e.image} alt="" className="size-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1"><div className="font-semibold text-primary truncate">{e.title}</div><div className="text-xs text-muted-foreground">Deadline {new Date(e.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div></div>
                  <Button asChild size="sm" variant="outline"><Link to="/events/$eventId" params={{ eventId: e.id }}>View</Link></Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary">Recent Notifications</h3>
              <Button asChild variant="ghost" size="sm"><Link to="/dashboard/notifications">View all</Link></Button>
            </div>
            <ul className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-base">
                  <div className={`size-2 mt-2 rounded-full shrink-0 ${n.type === "success" ? "bg-success" : n.type === "warning" ? "bg-warning" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1"><div className="font-semibold text-primary text-sm">{n.title}</div><div className="text-xs text-muted-foreground">{n.desc}</div></div>
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
