import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { applications } from "@/data/mock";

export const Route = createFileRoute("/dashboard/applications")({ component: MyApps });

const statusStyle: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  "Under Review": "bg-warning/20 text-warning-foreground border-warning/30",
  Approved: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Selected: "bg-accent text-primary",
};

function MyApps() {
  return (
    <div className="space-y-6">
      <div><h1 className="font-display font-bold text-2xl text-primary">My Applications</h1><p className="text-muted-foreground">Track and manage your submissions.</p></div>
      <div className="grid gap-4">
        {applications.map((a) => (
          <Card key={a.id} className="border-0 shadow-card">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="size-12 rounded-2xl bg-gradient-saffron grid place-items-center shrink-0"><FileText className="size-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[10px]">{a.id}</Badge><Badge className={statusStyle[a.status]} variant="outline">{a.status}</Badge></div>
                <h3 className="font-display font-bold text-primary truncate">{a.event}</h3>
                <p className="text-xs text-muted-foreground mt-1">Submitted on {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"><Eye className="size-3.5 mr-1.5" /> View</Button>
                <Button size="sm" variant="outline"><Download className="size-3.5 mr-1.5" /> Receipt</Button>
              </div>
            </CardContent>
            {/* Timeline */}
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <div className="flex items-center gap-2">
                {["Submitted", "Under Review", "Verified", "Decision"].map((s, i) => {
                  const idx = a.status === "Approved" || a.status === "Selected" ? 4 : a.status === "Under Review" ? 2 : a.status === "Rejected" ? 4 : 1;
                  const done = i < idx;
                  return (
                    <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                      <div className={`size-7 rounded-full grid place-items-center text-[10px] font-bold shrink-0 ${done ? "bg-gradient-saffron text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                      <span className={`text-xs ${done ? "text-primary font-semibold" : "text-muted-foreground"} hidden sm:inline`}>{s}</span>
                      {i < 3 && <div className={`flex-1 h-0.5 ${done ? "bg-accent" : "bg-muted"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
