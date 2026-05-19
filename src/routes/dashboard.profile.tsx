import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/profile")({ component: Profile });

function Profile() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="font-display font-bold text-2xl text-primary">Profile</h1><p className="text-muted-foreground">Keep your information up to date.</p></div>
      <Card className="border-0 shadow-card">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6"><div className="size-16 rounded-2xl bg-gradient-saffron grid place-items-center font-display font-extrabold text-primary text-xl">AS</div><div><div className="font-display font-bold text-primary">Aarav Sharma</div><div className="text-xs text-muted-foreground">Lucknow, UP · Joined May 2026</div></div></div>
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }} className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input defaultValue="Aarav Sharma" className="mt-1.5" /></div>
            <div><Label>Father's Name</Label><Input defaultValue="Rajesh Sharma" className="mt-1.5" /></div>
            <div><Label>Mobile</Label><Input defaultValue="+91 90000 00000" className="mt-1.5" /></div>
            <div><Label>Email</Label><Input defaultValue="aarav@email.com" className="mt-1.5" /></div>
            <div><Label>District</Label><Input defaultValue="Lucknow" className="mt-1.5" /></div>
            <div><Label>Aadhaar</Label><Input defaultValue="XXXX-XXXX-1234" className="mt-1.5" /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2"><Button variant="outline" type="button">Cancel</Button><Button type="submit" className="bg-gradient-saffron text-primary font-semibold">Save Changes</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
