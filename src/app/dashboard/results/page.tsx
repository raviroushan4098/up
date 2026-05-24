"use client";

import { Award, Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">Results</h1>
        <p className="text-muted-foreground">Check merit lists and download your certificate.</p>
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-5 sm:p-6">
          <h3 className="font-display font-bold text-primary mb-3">
            Check Result by Application ID
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="e.g. BUP-2026-00821" className="pl-9 h-11" />
            </div>
            <Button className="bg-gradient-saffron text-primary font-semibold h-11">
              Check Result
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-elegant overflow-hidden bg-gradient-hero text-primary-foreground">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="size-20 rounded-3xl bg-accent grid place-items-center shrink-0">
            <Award className="size-10 text-primary" />
          </div>
          <div className="flex-1">
            <Badge className="bg-accent text-primary mb-2">Selected</Badge>
            <h2 className="font-display font-extrabold text-2xl">
              Scholar UP Merit Scholarship 2025
            </h2>
            <p className="opacity-80 mt-1">
              Congratulations Aarav! You have been selected for the merit scholarship.
            </p>
          </div>
          <Button className="bg-accent text-primary font-semibold hover:bg-accent-glow">
            <Download className="size-4 mr-2" /> Certificate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
