"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  runTransaction,
  query,
  where,
  getDocs,
  setDoc,
  increment,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { sendApplicationSubmittedEmail } from "@/actions/email";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { UPEvent } from "@/types/events";
import { isDeadlinePassed as checkDeadlinePassed } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  FileVideo,
  CheckCircle2,
  Upload,
  Loader2,
  ArrowLeft,
  WifiOff,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ApplyEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const [event, setEvent] = useState<UPEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasApplied, setHasApplied] = useState(false);

  const { isSlowConnection } = useNetworkStatus();

  // Telemetry state
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [uploadETA, setUploadETA] = useState("");
  const [uploadedSize, setUploadedSize] = useState("");
  const [totalSize, setTotalSize] = useState("");

  // Form State
  const [schoolCollegeName, setSchoolCollegeName] = useState("");
  const [classCourse, setClassCourse] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [experienceDetails, setExperienceDetails] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Check if deadline is passed
  const isDeadlinePassed = useMemo(() => {
    if (!event?.deadline) return false;
    return checkDeadlinePassed(event.deadline);
  }, [event]);

  // Read dynamic form config
  const formConfig = event?.formConfig || {
    requireEducation: true,
    requireTopic: true,
    requireVideo: true,
  };

  useEffect(() => {
    if (user) {
      fetchEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user]);

  // Load draft from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && eventId) {
      const draft = localStorage.getItem(`draft_application_${eventId}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.schoolCollegeName) setSchoolCollegeName(parsed.schoolCollegeName);
          if (parsed.classCourse) setClassCourse(parsed.classCourse);
          if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
          if (parsed.experienceDetails) setExperienceDetails(parsed.experienceDetails);
          if (parsed.selectedTopic) setSelectedTopic(parsed.selectedTopic);
          if (typeof parsed.declarationAgreed === "boolean")
            setDeclarationAgreed(parsed.declarationAgreed);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [eventId]);

  // Save draft to local storage on change
  useEffect(() => {
    if (typeof window !== "undefined" && eventId) {
      const draft = {
        schoolCollegeName,
        classCourse,
        experienceLevel,
        experienceDetails,
        selectedTopic,
        declarationAgreed,
      };
      localStorage.setItem(`draft_application_${eventId}`, JSON.stringify(draft));
    }
  }, [
    schoolCollegeName,
    classCourse,
    experienceLevel,
    experienceDetails,
    selectedTopic,
    declarationAgreed,
    eventId,
  ]);

  const fetchEvent = async () => {
    try {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() } as UPEvent);

        if (user) {
          const appQ = query(
            collection(db, "applications"),
            where("eventId", "==", eventId),
            where("userId", "==", user.uid),
          );
          const appSnap = await getDocs(appQ);
          const hasActiveApp = appSnap.docs.some((d) => d.data().status !== "rejected");
          if (hasActiveApp) setHasApplied(true);
        }
      } else {
        router.push("/dashboard/events");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch event details");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || !profile) return null;

  // Gatekeeper logic - Already Applied
  if (hasApplied) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center py-12">
        <div className="size-20 bg-success/10 text-success rounded-full grid place-items-center mx-auto">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="font-display font-bold text-2xl text-primary">Already Registered</h1>
        <p className="text-muted-foreground">
          You have already successfully submitted an application for this event. You cannot apply
          multiple times.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/applications">View My Applications</Link>
        </Button>
      </div>
    );
  }

  // Gatekeeper logic - Rejected profile
  if (profile.verificationStatus === "rejected") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center py-12">
        <div className="size-20 bg-destructive/10 text-destructive rounded-full grid place-items-center mx-auto">
          <ShieldAlert className="size-10" />
        </div>
        <h1 className="font-display font-bold text-2xl text-primary">Application Blocked</h1>
        <p className="text-muted-foreground">
          Your user profile has been rejected by the administrator. You cannot apply for any events
          until you update your profile and it is successfully verified.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/profile">Go to Profile</Link>
        </Button>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto">
        <div className="size-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="size-10" />
        </div>
        <h1 className="font-display font-bold text-2xl text-primary">Deadline Passed</h1>
        <p className="text-muted-foreground">
          The application deadline for this event has passed. You can no longer apply.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEducationValid =
      !formConfig.requireEducation || (schoolCollegeName && classCourse && experienceLevel !== "");
    const isExperienceDetailsValid =
      experienceLevel !== "experienced" || experienceDetails.trim().length > 0;
    const isTopicValid = !formConfig.requireTopic || selectedTopic;
    const isVideoValid = !formConfig.requireVideo || videoFile;

    if (
      !isEducationValid ||
      !isExperienceDetailsValid ||
      !isTopicValid ||
      !isVideoValid ||
      !declarationAgreed
    ) {
      toast.error("Please fill all required fields and upload your video.");
      return;
    }

    setSubmitting(true);
    try {
      let videoUrl = "";

      // 1. Upload Video if required and provided
      if (formConfig.requireVideo && videoFile) {
        const storage = getStorage(app);
        const ext = videoFile.name.split(".").pop();
        const videoRef = ref(storage, `applications/${eventId}/${user!.uid}_video.${ext}`);

        // format bytes helper
        const formatBytes = (bytes: number) => {
          if (bytes === 0) return "0 B";
          const k = 1024;
          const sizes = ["B", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

        const uploadTask = uploadBytesResumable(videoRef, videoFile);

        let lastBytes = 0;
        let lastTime = Date.now();

        videoUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              setUploadedSize(formatBytes(snapshot.bytesTransferred));
              setTotalSize(formatBytes(snapshot.totalBytes));

              const now = Date.now();
              const timeDiff = (now - lastTime) / 1000; // in seconds

              if (timeDiff > 0.5) {
                // update every 500ms to avoid jitter
                const bytesDiff = snapshot.bytesTransferred - lastBytes;
                const speedBps = bytesDiff / timeDiff;
                setUploadSpeed(formatBytes(speedBps) + "/s");

                if (speedBps > 0) {
                  const remainingBytes = snapshot.totalBytes - snapshot.bytesTransferred;
                  const etaSeconds = remainingBytes / speedBps;
                  if (etaSeconds < 60) {
                    setUploadETA(`${Math.round(etaSeconds)} sec left`);
                  } else {
                    setUploadETA(`${Math.round(etaSeconds / 60)} min left`);
                  }
                }

                lastBytes = snapshot.bytesTransferred;
                lastTime = now;
              }
            },
            (error) => {
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            },
          );
        });
      } else {
        // Automatically skip if video is not required
        setUploadProgress(100);
      }

      // 2. Generate unique application ID (BUP00012)
      const counterRef = doc(db, "counters", "applications");
      const applicationNo = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let newCount = 1;
        if (counterDoc.exists()) {
          newCount = counterDoc.data().count + 1;
        }
        transaction.set(counterRef, { count: newCount }, { merge: true });

        // Format as BUP00012 (pad to 5 zeros, expands dynamically if larger)
        const paddedCount = newCount.toString().padStart(5, "0");
        return `BUP${paddedCount}`;
      });

      // 3. Save Application
      const applicationData = {
        applicationNo,
        eventId,
        userId: user!.uid,
        status: "pending",
        schoolCollegeName,
        classCourse,
        experienceLevel,
        experienceDetails,
        selectedTopic,
        videoUrl,
        declarationAgreed,
        // Profile snapshots
        applicantName: profile.fullName,
        applicantEmail: profile.email,
        applicantPhone: profile.phoneNumber || "",
        applicantDistrict: profile.district || "",
        appliedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "applications"), applicationData);

      // Increment global application counter
      try {
        await setDoc(
          doc(db, "counters", "global"),
          {
            totalApplications: increment(1),
          },
          { merge: true },
        );
      } catch (e) {
        console.error("Failed to update global application counter", e);
      }

      // 4. Send Email Notification
      if (profile.email) {
        await sendApplicationSubmittedEmail(
          profile.email,
          profile.fullName,
          event.title,
          applicationNo,
        );
      }

      // Clear draft on successful submission
      if (typeof window !== "undefined") {
        localStorage.removeItem(`draft_application_${eventId}`);
      }

      toast.success("Application submitted successfully!");
      router.push("/dashboard/applications");
    } catch (error: any) {
      console.error(error);
      if (error.code === "storage/unknown") {
        toast.error(
          "Video upload failed due to a network interruption. Please check your connection and try again.",
        );
      } else if (error.code?.startsWith("storage/")) {
        toast.error(
          "Video upload failed. Please ensure your file is a valid video format and try again.",
        );
      } else if (
        error.message?.includes("Could not reach Cloud Firestore backend") ||
        error.message?.includes("Backend didn't respond")
      ) {
        toast.error(
          "Network disconnected. Could not reach the server. Please check your internet connection.",
        );
      } else {
        toast.error(error.message || "An error occurred during submission. Please try again.");
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/dashboard/events/${eventId}`}
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4 mr-1" /> Back to Event
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl text-primary">Apply for {event.title}</h1>
        <p className="text-muted-foreground text-sm">
          Please review and complete your application form.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Auto-filled Profile Data */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="border-b bg-secondary/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success" /> Personal Details (Auto-filled)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={profile.fullName} readOnly className="bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profile.email} readOnly className="bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <Label>Father's Name</Label>
              <Input value={profile.fatherName || ""} readOnly className="bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <Label>Mother's Name</Label>
              <Input value={profile.motherName || ""} readOnly className="bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input value={profile.district || ""} readOnly className="bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={profile.phoneNumber || ""} readOnly className="bg-secondary" />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Education Input */}
        {formConfig.requireEducation && (
          <Card className="border-0 shadow-elegant">
            <CardHeader className="border-b bg-secondary/50">
              <CardTitle className="text-lg">Educational Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>School/College Name *</Label>
                <Input
                  value={schoolCollegeName}
                  onChange={(e) => setSchoolCollegeName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Class/Course *</Label>
                <Input
                  value={classCourse}
                  onChange={(e) => setClassCourse(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Who are you? *</Label>
                <Select
                  value={experienceLevel}
                  onValueChange={setExperienceLevel}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {experienceLevel === "experienced" && (
                <div className="space-y-1.5 sm:col-span-2 mt-2">
                  <Label>Briefly describe your experience *</Label>
                  <Textarea
                    value={experienceDetails}
                    onChange={(e) => setExperienceDetails(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="Tell us about your relevant experience..."
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SECTION 3: Event Specific (Topic) */}
        {formConfig.requireTopic && (
          <Card className="border-0 shadow-elegant">
            <CardHeader className="border-b bg-secondary/50">
              <CardTitle className="text-lg">Topic Selection</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1.5">
                <Label>Select Agenda/Topic *</Label>
                <Select
                  value={selectedTopic}
                  onValueChange={setSelectedTopic}
                  disabled={submitting}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {event.agendaTopics?.map((topic: any, i) => {
                      const title = typeof topic === "string" ? topic : topic.title;
                      return (
                        <SelectItem key={i} value={title}>
                          {title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Show Topic Description if available */}
              {selectedTopic && (
                <div className="mt-4">
                  {(() => {
                    const topicObj = event.agendaTopics?.find(
                      (t: any) => (typeof t === "string" ? t : t.title) === selectedTopic,
                    );
                    if (topicObj && typeof topicObj !== "string" && topicObj.description) {
                      return (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-primary/80 leading-relaxed">
                          <strong className="font-semibold block mb-1 text-primary">
                            About this topic:
                          </strong>
                          {topicObj.description}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SECTION 4: Video Upload */}
        {formConfig.requireVideo && (
          <Card className="border-0 shadow-elegant">
            <CardHeader className="border-b bg-secondary/50">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-1">
                  Video Submission <span className="text-destructive">*</span>
                </div>
                {isSlowConnection && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <WifiOff className="size-3" /> Slow Connection
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <label className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/5 transition-base cursor-pointer flex flex-col items-center justify-center">
                <input
                  type="file"
                  className="sr-only"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVideoFile(e.target.files[0]);
                    }
                  }}
                  disabled={submitting}
                  required
                />
                {videoFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <UploadCloud className="size-6" />
                    </div>
                    <span className="font-medium text-primary break-all">{videoFile.name}</span>
                    <span className="text-xs text-muted-foreground">Click to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-14 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                      <UploadCloud className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Click to browse or drag and drop</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        MP4, MOV, WEBM. Keep file size reasonable. Ensure good lighting and clear
                        audio.
                      </p>
                    </div>
                  </div>
                )}
              </label>

              <div className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-lg mt-3 flex items-start gap-2">
                <ShieldAlert className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-amber-800">Important Note:</span> The
                  submitted video must be relevant to the chosen topic. Off-topic submissions will
                  be automatically rejected.
                </div>
              </div>

              {/* Upload Progress */}
              {submitting && uploadProgress > 0 && (
                <div className="mt-6 space-y-2 border rounded-xl p-4 bg-secondary/30">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin text-primary" /> Uploading Video...
                    </span>
                    <span className="text-primary">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden border">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {uploadedSize} / {totalSize}
                    </span>
                    <span className="flex items-center gap-3">
                      {uploadSpeed && <span>{uploadSpeed}</span>}
                      {uploadETA && <span>ETA: {uploadETA}</span>}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SECTION 5: Declaration */}
        <Card className="border-0 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="declaration"
                checked={declarationAgreed}
                onCheckedChange={(c) => setDeclarationAgreed(c as boolean)}
                disabled={submitting}
              />
              <div className="grid gap-1.5 leading-none -mt-1">
                <label
                  htmlFor="declaration"
                  className="text-sm font-medium leading-relaxed cursor-pointer"
                >
                  {event.customDeclaration ||
                    "I declare that the information provided is true and correct."}
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {submitting && (
            <div className="space-y-3 bg-secondary/30 p-4 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between text-sm font-medium text-primary items-center">
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  {uploadProgress < 100 ? "Uploading Video..." : "Processing Application..."}
                </span>
                <span className="font-bold text-primary">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                  <span>
                    {uploadSpeed} • {uploadETA}
                  </span>
                  <span>
                    {uploadedSize} / {totalSize}
                  </span>
                </div>
              )}
            </div>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-primary text-primary-foreground text-base"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />{" "}
                {uploadProgress < 100 ? "Uploading..." : "Processing..."}
              </span>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
