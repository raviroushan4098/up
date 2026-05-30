"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/hooks/useAuth";

interface VerificationBannerProps {
  profile: UserProfile;
}

export function VerificationBanner({ profile }: VerificationBannerProps) {
  const status = profile.verificationStatus ?? "pending";

  if (status === "verified") {
    return null; // No banner needed for verified users
  }

  if (status === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-warning/15 border border-warning/30 rounded-xl px-4 py-3 flex items-start sm:items-center gap-3"
      >
        <div className="size-8 rounded-full bg-warning/20 grid place-items-center shrink-0">
          <Clock className="size-4 text-warning-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-warning-foreground">Profile Under Review</p>
          <p className="text-xs text-warning-foreground/80 mt-0.5">
            Our team is verifying your Aadhaar and documents. Some features are limited until
            approval. This usually takes 1–2 business days.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === "rejected") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-3"
      >
        <div className="size-8 rounded-full bg-destructive/15 grid place-items-center shrink-0 mt-0.5">
          <XCircle className="size-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-destructive">Profile Verification Rejected</p>
          {profile.rejectionReason && (
            <div className="mt-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                <AlertTriangle className="size-3" /> Reason from Admin:
              </p>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {profile.rejectionReason}
              </p>
            </div>
          )}
          <p className="text-xs text-destructive/80 mt-2">
            Please update your profile with the corrections and resubmit for review.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 text-xs"
          >
            <Link href="/dashboard/profile">Update Profile Now</Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}

export function VerificationStatusBadge({ status }: { status?: string }) {
  const s = status ?? "pending";
  if (s === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/25">
        <CheckCircle2 className="size-2.5" /> Verified
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/25">
        <XCircle className="size-2.5" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground border border-warning/25">
      <Clock className="size-2.5" /> Pending Review
    </span>
  );
}
