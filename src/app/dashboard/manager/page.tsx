"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, ScanLine, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { EventApplication } from "@/types/events";

export default function ManagerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [totalIssued, setTotalIssued] = useState(0);
  const [totalEntry, setTotalEntry] = useState(0);
  const [issuedApps, setIssuedApps] = useState<EventApplication[]>([]);

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"entry" | "remaining" | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      (profile?.role === "manager" || profile?.role === "admin" || profile?.role === "team")
    ) {
      const q = query(
        collection(db, "applications"),
        where("status", "in", ["accepted", "selected"]),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedApps: EventApplication[] = [];
        let issued = 0;
        let checkedIn = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as EventApplication;
          if (data.isTeamPass) return;

          if (data.passId) {
            issued++;
            fetchedApps.push({ ...data, id: doc.id });
            if (data.checkedIn) {
              checkedIn++;
            }
          }
        });

        setIssuedApps(fetchedApps);
        setTotalIssued(issued);
        setTotalEntry(checkedIn);
      });

      return () => unsubscribe();
    }
  }, [user, profile, authLoading]);

  if (authLoading) return null;

  if (profile?.role !== "manager" && profile?.role !== "admin" && profile?.role !== "team") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only authorized staff can access this dashboard.</p>
      </div>
    );
  }

  const handleScan = (detectedCodes: any[]) => {
    if (isScanning) return; // Prevent double scans rapidly

    if (detectedCodes && detectedCodes.length > 0) {
      const value = detectedCodes[0].rawValue;
      if (value.includes("/dashboard/admin/verify/")) {
        setIsScanning(true);
        try {
          const url = new URL(value);
          router.push(url.pathname);
          toast.success("Pass detected! Redirecting to verification...");
        } catch (e) {
          router.push(value);
        }
      } else {
        toast.error("Invalid QR Code scanned.");
      }
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Scanner Console</h1>
        <p className="text-muted-foreground">Live entry statistics and QR verification scanner.</p>
      </div>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          placeholder="Search delegate by name, email, or phone to check entry status..."
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-card text-base rounded-xl shadow-sm border-primary/20"
        />
      </div>

      {globalSearchQuery.trim().length > 0 && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-lg">Search Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {issuedApps
              .filter(
                (a) =>
                  a.applicantName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  a.applicantEmail?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  a.applicantPhone?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  a.applicationNo?.toLowerCase().includes(globalSearchQuery.toLowerCase()),
              )
              .map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-background hover:bg-secondary/20 transition-colors gap-3"
                >
                  <div>
                    <div className="font-semibold">{app.applicantName}</div>
                    <div className="text-xs text-muted-foreground">
                      {app.applicantEmail} • {app.applicantPhone}
                    </div>
                  </div>
                  <Badge
                    variant={app.checkedIn ? "default" : "secondary"}
                    className={
                      app.checkedIn
                        ? "bg-success text-success-foreground"
                        : "bg-warning/20 text-warning-foreground whitespace-nowrap"
                    }
                  >
                    {app.checkedIn ? "Entry Done" : "Entry Pending"}
                  </Badge>
                </div>
              ))}
            {issuedApps.filter(
              (a) =>
                a.applicantName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                a.applicantEmail?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                a.applicantPhone?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                a.applicationNo?.toLowerCase().includes(globalSearchQuery.toLowerCase()),
            ).length === 0 && (
              <div className="text-center text-muted-foreground py-6 text-sm">
                No delegates found matching "{globalSearchQuery}"
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className="border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
          onClick={() => {
            setModalType("entry");
            setModalOpen(true);
            setModalSearchQuery("");
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Total Entry</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{totalEntry}</div>
            <p className="text-sm text-muted-foreground mt-1">Checked-in participants</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-secondary/60 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md"
          onClick={() => {
            setModalType("remaining");
            setModalOpen(true);
            setModalSearchQuery("");
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Remaining to Enter</CardTitle>
            <Ticket className="size-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalIssued - totalEntry}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Out of {totalIssued} total issued passes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine className="size-5 text-primary" />
              <CardTitle>Live QR Scanner</CardTitle>
            </div>
            <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-medium text-primary flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Camera Active
            </div>
          </div>
          <CardDescription>
            Point your camera at a participant's Digital Pass to instantly verify and check them in.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 bg-black">
          <div
            className="w-full flex items-center justify-center relative overflow-hidden mx-auto"
            style={{ maxWidth: "600px" }}
          >
            <Scanner onScan={handleScan} formats={["qr_code"]} />
          </div>
        </CardContent>
      </Card>

      {/* List Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-4 border-b border-border/40">
            <DialogTitle className="text-2xl font-display font-bold">
              {modalType === "entry" ? "Checked-In Delegates" : "Pending Entry Delegates"}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/30"
            />
          </div>

          <div className="overflow-y-auto flex-1 mt-4 space-y-2 pr-2 hide-scrollbar">
            {issuedApps
              .filter((a) => (modalType === "entry" ? a.checkedIn : !a.checkedIn))
              .filter(
                (a) =>
                  !modalSearchQuery ||
                  a.applicantName?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  a.applicantEmail?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  a.applicantPhone?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  a.applicationNo?.toLowerCase().includes(modalSearchQuery.toLowerCase()),
              )
              .map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-xl bg-card hover:bg-accent/5 transition-colors gap-3"
                >
                  <div>
                    <div className="font-semibold text-primary">{app.applicantName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {app.applicantEmail} • {app.applicantPhone}
                    </div>
                  </div>
                  <div className="text-xs font-mono bg-secondary px-2.5 py-1 rounded-md text-muted-foreground border">
                    {app.applicationNo}
                  </div>
                </div>
              ))}

            {issuedApps.filter((a) => (modalType === "entry" ? a.checkedIn : !a.checkedIn))
              .length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                {modalType === "entry" ? "No one has checked in yet." : "Everyone has checked in!"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
