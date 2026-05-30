"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from "firebase/firestore";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type FilterTab = "all" | "pending" | "verified" | "rejected";

export default function VerificationPage() {
  const { profile: adminProfile } = useAuth();
  const [citizens, setCitizens] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch all onboarded citizens
  useEffect(() => {
    const fetchCitizens = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), where("onboarded", "==", true));
        const snapshot = await getDocs(q);
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as UserProfile;
          if (data.role === "user") list.push(data);
        });
        // Sort: pending first, then rejected, then verified
        list.sort((a, b) => {
          const order: Record<string, number> = {
            pending: 0,
            rejected: 1,
            verified: 2,
          };
          const aOrder = order[a.verificationStatus ?? "pending"] ?? 0;
          const bOrder = order[b.verificationStatus ?? "pending"] ?? 0;
          return aOrder - bOrder;
        });
        setCitizens(list);
      } catch (err) {
        console.error("Error fetching citizens:", err);
        toast.error("Failed to load citizen profiles.");
      } finally {
        setLoading(false);
      }
    };
    fetchCitizens();
  }, []);

  const handleApprove = async (citizen: UserProfile) => {
    setActionLoading(citizen.uid);
    try {
      await updateDoc(doc(db, "users", citizen.uid), {
        verificationStatus: "verified",
        rejectionReason: null,
        verificationUpdatedAt: new Date().toISOString(),
        verifiedBy: adminProfile?.uid || "admin",
      });
      setCitizens((prev) =>
        prev.map((c) =>
          c.uid === citizen.uid
            ? { ...c, verificationStatus: "verified", rejectionReason: undefined }
            : c,
        ),
      );
      toast.success(`${citizen.fullName}'s profile has been verified ✅`);
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve profile.");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (citizen: UserProfile) => {
    setRejectTarget(citizen);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setActionLoading(rejectTarget.uid);
    try {
      await updateDoc(doc(db, "users", rejectTarget.uid), {
        verificationStatus: "rejected",
        rejectionReason: rejectionReason.trim(),
        verificationUpdatedAt: new Date().toISOString(),
        rejectedBy: adminProfile?.uid || "admin",
      });

      // Automatically delete any pending event applications for this rejected user
      const appsQuery = query(
        collection(db, "applications"),
        where("userId", "==", rejectTarget.uid),
        where("status", "==", "pending"),
      );
      const appsSnapshot = await getDocs(appsQuery);

      const deletePromises = appsSnapshot.docs.map((appDoc) =>
        deleteDoc(doc(db, "applications", appDoc.id)),
      );
      await Promise.all(deletePromises);

      setCitizens((prev) =>
        prev.map((c) =>
          c.uid === rejectTarget.uid
            ? {
                ...c,
                verificationStatus: "rejected",
                rejectionReason: rejectionReason.trim(),
              }
            : c,
        ),
      );
      toast.success(`${rejectTarget.fullName}'s profile has been rejected.`);
      setRejectDialogOpen(false);
      setRejectTarget(null);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to reject profile.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCitizens = citizens.filter((c) => {
    if (activeTab === "all") return true;
    return (c.verificationStatus ?? "pending") === activeTab;
  });

  const countBy = (status: string) =>
    citizens.filter((c) => (c.verificationStatus ?? "pending") === status).length;

  const stats = [
    {
      label: "Total Profiles",
      value: citizens.length,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Review",
      value: countBy("pending"),
      icon: Clock,
      color: "text-warning-foreground",
      bg: "bg-warning/20",
    },
    {
      label: "Verified",
      value: countBy("verified"),
      icon: ShieldCheck,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Rejected",
      value: countBy("rejected"),
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "verified", label: "Verified" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-primary">
          Profile Verification Panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review citizen profiles, verify identity documents and approve or reject registrations.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 shadow-card">
              <CardContent className="p-5">
                <div className={`size-10 rounded-xl grid place-items-center ${s.bg}`}>
                  <s.icon className={`size-5 ${s.color}`} />
                </div>
                <div className="font-display font-extrabold text-2xl mt-3 text-primary">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-base ${
              activeTab === t.key
                ? "bg-gradient-saffron text-primary shadow-soft"
                : "bg-secondary text-foreground/60 hover:text-primary"
            }`}
          >
            {t.label}
            {t.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">({countBy(t.key)})</span>
            )}
          </button>
        ))}
      </div>

      {/* Citizens List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      ) : filteredCitizens.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No profiles found</p>
            <p className="text-sm mt-1">No citizens match the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCitizens.map((citizen, i) => {
            const status = citizen.verificationStatus ?? "pending";
            const isExpanded = expandedId === citizen.uid;
            const isActing = actionLoading === citizen.uid;

            return (
              <motion.div
                key={citizen.uid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-0 shadow-card overflow-hidden">
                  {/* Status indicator strip */}
                  <div
                    className={`h-1 ${
                      status === "verified"
                        ? "bg-success"
                        : status === "rejected"
                          ? "bg-destructive"
                          : "bg-warning"
                    }`}
                  />
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Profile Photo */}
                      <div className="shrink-0">
                        {citizen.profilePhotoUrl ? (
                          <img
                            src={citizen.profilePhotoUrl}
                            alt={citizen.fullName}
                            className="size-14 rounded-xl object-cover border shadow-soft"
                          />
                        ) : (
                          <div className="size-14 rounded-xl bg-gradient-saffron grid place-items-center font-display font-extrabold text-primary text-lg">
                            {citizen.fullName
                              .split(" ")
                              .map((s) => s[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-primary">
                            {citizen.fullName}
                          </span>
                          <StatusBadge status={status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>{citizen.email}</span>
                          {citizen.district && <span>📍 {citizen.district}</span>}
                          {citizen.aadhaarNumber && (
                            <span>🪪 {maskAadhaar(citizen.aadhaarNumber)}</span>
                          )}
                        </div>
                        {status === "rejected" && citizen.rejectionReason && (
                          <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="size-3" />
                            {citizen.rejectionReason.slice(0, 80)}
                            {citizen.rejectionReason.length > 80 ? "..." : ""}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedId(isExpanded ? null : citizen.uid)}
                          className="h-8 text-xs gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff className="size-3.5" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="size-3.5" /> View
                            </>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                        </Button>
                        {status !== "verified" && (
                          <Button
                            size="sm"
                            disabled={isActing}
                            onClick={() => handleApprove(citizen)}
                            className="h-8 text-xs bg-success text-success-foreground hover:opacity-90 gap-1"
                          >
                            <CheckCircle2 className="size-3.5" />
                            {isActing ? "..." : "Approve"}
                          </Button>
                        )}
                        {status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing}
                            onClick={() => openRejectDialog(citizen)}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/25 gap-1"
                          >
                            <XCircle className="size-3.5" />
                            Reject
                          </Button>
                        )}
                        {status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing}
                            onClick={() => openRejectDialog(citizen)}
                            className="h-8 text-xs gap-1 border-warning/25 text-warning-foreground"
                          >
                            <AlertTriangle className="size-3.5" />
                            Edit Reason
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 pt-5 border-t grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Personal Details */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Personal
                              </h4>
                              <DetailRow label="Full Name" value={citizen.fullName} />
                              <DetailRow label="Father's Name" value={citizen.fatherName} />
                              <DetailRow label="Mother's Name" value={citizen.motherName} />
                              <DetailRow label="Gender" value={citizen.gender} />
                              <DetailRow label="Date of Birth" value={citizen.dob} />
                              <DetailRow label="Age" value={citizen.age?.toString()} />
                            </div>

                            {/* Contact & Location */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Contact & Location
                              </h4>
                              <DetailRow label="Email" value={citizen.email} />
                              <DetailRow label="Phone" value={citizen.phoneNumber} />
                              <DetailRow label="District" value={citizen.district} />
                              <DetailRow label="Village / City" value={citizen.villageCity} />
                              <DetailRow label="Address" value={citizen.address} />
                            </div>

                            {/* Documents */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Documents
                              </h4>
                              <DetailRow
                                label="Aadhaar Number"
                                value={
                                  citizen.aadhaarNumber
                                    ? maskAadhaar(citizen.aadhaarNumber)
                                    : undefined
                                }
                              />
                              {/* Aadhaar Document Preview */}
                              {citizen.aadhaarUploadUrl && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Aadhaar Document
                                  </p>
                                  {citizen.aadhaarUploadUrl.startsWith("https://firebasestorage") ||
                                  citizen.aadhaarUploadUrl.includes("firebasestorage") ? (
                                    citizen.aadhaarUploadUrl.toLowerCase().includes(".pdf") ? (
                                      <a
                                        href={citizen.aadhaarUploadUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                                      >
                                        <FileText className="size-3.5" />
                                        View PDF Document
                                      </a>
                                    ) : (
                                      <a
                                        href={citizen.aadhaarUploadUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <img
                                          src={citizen.aadhaarUploadUrl}
                                          alt="Aadhaar"
                                          className="h-28 rounded-lg border object-cover hover:opacity-90 transition-base"
                                        />
                                      </a>
                                    )
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive flex items-center gap-2">
              <XCircle className="size-5" />
              {rejectTarget?.verificationStatus === "rejected"
                ? "Edit Rejection Reason"
                : "Reject Profile"}
            </DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejecting <strong>{rejectTarget?.fullName}</strong>&apos;s
              profile. This reason will be shown to the citizen so they can make corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-semibold">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejection-reason"
                rows={4}
                className="mt-1.5 resize-none"
                placeholder="e.g. Aadhaar image is blurry and unreadable. Please upload a clear, high-resolution scan."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {rejectionReason.length}/500
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || !!actionLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <XCircle className="size-4 mr-1.5" />
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <Badge className="bg-success/15 text-success border border-success/25 text-[10px] h-5 px-2 rounded-full">
        <CheckCircle2 className="size-2.5 mr-1" /> Verified
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-destructive/15 text-destructive border border-destructive/25 text-[10px] h-5 px-2 rounded-full">
        <XCircle className="size-2.5 mr-1" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/20 text-warning-foreground border border-warning/30 text-[10px] h-5 px-2 rounded-full">
      <Clock className="size-2.5 mr-1" /> Pending Review
    </Badge>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      <p className="text-xs font-semibold text-primary mt-0.5 break-words">{value}</p>
    </div>
  );
}

function maskAadhaar(aadhaar: string) {
  const digits = aadhaar.replace(/-/g, "");
  return `XXXX-XXXX-${digits.slice(-4)}`;
}
