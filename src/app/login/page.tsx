"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Phone Auth State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Email / Password Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    } catch (error) {
      console.error("Recaptcha initialization error:", error);
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
      toast.error(error.message || "Failed to send OTP");
      console.error("Phone send OTP error:", error);
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      toast.success("Logged in successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
      console.error("Password login error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Google Sign-In failed");
      console.error("Google login error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to access your applications and dashboard.">
      <div id="recaptcha-container" />
      <Tabs defaultValue="otp">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="otp">
            <Phone className="size-3.5 mr-1.5" /> Mobile OTP
          </TabsTrigger>
          <TabsTrigger value="password">
            <KeyRound className="size-3.5 mr-1.5" /> Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="otp" className="mt-5">
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
        </TabsContent>

        <TabsContent value="password" className="mt-5">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                required
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-saffron text-primary font-semibold h-11"
            >
              {submitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 h-11 border-primary/20 hover:bg-primary/5"
      >
        <svg className="size-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-6">
        New to Bhavishya UP?{" "}
        <Link href="/register" className="text-primary font-semibold hover:text-accent-glow">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
