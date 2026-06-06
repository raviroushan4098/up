"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket, Users, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function ManagerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [totalIssued, setTotalIssued] = useState(0);
  const [totalEntry, setTotalEntry] = useState(0);
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!authLoading && user && (profile?.role === "manager" || profile?.role === "admin")) {
      const q = query(
        collection(db, "applications"),
        where("status", "in", ["accepted", "selected"]),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let issued = 0;
        let checkedIn = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.passId) {
            issued++;
          }
          if (data.checkedIn) {
            checkedIn++;
          }
        });

        setTotalIssued(issued);
        setTotalEntry(checkedIn);
      });

      return () => unsubscribe();
    }
  }, [user, profile, authLoading]);

  if (authLoading) return null;

  if (profile?.role !== "manager" && profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only managers can access this dashboard.</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Total Entry</CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{totalEntry}</div>
            <p className="text-sm text-muted-foreground mt-1">Checked-in participants</p>
          </CardContent>
        </Card>

        <Card>
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
    </div>
  );
}
