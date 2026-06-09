"use client";

import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Results() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">Results</h1>
        <p className="text-muted-foreground">Check merit lists and download your certificate.</p>
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-16 rounded-2xl bg-secondary flex items-center justify-center">
            <Clock className="size-8 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-xl text-primary">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The results module is currently under development. You will be notified when merit lists
            and certificates are available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
