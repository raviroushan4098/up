"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, updateDoc, doc } from "firebase/firestore";
import {
  LayoutDashboard,
  CalendarSearch,
  FileText,
  Trophy,
  User,
  ShieldCheck,
  Ticket,
  LayoutTemplate,
  QrCode,
  Users,
  Scan,
  UserCircle,
  ClipboardList,
  ScanLine,
  AlertTriangle,
  LogOut,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { VerificationBanner } from "@/components/layout/VerificationBanner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function DeletionPendingScreen({
  profile,
  logout,
  refreshProfile,
}: {
  profile: any;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}) {
  const [timeLeft, setTimeLeft] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!profile?.deletionScheduledAt) return;
    const target = new Date(profile.deletionScheduledAt).getTime();
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft("00h 00m 00s");
        logout().then(() => {
          router.push("/login?error=deleted");
        });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`,
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [profile?.deletionScheduledAt, logout, router]);

  const handleAppeal = async () => {
    setSubmittingAppeal(true);
    try {
      await updateDoc(doc(db, "users", profile.uid), {
        appealPending: true,
      });
      toast.success("Appeal submitted successfully. Administrators have been notified.");
      await refreshProfile();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to submit appeal: " + e.message);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/35 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background border rounded-2xl shadow-card p-6 md:p-8 space-y-6 text-center">
        <div className="mx-auto size-16 bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl text-primary">
            Account Deletion Pending
          </h2>
          <p className="text-sm text-muted-foreground">
            Dear {profile.fullName}, an administrator has scheduled your account for deletion.
          </p>
        </div>

        {/* Countdown Box */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-secondary border-dashed">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            Deletion Scheduled In
          </p>
          <p className="font-mono text-3xl font-bold text-destructive mt-1.5 tabular-nums">
            {timeLeft || "Calculating..."}
          </p>
          {profile.deletedBy && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Scheduled by: <span className="font-semibold">{profile.deletedBy}</span>
            </p>
          )}
        </div>

        {profile.appealPending ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-800 text-left flex gap-3">
            <ShieldCheck className="size-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold">Appeal Reversal Submitted</p>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">
                Your appeal is pending verification by the administration team. Your account will
                not be fully deleted while this appeal is under active review.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              If this request was initiated in error or you wish to retain your account, you can
              submit an appeal for reversal before the countdown expires.
            </p>
            <Button
              onClick={handleAppeal}
              disabled={submittingAppeal}
              className="w-full bg-gradient-saffron text-primary font-semibold h-11"
            >
              {submittingAppeal ? "Submitting..." : "Submit Appeal for Reversal"}
            </Button>
          </div>
        )}

        <Button
          onClick={logout}
          variant="outline"
          className="w-full gap-2 border-muted-foreground/20 text-muted-foreground hover:text-primary h-11"
        >
          <LogOut className="size-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logout, refreshProfile } = useAuth();
  const router = useRouter();

  const [passId, setPassId] = useState<string | null>(null);

  // Redirect / log out if account is deleted
  useEffect(() => {
    if (!loading && profile && profile.deleted === "yes") {
      logout().then(() => {
        router.push("/login?error=deleted");
      });
    }
  }, [profile, loading, logout, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && profile && !profile.onboarded) {
      router.push("/onboarding");
    }
  }, [user, loading, profile, router]);

  useEffect(() => {
    if (user) {
      const fetchPass = async () => {
        try {
          const q = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
            where("passGenerated", "==", true),
            limit(1),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setPassId(snap.docs[0].data().passId || null);
          } else {
            setPassId(null);
          }
        } catch (e) {
          console.error("Failed to fetch user pass in dashboard layout", e);
        }
      };
      fetchPass();
    } else {
      setPassId(null);
    }
  }, [user]);

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

  // Intercept layout if user is pending deletion
  if (profile && profile.deleted === "pending") {
    return (
      <DeletionPendingScreen profile={profile} logout={logout} refreshProfile={refreshProfile} />
    );
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
      { to: "/dashboard/admin/mail-config", label: "Email Configuration", icon: Mail },
      { to: "/dashboard/admin/qr", label: "QR Studio", icon: QrCode },
      { to: "/dashboard/admin/qr/logs", label: "QR Audit Logs", icon: ScanLine },
      { to: "/dashboard/admin/team", label: "Team Management", icon: Users },
      { to: "/dashboard/admin/logs", label: "Audit Logs", icon: ClipboardList },
      { to: "/dashboard/results", label: "State Results", icon: Trophy },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  } else if (role === "manager") {
    nav = [
      { to: "/dashboard/manager", label: "Scanner Console", icon: LayoutDashboard },
      { to: "/dashboard", label: "District Review", icon: LayoutDashboard },
      { to: "/dashboard/admin/passes", label: "VIP Pass Generation", icon: Ticket },
      { to: "/dashboard/applications", label: "Assigned Applications", icon: FileText },
      { to: passId ? `/pass/${passId}` : "/pass/none", label: "My Pass", icon: Ticket },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  } else if (role === "team") {
    nav = [
      { to: "/dashboard/manager", label: "Scanner Console", icon: LayoutDashboard },
      { to: passId ? `/pass/${passId}` : "/pass/none", label: "My Pass", icon: Ticket },
      { to: "/dashboard/profile", label: "Profile", icon: User },
    ];
  } else {
    // Default user
    nav = [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/events", label: "Open Events", icon: CalendarSearch },
      { to: "/dashboard/applications", label: "My Applications", icon: FileText },
      { to: passId ? `/pass/${passId}` : "/pass/none", label: "My Pass", icon: Ticket },
      { to: "/dashboard/results", label: "Results", icon: Trophy },
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
