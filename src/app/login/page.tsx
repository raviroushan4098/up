"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── OTP Rate Limiting Helpers ────────────────────────────────────────
const MAX_OTP_PER_DAY = 3;
const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes between each request

/** Get today's date string in YYYY-MM-DD format (IST) */
const getTodayIST = (): string => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

/** Sanitize phone to use as Firestore document ID (digits only) */
const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

interface OtpLimitResult {
  allowed: boolean;
  remaining: number;
  cooldownSeconds: number; // seconds to wait before next OTP (0 = ready)
}

/**
 * Check OTP rate limit for a phone number.
 * Enforces: max 3/day AND 2-minute gap between requests.
 */
const checkOtpLimit = async (phone: string): Promise<OtpLimitResult> => {
  const phoneKey = sanitizePhone(phone);
  const today = getTodayIST();
  const limitRef = doc(db, "otp_limits", phoneKey);
  const snap = await getDoc(limitRef);

  if (!snap.exists()) {
    return { allowed: true, remaining: MAX_OTP_PER_DAY, cooldownSeconds: 0 };
  }

  const data = snap.data();

  // If date is different (new day), reset is allowed
  if (data.date !== today) {
    // Still check cooldown even across days
    if (data.lastSentAt?.toMillis) {
      const elapsed = Date.now() - data.lastSentAt.toMillis();
      if (elapsed < OTP_COOLDOWN_MS) {
        const waitSec = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
        return { allowed: false, remaining: MAX_OTP_PER_DAY, cooldownSeconds: waitSec };
      }
    }
    return { allowed: true, remaining: MAX_OTP_PER_DAY, cooldownSeconds: 0 };
  }

  const currentCount = data.count || 0;

  // Check daily limit first
  if (currentCount >= MAX_OTP_PER_DAY) {
    return { allowed: false, remaining: 0, cooldownSeconds: 0 };
  }

  // Check 2-minute cooldown
  if (data.lastSentAt?.toMillis) {
    const elapsed = Date.now() - data.lastSentAt.toMillis();
    if (elapsed < OTP_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      return {
        allowed: false,
        remaining: MAX_OTP_PER_DAY - currentCount,
        cooldownSeconds: waitSec,
      };
    }
  }

  return {
    allowed: true,
    remaining: MAX_OTP_PER_DAY - currentCount,
    cooldownSeconds: 0,
  };
};

/**
 * Record an OTP send in Firestore. Increments count for today.
 * If it's a new day, resets count to 1.
 */
const recordOtpSend = async (phone: string): Promise<void> => {
  const phoneKey = sanitizePhone(phone);
  const today = getTodayIST();
  const limitRef = doc(db, "otp_limits", phoneKey);
  const snap = await getDoc(limitRef);

  if (!snap.exists() || snap.data().date !== today) {
    // New document or new day — reset to 1
    await setDoc(limitRef, { count: 1, date: today, lastSentAt: serverTimestamp() });
  } else {
    // Same day — increment
    const currentCount = snap.data().count || 0;
    await setDoc(limitRef, { count: currentCount + 1, date: today, lastSentAt: serverTimestamp() });
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Phone Auth State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining in cooldown

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {
          console.error("Error cleaning up RecaptchaVerifier:", e);
        }
      }
    };
  }, []);

  // Recaptcha setup
  const setupRecaptcha = () => {
    if (typeof window === "undefined") return;
    try {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing previous RecaptchaVerifier:", e);
        }
      }
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      (window as any).recaptchaVerifier = recaptchaVerifier;
      return recaptchaVerifier;
    } catch (error: any) {
      console.error("Recaptcha initialization error:", error);
      if (error.message?.includes("already been rendered")) {
        window.location.reload();
        return;
      }
      toast.error("Failed to initialize security verification. Please try again.");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    setSubmitting(true);
    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      // ── OTP Rate Limit Check ──────────────────────────────────────
      const { allowed, remaining, cooldownSeconds } = await checkOtpLimit(formattedPhone);
      if (!allowed) {
        if (cooldownSeconds > 0) {
          // Cooldown active — not daily limit
          setCooldown(cooldownSeconds);
          toast.error(`Please wait ${cooldownSeconds}s before requesting another OTP.`);
        } else {
          // Daily limit reached
          toast.error("Daily OTP limit reached (3/day). Please try again tomorrow.", {
            duration: 5000,
          });
          setOtpRemaining(0);
        }
        setSubmitting(false);
        return;
      }

      const verifier = setupRecaptcha();
      if (!verifier) {
        setSubmitting(false);
        return;
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);

      // ── Record successful OTP send ────────────────────────────────
      await recordOtpSend(formattedPhone);
      setOtpRemaining(remaining - 1);

      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success(`OTP sent to ${formattedPhone} (${remaining - 1} attempts remaining today)`);
    } catch (error: any) {
      console.error("Phone send OTP error:", error);

      if (error.message?.includes("already been rendered")) {
        window.location.reload();
        return;
      }

      let errorMessage = "Failed to send OTP. Please try again.";

      if (
        error.code === "auth/invalid-phone-number" ||
        error.message?.includes("TOO_LONG") ||
        error.message?.includes("TOO_SHORT")
      ) {
        errorMessage = "Please enter a valid 10-digit mobile number.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    if (!confirmationResult) {
      toast.error("Session expired. Please request a new OTP.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success("Verified successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Invalid verification code. Please check and try again.");
      console.error("Phone confirm OTP error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to access your applications and dashboard.">
      <div id="recaptcha-container" />
      <div className="mt-5">
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mobile Number</Label>
              <Input
                required
                type="tel"
                placeholder="90000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
            {otpRemaining !== null && otpRemaining === 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <p className="font-semibold">Daily limit reached</p>
                <p className="text-xs mt-0.5 opacity-80">
                  You have used all 3 OTP attempts for today. Please try again after midnight.
                </p>
              </div>
            )}
            {cooldown > 0 && otpRemaining !== 0 && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-700">
                <p className="font-semibold">
                  Please wait {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  A 2-minute cooldown is required between OTP requests.
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting || otpRemaining === 0 || cooldown > 0}
              className="w-full bg-gradient-saffron text-primary font-semibold h-11"
            >
              {submitting
                ? "Sending..."
                : cooldown > 0
                  ? `Wait ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}`
                  : "Send OTP"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Max {MAX_OTP_PER_DAY} OTP requests per day · 2 min gap between each
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Enter OTP</Label>
              <Input
                required
                placeholder="6-digit code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={submitting}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
                Dear user, if you have installed Truecaller on your device, kindly check the spam
                folder for the OTP.
              </p>
              {otpRemaining !== null && (
                <p className="text-[11px] text-amber-600 font-medium">
                  {otpRemaining} OTP attempt{otpRemaining !== 1 ? "s" : ""} remaining today
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOtpSent(false)}
                disabled={submitting}
                className="flex-1 h-11"
              >
                Change Number
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-saffron text-primary font-semibold h-11"
              >
                {submitting ? "Verifying..." : "Verify & Login"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
