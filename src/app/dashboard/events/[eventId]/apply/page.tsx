"use client";

import { useState, useEffect, use } from "react";
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
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { UPEvent } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, FileVideo, CheckCircle2, Upload, Loader2, ArrowLeft } from "lucide-react";
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

  // Form State
  const [schoolCollegeName, setSchoolCollegeName] = useState("");
  const [classCourse, setClassCourse] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvent();
    }
  }, [eventId, user]);

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
          if (!appSnap.empty) setHasApplied(true);
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
          Your citizen profile has been rejected by the administrator. You cannot apply for any
          events until you update your profile and it is successfully verified.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/profile">Go to Profile</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCollegeName || !classCourse || !selectedTopic || !videoFile || !declarationAgreed) {
      toast.error("Please fill all required fields and upload your video.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload Video
      const storage = getStorage(app);
      const ext = videoFile.name.split(".").pop();
      const videoRef = ref(storage, `applications/${eventId}/${user!.uid}_video.${ext}`);

      const uploadTask = uploadBytesResumable(videoRef, videoFile);

      const videoUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
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

      toast.success("Application submitted successfully!");
      router.push("/dashboard/applications");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during submission.");
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
          </CardContent>
        </Card>

        {/* SECTION 3: Event Specific (Topic) */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="border-b bg-secondary/50">
            <CardTitle className="text-lg">Topic Selection</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-1.5">
              <Label>Select Agenda/Topic *</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a topic..." />
                </SelectTrigger>
                <SelectContent>
                  {event.agendaTopics?.map((topic, i) => (
                    <SelectItem key={i} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Video Upload */}
        <Card className="border-0 shadow-elegant">
          <CardHeader className="border-b bg-secondary/50">
            <CardTitle className="text-lg">Video Submission</CardTitle>
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
                  <FileVideo className="size-10 text-success shrink-0" />
                  <span className="font-semibold text-sm text-primary truncate max-w-[200px] sm:max-w-[400px] w-full block">
                    {videoFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">Click to replace</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-10 text-muted-foreground" />
                  <span className="font-semibold text-sm text-primary">Upload your video</span>
                  <span className="text-xs text-muted-foreground">MP4, MOV, WEBM (Max 50MB)</span>
                </div>
              )}
            </label>
          </CardContent>
        </Card>

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
          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-primary">
                <span>Uploading Video...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
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
                {uploadProgress > 0 && uploadProgress < 100 ? "Uploading..." : "Processing..."}
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
