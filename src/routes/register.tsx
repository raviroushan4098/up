import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Register — Bhavishya UP" }] }),
});

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Create your account" subtitle="Free, secure and ready in 60 seconds.">
      <form
        onSubmit={(e) => { e.preventDefault(); toast.success("Account created. Welcome!"); navigate({ to: "/dashboard" }); }}
        className="space-y-4"
      >
        <div className="space-y-1.5"><Label>Full Name</Label><Input required placeholder="Aarav Sharma" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Mobile</Label><Input required type="tel" placeholder="+91" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input required type="email" placeholder="you@email.com" /></div>
        </div>
        <div className="space-y-1.5"><Label>Password</Label><Input required type="password" placeholder="At least 8 characters" /></div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground"><Checkbox required className="mt-0.5" /> <span>I agree to the Terms of Service and Privacy Policy of Government of UP.</span></label>
        <Button type="submit" className="w-full bg-gradient-saffron text-primary font-semibold h-11">Create Account</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-accent-glow">Login</Link></p>
    </AuthLayout>
  );
}
