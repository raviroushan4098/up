"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, setDoc } from "firebase/firestore";
import { Upload, FileText, CheckCircle2, User, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";
import { districts } from "@/data/mock";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [district, setDistrict] = useState("");
  const [villageCity, setVillageCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [address, setAddress] = useState("");

  // File upload states
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoName, setProfilePhotoName] = useState("");
  const [profilePhotoError, setProfilePhotoError] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<string | null>(null);
  const [aadhaarFileName, setAadhaarFileName] = useState("");
  const [aadhaarFileError, setAadhaarFileError] = useState("");

  // Helper to format bytes to human readable string
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Route guards
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (profile?.onboarded) {
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router]);

  // Pre-fill fields from authentication credentials
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setEmail(profile.email || "");
      if (profile.phoneNumber) {
        setPhone(profile.phoneNumber);
      } else if (user?.phoneNumber) {
        setPhone(user.phoneNumber);
      }
    }
  }, [profile, user]);

  // Calculate age automatically when Date of Birth changes
  useEffect(() => {
    if (!dob) {
      setAge("");
      return;
    }
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      setAge("");
      return;
    }
    const ageDiffMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    setAge(calculatedAge);
  }, [dob]);

  // Handle profile photo upload (Max 2MB, JPG/PNG)
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfilePhotoError("");

    if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/png")) {
      toast.error("Please upload only JPG or PNG image formats");
      setProfilePhotoError("Only JPG or PNG formats are supported.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      const sizeStr = formatFileSize(file.size);
      toast.error(`Profile photo is too large (${sizeStr}). Maximum size is 2.0 MB.`);
      setProfilePhotoError(
        `File size (${sizeStr}) exceeds the 2.0 MB limit. Please compress the image.`,
      );
      return;
    }

    setProfilePhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
      toast.success("Profile photo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  // Handle Aadhaar upload (Max 10MB, PDF/JPG/PNG)
  const handleAadhaarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAadhaarFileError("");

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload only PDF, JPG, or PNG formats");
      setAadhaarFileError("Only PDF, JPG, or PNG formats are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const sizeStr = formatFileSize(file.size);
      toast.error(`Aadhaar document is too large (${sizeStr}). Maximum size is 10.0 MB.`);
      setAadhaarFileError(
        `File size (${sizeStr}) exceeds the 10.0 MB limit. Please compress or choose a smaller file.`,
      );
      return;
    }

    setAadhaarFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAadhaarFile(reader.result as string);
      toast.success("Aadhaar document uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  // Mask and format Aadhaar Input: XXXX-XXXX-XXXX
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 12) return;

    // Group by 4 digits
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += "-";
      }
      formatted += val[i];
    }
    setAadhaar(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profilePhoto) {
      toast.error("Profile photo is required");
      setProfilePhotoError("Profile photo is required");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!fatherName.trim()) {
      toast.error("Father's Name is required");
      return;
    }
    if (!gender) {
      toast.error("Gender selection is required");
      return;
    }
    if (!dob) {
      toast.error("Date of Birth is required");
      return;
    }
    if (!district) {
      toast.error("District selection is required");
      return;
    }
    if (!villageCity.trim()) {
      toast.error("Village / City is required");
      return;
    }
    if (!phone) {
      toast.error("Mobile Number is required");
      return;
    }
    if (aadhaar.replace(/-/g, "").length !== 12) {
      toast.error("Aadhaar number must be exactly 12 digits");
      return;
    }
    if (!aadhaarFile) {
      toast.error("Aadhaar card copy is required");
      setAadhaarFileError("Aadhaar card copy is required");
      return;
    }

    setSubmitting(true);
    try {
      const updatedProfile = {
        ...profile,
        fullName,
        fatherName,
        motherName: motherName.trim() || undefined,
        gender,
        dob,
        age: Number(age),
        district,
        villageCity,
        phoneNumber: phone,
        email: email.trim() || undefined,
        aadhaarNumber: aadhaar,
        address: address.trim() || undefined,
        profilePhotoUrl: profilePhoto,
        aadhaarUploadUrl: aadhaarFile,
        onboarded: true,
      };

      if (user) {
        await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
        await refreshProfile();
        toast.success("Profile onboarding completed successfully!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Onboarding submission error:", error);
      toast.error(error.message || "Failed to submit profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || profile?.onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground font-display text-sm">
            Loading onboarding verification...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl bg-gradient-saffron items-center justify-center shadow-glow mb-2">
            <Landmark className="size-7 text-primary" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primary">
            Citizen Profile Verification
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            नए उत्तर प्रदेश का नया भविष्य. Please complete your one-time registration profile to
            access schemes and scholarships.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-elegant overflow-hidden bg-card">
            <div className="h-2 bg-gradient-tricolor" />
            <CardContent className="p-6 sm:p-10 space-y-8">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center gap-4 pb-6 border-b">
                <div className="relative group">
                  <div
                    className={`size-28 rounded-full border-4 shadow-soft overflow-hidden bg-secondary flex items-center justify-center transition-base ${profilePhotoError ? "border-destructive" : "border-background"}`}
                  >
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User
                        className={`size-12 ${profilePhotoError ? "text-destructive/70" : "text-muted-foreground"}`}
                      />
                    )}
                  </div>
                  <label
                    className={`absolute bottom-0 right-0 size-8 rounded-full text-primary-foreground shadow-soft grid place-items-center cursor-pointer transition-base ${profilePhotoError ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary-glow"}`}
                  >
                    <Upload className="size-4" />
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png"
                      onChange={handleProfilePhotoChange}
                      disabled={submitting}
                    />
                  </label>
                </div>
                <div className="text-center">
                  <Label
                    className={`font-bold ${profilePhotoError ? "text-destructive" : "text-primary"}`}
                  >
                    Profile Photo *
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG or PNG formats, Maximum size 2MB
                  </p>
                  {profilePhotoError && (
                    <p className="text-xs text-destructive font-medium mt-1.5 max-w-xs mx-auto">
                      {profilePhotoError}
                    </p>
                  )}
                  {profilePhotoName && !profilePhotoError && (
                    <Badge variant="secondary" className="mt-2">
                      {profilePhotoName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-primary border-l-4 border-accent pl-2.5">
                  Personal Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      required
                      placeholder="As per ID proof"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fatherName">Father’s Name *</Label>
                    <Input
                      id="fatherName"
                      required
                      placeholder="Government verification standard"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motherName">Mother’s Name</Label>
                    <Input
                      id="motherName"
                      placeholder="Optional field"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={gender} onValueChange={setGender} disabled={submitting}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="age">Age (Auto Calculated)</Label>
                    <Input
                      id="age"
                      readOnly
                      value={age}
                      placeholder="Fill Date of Birth"
                      className="bg-secondary"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-display font-bold text-lg text-primary border-l-4 border-accent pl-2.5">
                  Location & Address
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="district">District *</Label>
                    <Select value={district} onValueChange={setDistrict} disabled={submitting}>
                      <SelectTrigger id="district">
                        <SelectValue placeholder="Select District" />
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
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="villageCity">Village / City *</Label>
                    <Input
                      id="villageCity"
                      required
                      placeholder="Your location name"
                      value={villageCity}
                      onChange={(e) => setVillageCity(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      placeholder="Complete permanent address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-display font-bold text-lg text-primary border-l-4 border-accent pl-2.5">
                  Contact Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <Input
                      id="phone"
                      required
                      type="tel"
                      placeholder="+91"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={submitting || (profile?.phoneNumber ? true : false)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting || (profile?.email ? true : false)}
                    />
                  </div>
                </div>
              </div>

              {/* Identification Documents */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-display font-bold text-lg text-primary border-l-4 border-accent pl-2.5">
                  Government Verification
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 items-start">
                  <div className="space-y-1.5">
                    <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                    <Input
                      id="aadhaar"
                      required
                      placeholder="XXXX-XXXX-XXXX"
                      value={aadhaar}
                      onChange={handleAadhaarChange}
                      disabled={submitting}
                      className="font-mono text-base tracking-wider"
                    />
                  </div>
                  <div className="space-y-1.5 w-full">
                    <label
                      className={`relative border-2 border-dashed rounded-xl p-5 text-center hover:bg-accent/5 transition-base cursor-pointer flex flex-col items-center justify-center min-h-[96px] w-full ${aadhaarFileError ? "border-destructive bg-destructive/5 hover:border-destructive" : "border-border hover:border-accent"}`}
                    >
                      <input
                        type="file"
                        className="sr-only"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={handleAadhaarFileChange}
                        disabled={submitting}
                      />
                      {aadhaarFile ? (
                        <div className="flex items-center gap-2 text-sm text-success font-semibold">
                          <CheckCircle2 className="size-5 shrink-0" />
                          <span className="truncate max-w-[180px]">{aadhaarFileName}</span>
                        </div>
                      ) : (
                        <>
                          <Upload
                            className={`size-5 mb-1 ${aadhaarFileError ? "text-destructive" : "text-muted-foreground"}`}
                          />
                          <span
                            className={`text-xs font-semibold ${aadhaarFileError ? "text-destructive" : "text-primary"}`}
                          >
                            Upload Aadhaar Copy *
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            PDF or Image, Max 10MB
                          </span>
                        </>
                      )}
                    </label>
                    {aadhaarFileError && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        {aadhaarFileError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="pt-6 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
                <ShieldCheck className="size-4 text-success" />
                <span>
                  Encrypted under Indian IT Act 2000. Your information will only be used for scheme
                  approvals.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-saffron text-primary font-bold h-12 shadow-glow hover:opacity-95 text-base transition-base"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Submitting Verification...
                    </span>
                  ) : (
                    "Submit Verification"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
