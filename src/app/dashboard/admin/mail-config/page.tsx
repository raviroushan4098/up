"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, app } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Save,
  RefreshCw,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function MailConfigPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [senderEmail, setSenderEmail] = useState("Uttar Pradesh Connect <onboarding@resend.dev>");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") {
      fetchMailConfig();
    }
  }, [authLoading, profile]);

  const fetchMailConfig = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "mailConfig"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.recipientEmail) {
          const list = data.recipientEmail
            .split(",")
            .map((e: string) => e.trim())
            .filter(Boolean);
          setRecipients(list.length > 0 ? list : [""]);
        }
        if (data.senderEmail) setSenderEmail(data.senderEmail);
      } else {
        // Fallback default placeholder
        setRecipients(["dherendrasingh112@gmail.com"]);
      }
    } catch (error) {
      console.error("Error fetching mail config:", error);
      toast.error("Failed to load email configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const addRecipient = () => {
    setRecipients([...recipients, ""]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    const updated = recipients.filter((_, i) => i !== index);
    setRecipients(updated);
  };

  const handleSave = async () => {
    const cleanRecipients = recipients.map((r) => r.trim()).filter(Boolean);
    if (cleanRecipients.length === 0) {
      toast.error("At least one recipient email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allValid = cleanRecipients.every((e) => emailRegex.test(e));
    if (!allValid) {
      toast.error("Please enter a valid email address for all fields.");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "settings", "mailConfig");
      await setDoc(docRef, {
        recipientEmail: cleanRecipients.join(","),
        senderEmail: senderEmail.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || "unknown",
      });
      toast.success("Email configuration updated successfully.");
    } catch (error) {
      console.error("Error saving mail config:", error);
      toast.error("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const cleanRecipients = recipients.map((r) => r.trim()).filter(Boolean);
    if (cleanRecipients.length === 0) {
      toast.error("Please configure and save a recipient email first.");
      return;
    }

    setTesting(true);
    try {
      const auth = getAuth(app);
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        toast.error("Session verification failed. Please re-login.");
        return;
      }

      const response = await fetch("/api/contact/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(
          `Test email dispatched successfully to ${cleanRecipients.join(", ")}! Check your inbox/spam folder.`,
        );
      } else {
        throw new Error(result.error || "Failed to dispatch test email.");
      }
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Test email sending failed. Check server logs.");
    } finally {
      setTesting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="p-6">
        <div>You do not have permission to view this page.</div>
      </div>
    );
  }

  const hasValidRecipients = recipients.map((r) => r.trim()).filter(Boolean).length > 0;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-semibold">Email Service Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure Resend API settings to receive public contact form submissions.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>

        {/* Configuration Forms */}
        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="size-5 text-[#C84B31]" />
                  Recipient & Sender Routing
                </CardTitle>
                <CardDescription>
                  Define the recipient email list to route incoming form submissions and manage the
                  verified sending address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipient Emails Array Inputs */}
                <div className="space-y-3">
                  <Label>Recipient Email Addresses</Label>
                  <div className="space-y-3 max-w-xl">
                    {recipients.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="admin@yourdomain.com"
                          value={email}
                          onChange={(e) => handleRecipientChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {recipients.length > 1 && (
                          <Button
                            variant="outline"
                            type="button"
                            size="icon"
                            onClick={() => removeRecipient(index)}
                            className="text-destructive border-border hover:bg-destructive/10 hover:text-destructive shrink-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipient}
                    className="mt-1"
                  >
                    <Plus className="size-4 mr-2" />
                    Add Recipient
                  </Button>
                  <p className="text-xs text-muted-foreground pt-1">
                    All inquiry forms submitted on the public contact page will be emailed to all
                    addresses listed here.
                  </p>
                </div>

                {/* Sender Email */}
                <div className="space-y-2 pt-4 border-t border-border/60">
                  <Label htmlFor="sender">Sender From Address</Label>
                  <Input
                    id="sender"
                    type="text"
                    placeholder="Uttar Pradesh Connect <onboarding@resend.dev>"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="max-w-xl"
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    Must be verified in your Resend account. Defaults to{" "}
                    <span className="font-semibold">
                      Uttar Pradesh Connect &lt;onboarding@resend.dev&gt;
                    </span>{" "}
                    for testing mode.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resend Integration Status & Diagnostics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  Service Health & Verification
                </CardTitle>
                <CardDescription>
                  Verify backend environment credentials and trigger system test deliveries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-50/50 p-4 text-sm text-yellow-800 flex gap-3">
                  <AlertTriangle className="size-5 shrink-0 text-yellow-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Environment Pre-requisite</p>
                    <p className="text-xs opacity-90 leading-relaxed">
                      Make sure your system environment variables include{" "}
                      <code className="font-mono bg-yellow-100/80 px-1 rounded">
                        RESEND_API_KEY
                      </code>{" "}
                      on your deployment server (.env file). This endpoint will fail if the server
                      key is missing.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/40">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm">Send Integration Test Email</h4>
                    <p className="text-xs text-muted-foreground">
                      Dispatches a diagnostic verification template to the recipient list configured
                      above.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={testing || !hasValidRecipients}
                    className="shrink-0"
                  >
                    {testing ? (
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="size-4 mr-2" />
                    )}
                    Run Send Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
