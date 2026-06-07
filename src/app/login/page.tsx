"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Phone Auth State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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
      const verifier = setupRecaptcha();
      if (!verifier) {
        setSubmitting(false);
        return;
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success("OTP sent successfully to " + formattedPhone);
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
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-saffron text-primary font-semibold h-11"
            >
              {submitting ? "Sending..." : "Send OTP"}
            </Button>
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
