"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken } from "firebase/app-check";
import { auth, db, app, appCheck } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_OTP_PER_DAY = 3;

interface RateLimitResponse {
  allowed: boolean;
  remaining?: number;
  reason?: "cooldown" | "phone_limit" | "ip_limit" | "device_limit";
  waitSeconds?: number;
  message?: string;
}

const checkOtpRateLimitOnServer = async (
  phone: string,
  deviceId: string | null,
  fingerprint: string,
): Promise<RateLimitResponse> => {
  let appCheckToken = "";
  try {
    if (appCheck) {
      const tokenResult = await getToken(appCheck, false);
      appCheckToken = tokenResult.token;
    }
  } catch (e) {
    // App Check might not be initialized (e.g. in dev mode)
  }

  const res = await fetch("/api/otp-rate-limit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
    },
    body: JSON.stringify({ phone, deviceId, fingerprint }),
  });
  return res.json();
};

const getBrowserFingerprint = (): string => {
  if (typeof window === "undefined") return "";
  const parts = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    new Date().getTimezoneOffset(),
  ];
  return parts.join("|");
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

  // Generate and save persistent device_id on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      let devId = localStorage.getItem("device_id");
      if (!devId) {
        devId = window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("device_id", devId);
      }
    }
  }, []);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {
          // Fail silently
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
          // Fail silently
        }
      }
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      (window as any).recaptchaVerifier = recaptchaVerifier;
      return recaptchaVerifier;
    } catch (error: any) {
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

      // ── OTP Rate Limit Check (Server-side) ─────────────────────────
      const deviceId = typeof window !== "undefined" ? localStorage.getItem("device_id") : null;
      const fingerprint = getBrowserFingerprint();

      const rateLimit = await checkOtpRateLimitOnServer(formattedPhone, deviceId, fingerprint);

      if (!rateLimit.allowed) {
        if (rateLimit.reason === "cooldown" && rateLimit.waitSeconds) {
          setCooldown(rateLimit.waitSeconds);
          toast.error(
            rateLimit.message ||
              `Please wait ${rateLimit.waitSeconds}s before requesting another OTP.`,
          );
        } else if (rateLimit.reason === "phone_limit") {
          setOtpRemaining(0);
          toast.error(rateLimit.message || "Daily OTP limit reached for this phone number.", {
            duration: 5000,
          });
        } else {
          // IP limit or device limit
          toast.error(rateLimit.message || "Too many requests. Please try again tomorrow.", {
            duration: 5000,
          });
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

      if (rateLimit.remaining !== undefined) {
        setOtpRemaining(rateLimit.remaining);
      }

      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success(
        `OTP sent to ${formattedPhone} (${rateLimit.remaining !== undefined ? rateLimit.remaining : "some"} attempts remaining today)`,
      );
    } catch (error: any) {
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
