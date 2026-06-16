"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarSearch,
  FileText,
  Trophy,
  Bell,
  User,
  ShieldCheck,
  Ticket,
  LayoutTemplate,
  QrCode,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { VerificationBanner } from "@/components/layout/VerificationBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && profile && !profile.onboarded) {
      router.push("/onboarding");
    }
  }, [user, loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground font-display text-sm">
            Securing dashboard session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Prevent flash of dashboard before redirect to onboarding kicks in
  if (profile && !profile.onboarded) {
    return null;
  }

  const role = profile?.role || "user";
  let nav = [];

  if (role === "admin") {
    nav = [
      { to: "/dashboard", label: "Admin Console", icon: LayoutDashboard },
      { to: "/dashboard/verification", label: "Profile Verification", icon: ShieldCheck },
      { to: "/dashboard/admin/events", label: "Manage Events", icon: CalendarSearch },
      { to: "/dashboard/applications", label: "All Applications", icon: FileText },
      { to: "/dashboard/admin/passes", label: "VIP Pass Generation", icon: Ticket },
      { to: "/dashboard/admin/cms", label: "Landing Page CMS", icon: LayoutTemplate },
      { to: "/dashboard/admin/qr", label: "QR Studio", icon: QrCode },
      { to: "/dashboard/admin/team", label: "Team Management", icon: Users },
      { to: "/dashboard/results", label: "State Results", icon: Trophy },
      { to: "/dashboard/notifications", label: "System Alerts", icon: Bell },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  } else if (role === "manager") {
    nav = [
      { to: "/dashboard/manager", label: "Scanner Console", icon: LayoutDashboard },
      { to: "/dashboard", label: "District Review", icon: LayoutDashboard },
      { to: "/dashboard/admin/passes", label: "VIP Pass Generation", icon: Ticket },
      { to: "/dashboard/applications", label: "Assigned Applications", icon: FileText },
      { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  } else if (role === "team") {
    nav = [
      { to: "/dashboard/manager", label: "Scanner Console", icon: LayoutDashboard },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  } else {
    // Default user
    nav = [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/events", label: "Open Events", icon: CalendarSearch },
      { to: "/dashboard/applications", label: "My Applications", icon: FileText },
      { to: "/dashboard/results", label: "Results", icon: Trophy },
      { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  }

  return (
    <DashboardShell
      nav={nav}
      brandLabel="Bhavishya E Uttar Pradesh"
      brandSub={`${role.toUpperCase()} PORTAL`}
    >
      {/* Show verification banner for users (non-admin) */}
      {profile && role === "user" && <VerificationBanner profile={profile} />}
      {children}
    </DashboardShell>
  );
}
