import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { notifications } from "@/data/mock";

export const Route = createFileRoute("/dashboard/notifications")({ component: Notifications });

function Notifications() {
  return (
    <div className="space-y-6">
      <div><h1 className="font-display font-bold text-2xl text-primary">Notifications</h1><p className="text-muted-foreground">All updates from the portal.</p></div>
      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className="border-0 shadow-card">
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${n.type === "success" ? "bg-success/15 text-success" : n.type === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary"}`}><Bell className="size-4" /></div>
              <div className="flex-1"><div className="flex items-center justify-between gap-3"><h3 className="font-display font-bold text-primary">{n.title}</h3><span className="text-xs text-muted-foreground">{n.time}</span></div><p className="text-sm text-muted-foreground mt-1">{n.desc}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
