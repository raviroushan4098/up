import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — Bhavishya UP" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const go = (e: React.FormEvent) => { e.preventDefault(); toast.success("Logged in successfully"); navigate({ to: "/dashboard" }); };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to access your applications and dashboard.">
      <Tabs defaultValue="otp">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="otp"><Phone className="size-3.5 mr-1.5" /> OTP</TabsTrigger>
          <TabsTrigger value="email"><Mail className="size-3.5 mr-1.5" /> Email</TabsTrigger>
          <TabsTrigger value="password"><KeyRound className="size-3.5 mr-1.5" /> Password</TabsTrigger>
        </TabsList>

        <TabsContent value="otp" className="mt-5">
          <form onSubmit={go} className="space-y-4">
            <div className="space-y-1.5"><Label>Mobile Number</Label><Input required type="tel" placeholder="+91 90000 00000" /></div>
            {otpSent && <div className="space-y-1.5"><Label>Enter OTP</Label><Input required placeholder="6-digit code" maxLength={6} /></div>}
            {!otpSent ? (
              <Button type="button" onClick={() => { setOtpSent(true); toast.success("OTP sent to your mobile"); }} className="w-full bg-gradient-saffron text-primary font-semibold h-11">Send OTP</Button>
            ) : (
              <Button type="submit" className="w-full bg-gradient-saffron text-primary font-semibold h-11">Verify & Login</Button>
            )}
          </form>
        </TabsContent>

        <TabsContent value="email" className="mt-5">
          <form onSubmit={go} className="space-y-4">
            <div className="space-y-1.5"><Label>Email</Label><Input required type="email" placeholder="you@email.com" /></div>
            <Button type="submit" className="w-full bg-gradient-saffron text-primary font-semibold h-11">Send Login Link</Button>
          </form>
        </TabsContent>

        <TabsContent value="password" className="mt-5">
          <form onSubmit={go} className="space-y-4">
            <div className="space-y-1.5"><Label>Email or Mobile</Label><Input required placeholder="you@email.com" /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input required type="password" placeholder="••••••••" /></div>
            <div className="text-right text-sm"><Link to="/login" className="text-primary hover:text-accent-glow font-medium">Forgot password?</Link></div>
            <Button type="submit" className="w-full bg-gradient-saffron text-primary font-semibold h-11">Login</Button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground mt-6">New to Bhavishya UP? <Link to="/register" className="text-primary font-semibold hover:text-accent-glow">Create an account</Link></p>
    </AuthLayout>
  );
}
