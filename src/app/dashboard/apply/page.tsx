"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Upload, FileText, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { districts, events } from "@/data/mock";

const steps = ["Personal", "Contact", "Address", "Education", "Event", "Documents", "Preview"];

export default function ApplyForm() {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Record<string, string>>({});
  const router = useRouter();
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onUpload = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFiles((p) => ({ ...p, [key]: f.name }));
    toast.success(`${f.name} uploaded`);
  };

  const submit = () => {
    toast.success("Application submitted successfully!");
    router.push("/dashboard/applications");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">New Application</h1>
        <p className="text-muted-foreground text-sm">
          Complete all steps to submit your application.
        </p>
      </div>

      {/* Progress */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}
            </div>
            <div className="text-sm font-semibold text-primary">{steps[step]}</div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-4 hidden sm:flex items-center justify-between gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none min-w-0">
                <div
                  className={`size-7 rounded-full grid place-items-center text-[10px] font-bold shrink-0 ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-gradient-saffron text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-[11px] truncate ${i === step ? "font-semibold text-primary" : "text-muted-foreground"}`}
                >
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < step ? "bg-success" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name *">
                    <Input placeholder="Aarav Sharma" />
                  </Field>
                  <Field label="Father's Name *">
                    <Input placeholder="Rajesh Sharma" />
                  </Field>
                  <Field label="Mother's Name *">
                    <Input placeholder="Sunita Sharma" />
                  </Field>
                  <Field label="Gender *">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">Male</SelectItem>
                        <SelectItem value="f">Female</SelectItem>
                        <SelectItem value="o">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Date of Birth *">
                    <Input type="date" />
                  </Field>
                  <Field label="Aadhaar Number *">
                    <Input placeholder="XXXX-XXXX-XXXX" />
                  </Field>
                  <Field label="Category *">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["General", "OBC", "SC", "ST", "EWS"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              {step === 1 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Mobile Number *">
                    <Input type="tel" placeholder="+91" />
                  </Field>
                  <Field label="Alternate Mobile">
                    <Input type="tel" />
                  </Field>
                  <Field label="Email Address *">
                    <Input type="email" />
                  </Field>
                  <Field label="WhatsApp Number">
                    <Input type="tel" />
                  </Field>
                </div>
              )}
              {step === 2 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="State *">
                    <Input defaultValue="Uttar Pradesh" />
                  </Field>
                  <Field label="District *">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts
                          .filter((d) => d !== "All Districts")
                          .map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tehsil *">
                    <Input />
                  </Field>
                  <Field label="Village / City *">
                    <Input />
                  </Field>
                  <Field label="Full Address *" className="sm:col-span-2">
                    <Textarea rows={3} />
                  </Field>
                  <Field label="PIN Code *">
                    <Input placeholder="226001" />
                  </Field>
                </div>
              )}
              {step === 3 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Highest Qualification *">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Class 10", "Class 12", "Diploma", "Bachelor's", "Master's", "PhD"].map(
                          (c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="College / School Name *">
                    <Input />
                  </Field>
                  <Field label="University / Board *">
                    <Input />
                  </Field>
                  <Field label="Passing Year *">
                    <Input type="number" placeholder="2024" />
                  </Field>
                  <Field label="Percentage / CGPA *">
                    <Input placeholder="85% or 8.5" />
                  </Field>
                </div>
              )}
              {step === 4 && (
                <div className="grid gap-4">
                  <Field label="Event Name *">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Participation Category *">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Why do you want to participate? *">
                    <Textarea rows={4} placeholder="Share your motivation..." />
                  </Field>
                  <Field label="Notable achievements">
                    <Textarea rows={3} />
                  </Field>
                </div>
              )}
              {step === 5 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { k: "aadhaar", l: "Aadhaar Card (PDF/JPG)" },
                    { k: "photo", l: "Passport Photo" },
                    { k: "video", l: "Video Pitch (Max 50MB)" },
                    { k: "certs", l: "Certificates (optional)" },
                  ].map((u) => (
                    <label
                      key={u.k}
                      className="relative border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-accent hover:bg-accent/5 transition-base cursor-pointer"
                    >
                      <input type="file" className="sr-only" onChange={onUpload(u.k)} />
                      {files[u.k] ? (
                        <div className="space-y-2">
                          <FileText className="size-8 text-success mx-auto" />
                          <div className="text-sm font-semibold text-primary truncate">
                            {files[u.k]}
                          </div>
                          <Badge
                            className="bg-success/15 text-success border-success/30"
                            variant="outline"
                          >
                            Uploaded
                          </Badge>
                        </div>
                      ) : (
                        <>
                          <Upload className="size-8 text-muted-foreground mx-auto" />
                          <div className="font-semibold text-primary mt-2">{u.l}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Click or drag & drop
                          </div>
                        </>
                      )}
                    </label>
                  ))}
                </div>
              )}
              {step === 6 && (
                <div>
                  <h3 className="font-display font-bold text-primary mb-1">
                    Review your application
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Please verify all details before submitting.
                  </p>
                  <div className="rounded-2xl bg-secondary p-5 space-y-2 text-sm">
                    {steps.slice(0, 6).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <span className="text-muted-foreground">{s} Details</span>
                        <Badge
                          className="bg-success/15 text-success border-success/30"
                          variant="outline"
                        >
                          <Check className="size-3 mr-1" /> Complete
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-start gap-2 mt-5 text-sm text-muted-foreground">
                    <input type="checkbox" required className="mt-1" />
                    <span>
                      I declare that the information provided is true and accept the terms.
                    </span>
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => toast.success("Draft saved")}>
              <Save className="size-4 mr-1.5" /> Save Draft
            </Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={back} disabled={step === 0}>
                <ChevronLeft className="size-4 mr-1" /> Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={next} className="bg-gradient-saffron text-primary font-semibold">
                  Continue <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={submit} className="bg-gradient-saffron text-primary font-semibold">
                  <Check className="size-4 mr-1.5" /> Submit Application
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
