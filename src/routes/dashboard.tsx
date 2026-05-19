import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, CalendarSearch, FileText, Trophy, Bell, User } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  head: () => ({ meta: [{ title: "Dashboard — Bhavishya UP" }] }),
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/events", label: "Open Events", icon: CalendarSearch },
  { to: "/dashboard/applications", label: "My Applications", icon: FileText },
  { to: "/dashboard/results", label: "Results", icon: Trophy },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

function DashboardLayout() {
  return (
    <DashboardShell nav={nav} brandLabel="Bhavishya UP" brandSub="Citizen Portal">
      <Outlet />
    </DashboardShell>
  );
}
