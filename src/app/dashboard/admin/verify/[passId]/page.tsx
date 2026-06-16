"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { EventApplication } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logAuditAction } from "@/lib/audit";

export default function VerifyPassPage() {
  const params = useParams();
  const passId = params.passId as string;

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<EventApplication | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");

  const [checkingIn, setCheckingIn] = useState(false);

  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!passId) return;
      try {
        const q = query(collection(db, "applications"), where("passId", "==", passId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setApplication(null);
          setLoading(false);
          return;
        }

        const docSnap = snapshot.docs[0];
        const appData = docSnap.data() as EventApplication;
        setDocId(docSnap.id);
        setApplication(appData);

        // Fetch User Profile
        if (appData.userId) {
          const userDoc = await getDoc(doc(db, "users", appData.userId));
          if (userDoc.exists() && userDoc.data().profilePhotoUrl) {
            setProfilePhotoUrl(userDoc.data().profilePhotoUrl);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && profile && (profile.role === "admin" || profile.role === "manager")) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [passId, profile, authLoading]);

  const handleCheckIn = async () => {
    if (!docId) return;
    setCheckingIn(true);
    try {
      await updateDoc(doc(db, "applications", docId), {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
      });

      if (user && application) {
        await logAuditAction({
          actionType: "PARTICIPANT_CHECKED_IN",
          entityId: docId,
          entityName: application.applicantName || "Unknown Applicant",
          applicationNo: application.applicationNo || "N/A",
          previousValue: "Pending",
          newValue: "Checked In",
          performedByUid: user.uid,
          performedByName: user.displayName || user.email || "Unknown Manager",
          performedByRole: profile?.role || "manager",
        });
      }

      // Update local state to reflect it instantly
      setApplication((prev) =>
        prev ? { ...prev, checkedIn: true, checkedInAt: new Date().toISOString() as any } : null,
      );
      toast.success("Participant successfully checked in!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to check in participant");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh]">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying Digital Pass...</p>
      </div>
    );
  }

  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Card className="max-w-md w-full border-destructive bg-destructive/5 text-center">
          <CardHeader>
            <AlertTriangle className="size-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
            <CardDescription>you are not authorised to verify</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Card className="max-w-md w-full border-destructive bg-destructive/5 text-center">
          <CardHeader>
            <XCircle className="size-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl text-destructive">Invalid Pass</CardTitle>
            <CardDescription>
              This QR code does not match any valid pass in the system. Please do not allow entry.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isCheckedIn = application.checkedIn;
  const isTeamPass = application.isTeamPass;

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Pass Verification</h1>
        <p className="text-muted-foreground mt-2">Scan & Verify participant entry</p>
      </div>

      <Card
        className={`overflow-hidden border-2 ${isTeamPass ? "border-blue-500 shadow-blue-500/20 shadow-xl" : isCheckedIn ? "border-amber-500" : "border-success"}`}
      >
        <div
          className={`p-4 text-center text-white ${isTeamPass ? "bg-gradient-to-r from-blue-600 to-indigo-600" : isCheckedIn ? "bg-amber-500" : "bg-success"}`}
        >
          {isTeamPass ? (
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="size-10" />
              <h2 className="text-xl font-bold tracking-wider">STAFF VERIFIED</h2>
              <p className="text-sm opacity-90 font-medium">
                Designation: {application.designation}
              </p>
            </div>
          ) : isCheckedIn ? (
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="size-10" />
              <h2 className="text-xl font-bold tracking-wider">ALREADY CHECKED IN</h2>
              <p className="text-sm opacity-90 font-medium">Do not grant duplicate entry</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="size-10" />
              <h2 className="text-xl font-bold tracking-wider">VALID PASS</h2>
              <p className="text-sm opacity-90 font-medium">Participant is clear for entry</p>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="flex gap-6 items-center">
            <Avatar className="size-24 border-2 shadow-sm">
              <AvatarImage src={profilePhotoUrl} />
              <AvatarFallback className="text-2xl">
                {application.applicantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-bold text-primary">{application.applicantName}</h3>
              <p className="text-sm font-medium text-muted-foreground font-mono mt-1">{passId}</p>
              <Badge
                variant="secondary"
                className={`mt-2 ${isTeamPass ? "bg-blue-100 text-blue-700" : "bg-primary/10 text-primary"}`}
              >
                {isTeamPass
                  ? application.designation
                  : application.schoolCollegeName
                    ? "Student"
                    : "Delegate"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 bg-secondary/20 p-4 rounded-xl border border-secondary">
            <div className="flex items-center gap-3">
              <User className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                <p className="font-medium text-sm">
                  {isTeamPass
                    ? "Internal Organization Team"
                    : application.schoolCollegeName
                      ? "Youth Leader (Student)"
                      : "General Delegate"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">District</p>
                <p className="font-medium text-sm">
                  {application.applicantDistrict || "Uttar Pradesh"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Mobile Number
                </p>
                <p className="font-medium text-sm">{application.applicantPhone || "Verified"}</p>
              </div>
            </div>
          </div>

          {isTeamPass ? (
            <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-500/10 p-4 rounded-xl font-medium border border-blue-500/20">
              <ShieldCheck className="size-5" />
              Staff Pass - Verification Only
            </div>
          ) : !isCheckedIn ? (
            <Button
              size="lg"
              className="w-full text-lg h-14 bg-gradient-saffron text-primary font-bold shadow-lg shadow-saffron/20 hover:opacity-90"
              onClick={handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn ? (
                <Loader2 className="size-6 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="size-6 mr-2" />
              )}
              Check-In Participant
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-500/10 p-4 rounded-xl font-medium border border-amber-500/20">
              <Clock className="size-5" />
              Participant was marked as checked-in
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
