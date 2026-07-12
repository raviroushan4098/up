"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInWithCustomToken } from "firebase/auth";
import { getToken } from "firebase/app-check";
import { auth, appCheck } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MAX_OTP_PER_DAY = 3;

interface RateLimitResponse {
  allowed: boolean;
  remaining?: number;
  reason?: "cooldown" | "email_limit" | "ip_limit" | "device_limit";
  waitSeconds?: number;
  message?: string;
  error?: string;
}

const sendOtpRequestOnServer = async (
  email: string,
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

  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
    },
    body: JSON.stringify({ email, deviceId, fingerprint }),
  });
  return res.json();
};

const verifyOtpRequestOnServer = async (
  email: string,
  otp: string,
): Promise<{ success: boolean; customToken?: string; error?: string }> => {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
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
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  // Email Auth State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpRemaining, setOtpRemaining] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining in cooldown

  // Forgot Email Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Resolve redirect parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get("redirectTo");
      if (redirectParam) {
        setRedirectTo(redirectParam);
      }
    }
  }, []);

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
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Display toast if redirected from deleted session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "deleted") {
        toast.error(
          "Your account has been fully deleted. Please contact support if you need assistance.",
        );
        // Clear query param
        router.replace("/login");
      }
    }
  }, [router]);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const deviceId = typeof window !== "undefined" ? localStorage.getItem("device_id") : null;
      const fingerprint = getBrowserFingerprint();

      const rateLimit = await sendOtpRequestOnServer(email, deviceId, fingerprint);

      if (!rateLimit.allowed) {
        if (rateLimit.reason === "cooldown" && rateLimit.waitSeconds) {
          setCooldown(rateLimit.waitSeconds);
          toast.error(
            rateLimit.message ||
              `Please wait ${rateLimit.waitSeconds}s before requesting another OTP.`,
          );
        } else if (rateLimit.reason === "email_limit") {
          setOtpRemaining(0);
          toast.error(rateLimit.message || "Daily OTP limit reached for this email address.", {
            duration: 5000,
          });
        } else {
          // IP limit, device limit, or App Check validation failure
          toast.error(
            rateLimit.error || rateLimit.message || "Too many requests. Please try again tomorrow.",
            {
              duration: 5000,
            },
          );
        }
        setSubmitting(false);
        return;
      }

      if (rateLimit.remaining !== undefined) {
        setOtpRemaining(rateLimit.remaining);
      }

      setOtpSent(true);
      toast.success(
        `Verification OTP sent to ${email} (${rateLimit.remaining !== undefined ? rateLimit.remaining : "some"} attempts remaining today)`,
      );
    } catch (error: any) {
      toast.error("Failed to send OTP. Please check your internet connection.");
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
    setSubmitting(true);
    try {
      const res = await verifyOtpRequestOnServer(email, otp);
      if (res.success && res.customToken) {
        await signInWithCustomToken(auth, res.customToken);
        toast.success("Verified successfully!");
        router.push(redirectTo);
      } else {
        toast.error(res.error || "Invalid verification code. Please check and try again.");
      }
    } catch (error: any) {
      toast.error("An error occurred during verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to access your applications and dashboard.">
      <div className="mt-5">
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label>Email Address</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-medium text-accent hover:underline focus:outline-none"
                >
                  Forgot email?
                </button>
              </div>
              <Input
                required
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  : "Send Verification Code"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Max {MAX_OTP_PER_DAY} OTP requests per day · 2 min gap between each
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Enter Verification OTP</Label>
              <Input
                required
                placeholder="6-digit code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={submitting}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
                Dear user, please check your email inbox and spam folder for the login OTP code.
              </p>
              {otpRemaining !== null && (
                <p className="text-[11px] text-amber-600 font-medium">
                  {otpRemaining} OTP request{otpRemaining !== 1 ? "s" : ""} remaining today
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
                Change Email
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

      {/* Forgot Email Admin Contact Modal */}
      <AlertDialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <AlertDialogContent className="max-w-md rounded-2xl border-primary/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg text-primary font-bold">
              Forgot Email Address?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
              To retrieve your registered email address, please contact administration support at:
              <span className="block font-bold text-lg text-accent mt-2 font-mono tracking-wider">
                6386751603
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction asChild>
              <Button
                onClick={() => setShowForgotModal(false)}
                className="bg-gradient-saffron text-primary font-semibold w-full sm:w-auto"
              >
                OK
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthLayout>
  );
}
