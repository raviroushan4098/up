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
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { sendProfileApprovedEmail, sendProfileRejectedEmail } from "@/actions/email";
import { Card, CardContent } from "@/components/ui/card";
import { logAuditAction } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type FilterTab = "all" | "pending" | "verified" | "rejected" | "deleted";

export default function VerificationPage() {
  const { profile: adminProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Master Password Action Dialog
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<UserProfile | null>(null);
  const [targetActionType, setTargetActionType] = useState<"delete" | "revert" | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const openActionDialog = (user: UserProfile, type: "delete" | "revert") => {
    setActionTarget(user);
    setTargetActionType(type);
    setMasterPassword("");
    setActionDialogOpen(true);
  };

  const handleAdminActionSubmit = async () => {
    if (!actionTarget || !targetActionType || !masterPassword.trim()) return;
    setSubmittingAction(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUid: actionTarget.uid,
          action: targetActionType,
          masterPassword: masterPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process administrative action.");
      }

      toast.success(
        targetActionType === "delete"
          ? `${actionTarget.fullName} has been scheduled for deletion.`
          : `${actionTarget.fullName}'s account has been successfully restored.`,
      );

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => {
          if (u.uid === actionTarget.uid) {
            if (targetActionType === "delete") {
              const now = new Date();
              const scheduled = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              return {
                ...u,
                deleted: "pending",
                deletionInitiatedAt: now.toISOString(),
                deletionScheduledAt: scheduled.toISOString(),
                deletedBy: adminProfile?.fullName || "Admin",
                deletedByUid: adminProfile?.uid || "admin",
              };
            } else {
              return {
                ...u,
                deleted: "no",
                deletionInitiatedAt: undefined,
                deletionScheduledAt: undefined,
                deletedBy: undefined,
                deletedByUid: undefined,
                appealPending: undefined,
              };
            }
          }
          return u;
        }),
      );

      setActionDialogOpen(false);
      setActionTarget(null);
      setTargetActionType(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to execute action.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Fetch all onboarded users
  useEffect(() => {
    const fetchUsers = async () => {
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
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Failed to load user profiles.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleApprove = async (user: UserProfile) => {
    setActionLoading(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        verificationStatus: "verified",
        rejectionReason: null,
        verificationUpdatedAt: new Date().toISOString(),
        verifiedBy: adminProfile?.uid || "admin",
      });
      setUsers((prev) =>
        prev.map((c) =>
          c.uid === user.uid
            ? { ...c, verificationStatus: "verified", rejectionReason: undefined }
            : c,
        ),
      );
      toast.success(`${user.fullName}'s profile has been verified ✅`);

      // Log the audit action
      logAuditAction({
        actionType: "PROFILE_VERIFICATION_CHANGED",
        entityId: user.uid,
        entityName: user.fullName,
        entityPhone: user.phoneNumber || "",
        previousValue: user.verificationStatus || "pending",
        newValue: "verified",
        performedByUid: adminProfile?.uid || "admin",
        performedByName: adminProfile?.fullName || "Admin",
        performedByRole: adminProfile?.role || "admin",
      });

      // Fire and forget email notification
      sendProfileApprovedEmail(user.email, user.fullName).catch(console.error);
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve profile.");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (user: UserProfile) => {
    setRejectTarget(user);
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

      setUsers((prev) =>
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

      // Log the audit action
      logAuditAction({
        actionType: "PROFILE_VERIFICATION_CHANGED",
        entityId: rejectTarget.uid,
        entityName: rejectTarget.fullName,
        entityPhone: rejectTarget.phoneNumber || "",
        previousValue: rejectTarget.verificationStatus || "pending",
        newValue: "rejected",
        performedByUid: adminProfile?.uid || "admin",
        performedByName: adminProfile?.fullName || "Admin",
        performedByRole: adminProfile?.role || "admin",
      });

      // Fire and forget email notification
      sendProfileRejectedEmail(
        rejectTarget.email,
        rejectTarget.fullName,
        rejectionReason.trim(),
      ).catch(console.error);

      setRejectDialogOpen(false);
      setRejectTarget(null);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to reject profile.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportProfilesExcel = () => {
    if (filteredUsers.length === 0) {
      toast.error("No profiles to export.");
      return;
    }

    const data = filteredUsers.map((u) => ({
      Name: u.fullName || "N/A",
      "Father's Name": u.fatherName || "N/A",
      Email: u.email || "N/A",
      Phone: u.phoneNumber ? String(u.phoneNumber) : "N/A",
      Profession: u.profession || "N/A",
      "Village/City": u.villageCity || "N/A",
      Status: (u.verificationStatus || "pending").toUpperCase(),
      "Date Registered": u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Profiles");
    XLSX.writeFile(workbook, `verified_profiles_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const filteredUsers = users.filter((c) => {
    if (activeTab === "deleted") {
      if (c.deleted !== "pending" && c.deleted !== "yes") {
        return false;
      }
    } else {
      // Exclude soft-deleted users from all normal tabs
      if (c.deleted === "pending" || c.deleted === "yes") {
        return false;
      }
      if (activeTab !== "all" && (c.verificationStatus ?? "pending") !== activeTab) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.fullName?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const phoneMatch = c.phoneNumber?.toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch;
    }
    return true;
  });

  const countBy = (status: string) => {
    if (status === "deleted") {
      return users.filter((c) => c.deleted === "pending" || c.deleted === "yes").length;
    }
    // Only count active users in normal tabs
    return users.filter(
      (c) => (!c.deleted || c.deleted === "no") && (c.verificationStatus ?? "pending") === status,
    ).length;
  };

  const totalActiveUsers = users.filter((c) => !c.deleted || c.deleted === "no").length;

  const stats = [
    {
      label: "Total Profiles",
      value: totalActiveUsers,
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
    { key: "deleted", label: "Deleted" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-primary">
          Profile Verification Panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review user profiles, verify identity documents and approve or reject registrations.
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

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-full bg-secondary border-transparent focus-visible:border-primary w-full"
            />
          </div>
          <Button
            onClick={handleExportProfilesExcel}
            variant="outline"
            className="w-full sm:w-auto rounded-full gap-2 shrink-0"
          >
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-0 shadow-card">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No profiles found</p>
            <p className="text-sm mt-1">No users match the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user, i) => {
            const status = user.verificationStatus ?? "pending";
            const isExpanded = expandedId === user.uid;
            const isActing = actionLoading === user.uid;

            return (
              <motion.div
                key={user.uid}
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
                        {user.profilePhotoUrl ? (
                          <img
                            src={user.profilePhotoUrl}
                            alt={user.fullName}
                            className="size-14 rounded-xl object-cover border shadow-soft cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImage(user.profilePhotoUrl!)}
                          />
                        ) : (
                          <div className="size-14 rounded-xl bg-gradient-saffron grid place-items-center font-display font-extrabold text-primary text-lg">
                            {user.fullName
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
                            {user.fullName}
                          </span>
                          <StatusBadge status={status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>{user.email}</span>
                          {(user.district || user.state) && (
                            <span>📍 {[user.district, user.state].filter(Boolean).join(", ")}</span>
                          )}
                          {user.profession && <span>💼 {user.profession}</span>}
                        </div>
                        {status === "rejected" && user.rejectionReason && (
                          <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="size-3" />
                            {user.rejectionReason.slice(0, 80)}
                            {user.rejectionReason.length > 80 ? "..." : ""}
                          </p>
                        )}
                        {(user.deleted === "pending" || user.deleted === "yes") && (
                          <div className="mt-2 flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className={
                                  user.deleted === "pending"
                                    ? "text-amber-600 border-amber-500/30 bg-amber-500/5 text-[10px] h-5"
                                    : "text-destructive border-destructive/20 bg-destructive/5 text-[10px] h-5"
                                }
                              >
                                {user.deleted === "pending" ? "Deletion Pending" : "Fully Deleted"}
                              </Badge>
                              {user.appealPending && (
                                <Badge className="bg-emerald-500 text-white font-semibold text-[10px] h-5 px-2 rounded-full">
                                  Appeal Submitted
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {user.deleted === "pending" ? (
                                <>
                                  Scheduled:{" "}
                                  <span className="font-semibold text-destructive">
                                    {new Date(user.deletionScheduledAt!).toLocaleString()}
                                  </span>
                                  {user.deletedBy && <span> (by {user.deletedBy})</span>}
                                </>
                              ) : (
                                <>Account is fully soft-deleted.</>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedId(isExpanded ? null : user.uid)}
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

                        {user.deleted === "pending" || user.deleted === "yes" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing}
                            onClick={() => openActionDialog(user, "revert")}
                            className="h-8 text-xs text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/10 gap-1"
                          >
                            <ShieldCheck className="size-3.5" /> Revert Deletion
                          </Button>
                        ) : (
                          <>
                            {status !== "verified" && (
                              <Button
                                size="sm"
                                disabled={isActing}
                                onClick={() => handleApprove(user)}
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
                                onClick={() => openRejectDialog(user)}
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
                                onClick={() => openRejectDialog(user)}
                                className="h-8 text-xs gap-1 border-warning/25 text-warning-foreground"
                              >
                                <AlertTriangle className="size-3.5" />
                                Edit Reason
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isActing}
                              onClick={() => openActionDialog(user, "delete")}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/25 gap-1"
                            >
                              <AlertTriangle className="size-3.5" />
                              Delete User
                            </Button>
                          </>
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
                              <DetailRow label="Full Name" value={user.fullName} />
                              <DetailRow label="Father's Name" value={user.fatherName} />
                              <DetailRow label="Mother's Name" value={user.motherName} />
                              <DetailRow label="Gender" value={user.gender} />
                              <DetailRow label="Date of Birth" value={user.dob} />
                              <DetailRow label="Age" value={user.age?.toString()} />
                              <DetailRow label="Profession" value={user.profession} />
                            </div>

                            {/* Contact & Location */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Contact & Location
                              </h4>
                              <DetailRow label="Email" value={user.email} />
                              <DetailRow label="Phone" value={user.phoneNumber} />
                              <DetailRow label="District" value={user.district} />
                              <DetailRow label="State" value={user.state} />
                              <DetailRow label="Village / City" value={user.villageCity} />
                              <DetailRow label="Address" value={user.address} />
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
              profile. This reason will be shown to the user so they can make corrections.
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

      {/* Image Enlarge Dialog */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">Enlarged Profile Image</DialogTitle>
          {enlargedImage && (
            <div className="relative flex justify-center items-center">
              <img
                src={enlargedImage}
                alt="Enlarged profile"
                className="max-w-full max-h-[85vh] rounded-xl object-contain bg-black/50 backdrop-blur-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Master Password Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-primary">
              <ShieldCheck className="size-5 text-primary" />
              Confirm Admin Authorization
            </DialogTitle>
            <DialogDescription>
              {targetActionType === "delete" ? (
                <>
                  Are you sure you want to schedule account deletion for{" "}
                  <strong>{actionTarget?.fullName}</strong>? This will initiate a 24-hour cooldown
                  period, during which the user can appeal.
                </>
              ) : (
                <>
                  Are you sure you want to restore the account and revert deletion for{" "}
                  <strong>{actionTarget?.fullName}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="master-password">Master Password</Label>
              <Input
                id="master-password"
                type="password"
                placeholder="Enter master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                disabled={submittingAction}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={submittingAction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdminActionSubmit}
                disabled={!masterPassword.trim() || submittingAction}
                className={
                  targetActionType === "delete"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-success text-success-foreground hover:opacity-90"
                }
              >
                {submittingAction
                  ? "Processing..."
                  : targetActionType === "delete"
                    ? "Confirm Deletion"
                    : "Confirm Restore"}
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
