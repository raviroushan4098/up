"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, setDoc, deleteField } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Upload,
  CheckCircle2,
  User,
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { fetchLocationFromPincode } from "@/lib/location";
import { formatInstagramHandle } from "@/lib/utils";
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
import { districts } from "@/data/districts";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Form fields pre-filled from profile
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [profession, setProfession] = useState("");
  const [pincode, setPincode] = useState("");
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [villageCity, setVillageCity] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [phone, setPhone] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [address, setAddress] = useState("");

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoName, setProfilePhotoName] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setFatherName(profile.fatherName || "");
      setMotherName(profile.motherName || "");
      setGender(profile.gender || "");
      setDob(profile.dob || "");
      setProfession(profile.profession || "");
      setPincode(profile.pincode || "");
      setStateName(profile.state || "");
      setDistrict(profile.district || "");
      setVillageCity(profile.villageCity || "");
      setPhone(profile.phoneNumber || "");
      setInstagramHandle(profile.instagramHandle || "");
      setAddress(profile.address || "");
      if (profile.profilePhotoUrl) setProfilePhoto(profile.profilePhotoUrl);
    }
  }, [profile]);

  // Auto-fetch location from Pincode
  useEffect(() => {
    if (pincode.length === 6) {
      const fetchLocation = async () => {
        setIsFetchingLocation(true);
        const location = await fetchLocationFromPincode(pincode);
        if (location) {
          setStateName(location.state);
          setDistrict(location.district);
          toast.success(`Location found: ${location.district}, ${location.state}`);
        } else {
          toast.error("Invalid pincode or location not found");
        }
        setIsFetchingLocation(false);
      };
      fetchLocation();
    }
  }, [pincode]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/png")) {
      toast.error("Please upload only JPG or PNG image formats");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Profile photo is too large (${formatFileSize(file.size)}). Maximum 2MB.`);
      return;
    }
    setProfilePhotoName(file.name);
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!fatherName.trim()) {
      toast.error("Father's Name is required");
      return;
    }
    if (!motherName.trim()) {
      toast.error("Mother's Name is required");
      return;
    }
    if (!gender) {
      toast.error("Gender is required");
      return;
    }
    if (!dob) {
      toast.error("Date of Birth is required");
      return;
    }
    if (!profession.trim()) {
      toast.error("Field of Study / Profession is required");
      return;
    }
    if (!stateName) {
      toast.error("State is required");
      return;
    }
    if (!district) {
      toast.error("District is required");
      return;
    }
    if (!villageCity.trim()) {
      toast.error("Village / City is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    if (!instagramHandle.trim()) {
      toast.error("Instagram handle is required");
      return;
    }

    setSubmitting(true);
    try {
      let finalProfilePhotoUrl = profile?.profilePhotoUrl || "";

      if (user) {
        const storage = getStorage(app);

        if (profilePhotoFile) {
          const ext = profilePhotoFile.name.split(".").pop();
          const photoRef = ref(storage, `users/${user.uid}/profile_photo.${ext}`);
          const result = await uploadBytes(photoRef, profilePhotoFile);
          finalProfilePhotoUrl = await getDownloadURL(result.ref);
        }

        const updatedProfile = {
          ...profile,
          fullName,
          fatherName,
          motherName: motherName.trim() || undefined,
          gender,
          dob,
          profession: profession.trim(),
          pincode,
          state: stateName,
          district,
          villageCity,
          phoneNumber: phone,
          instagramHandle: formatInstagramHandle(instagramHandle),
          address: address.trim() || undefined,
          profilePhotoUrl: finalProfilePhotoUrl,
          // Reset to pending on any profile update so admin re-reviews
          verificationStatus: "pending" as const,
          rejectionReason: deleteField(),
          verificationUpdatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
        await refreshProfile();
        toast.success("Profile updated! Re-submitted for admin verification.");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const status = profile?.verificationStatus ?? "pending";
  const isLocked = status === "verified";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">My Profile</h1>
        <p className="text-muted-foreground text-sm">
          {isLocked
            ? "Your profile is verified and locked. Contact admin to request changes."
            : "Update your details. Any changes will reset your verification status to pending."}
        </p>
      </div>

      {/* Verification Status Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {status === "verified" && (
          <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/25 rounded-xl">
            <div className="size-9 rounded-full bg-success/15 grid place-items-center shrink-0">
              <ShieldCheck className="size-5 text-success" />
            </div>
            <div>
              <p className="font-semibold text-success text-sm">Profile Verified ✅</p>
              <p className="text-xs text-success/80 mt-0.5">
                Your identity has been verified by the admin. Your profile is now
                <strong> locked</strong> — fields cannot be edited. Contact the admin if you need to
                make corrections.
              </p>
            </div>
          </div>
        )}
        {status === "pending" && (
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/25 rounded-xl">
            <div className="size-9 rounded-full bg-warning/15 grid place-items-center shrink-0">
              <Clock className="size-5 text-warning-foreground" />
            </div>
            <div>
              <p className="font-semibold text-warning-foreground text-sm">Under Admin Review</p>
              <p className="text-xs text-warning-foreground/80 mt-0.5">
                Your profile is awaiting verification. This typically takes 1–2 business days.
              </p>
            </div>
          </div>
        )}
        {status === "rejected" && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/25 rounded-xl">
            <div className="size-9 rounded-full bg-destructive/15 grid place-items-center shrink-0">
              <XCircle className="size-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive text-sm">Verification Rejected</p>
              {profile?.rejectionReason && (
                <div className="mt-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                    <AlertTriangle className="size-3" /> Reason from Admin:
                  </p>
                  <p className="text-xs text-destructive/90 leading-relaxed">
                    {profile.rejectionReason}
                  </p>
                </div>
              )}
              <p className="text-xs text-destructive/80 mt-2">
                Please fix the issues above and save your profile to resubmit for review.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-elegant overflow-hidden">
          <div className="h-1.5 bg-gradient-tricolor" />
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b">
              <div className="relative group">
                <div className="size-24 rounded-full border-4 border-background shadow-soft overflow-hidden bg-secondary flex items-center justify-center">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-10 text-muted-foreground" />
                  )}
                </div>
                {!isLocked && (
                  <label className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-primary-foreground shadow-soft grid place-items-center cursor-pointer hover:bg-primary-glow transition-base">
                    <Upload className="size-4" />
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png"
                      onChange={handleProfilePhotoChange}
                      disabled={submitting || isLocked}
                    />
                  </label>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-primary">Profile Photo</p>
                <p className="text-xs text-muted-foreground">JPG or PNG, max 2MB</p>
                {profilePhotoName && (
                  <Badge variant="secondary" className="mt-1 text-xs">
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={submitting || isLocked}
                    placeholder="As per ID proof"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatherName">Father's Name *</Label>
                  <Input
                    id="fatherName"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="motherName">Mother's Name *</Label>
                  <Input
                    id="motherName"
                    required
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={gender}
                    onValueChange={setGender}
                    disabled={submitting || isLocked}
                  >
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
                    type="text"
                    placeholder="DD/MM/YYYY"
                    required
                    value={dob}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.length > 8) val = val.slice(0, 8);

                      let formatted = val;
                      if (val.length > 2) {
                        formatted = val.slice(0, 2) + "/" + val.slice(2);
                      }
                      if (val.length > 4) {
                        formatted = formatted.slice(0, 5) + "/" + val.slice(4);
                      }
                      setDob(formatted);
                    }}
                    disabled={submitting || isLocked}
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Select your date of birth (DD/MM/YYYY)
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="profession">Field of Study / Profession *</Label>
                  <Input
                    id="profession"
                    required
                    placeholder="e.g. B.Tech Computer Science, Software Engineer, Student"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-display font-bold text-lg text-primary border-l-4 border-accent pl-2.5">
                Location & Address
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <div className="relative">
                    <Input
                      id="pincode"
                      required
                      maxLength={6}
                      placeholder="e.g. 226001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                      disabled={submitting || isLocked || isFetchingLocation}
                    />
                    {isFetchingLocation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stateName">State *</Label>
                  <Input
                    id="stateName"
                    required
                    placeholder="State"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    required
                    placeholder="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="villageCity">Village / City *</Label>
                  <Input
                    id="villageCity"
                    value={villageCity}
                    onChange={(e) => setVillageCity(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={submitting || isLocked}
                    placeholder="Complete permanent address"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-display font-bold text-lg text-primary border-l-4 border-accent pl-2.5">
                Contact
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting || isLocked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={profile?.email || ""}
                    readOnly
                    className="bg-secondary text-muted-foreground"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="instagramHandle">Instagram Handle *</Label>
                  <Input
                    id="instagramHandle"
                    required
                    placeholder="@username"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    onBlur={() => setInstagramHandle(formatInstagramHandle(instagramHandle))}
                    disabled={submitting || isLocked}
                  />
                </div>
              </div>
            </div>

            {/* Security + Submit */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-success" />
                <span>Encrypted under Indian IT Act 2000.</span>
              </div>
              {isLocked ? (
                <div className="w-full bg-secondary text-muted-foreground font-semibold min-h-12 flex items-center justify-center rounded-xl border border-border mt-2">
                  <ShieldCheck className="size-4 mr-2 text-success" />
                  Profile is verified and locked
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting || isLocked}
                  className="w-full bg-gradient-saffron text-primary font-bold min-h-12 h-auto py-3 px-4 shadow-glow hover:opacity-95 text-sm sm:text-base whitespace-normal leading-tight"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                      Saving &amp; Resubmitting...
                    </span>
                  ) : (
                    <span className="flex flex-col items-center sm:flex-row sm:gap-1">
                      <span>Save Changes</span>
                      <span className="opacity-80 text-xs sm:text-base sm:opacity-100">
                        &amp; Resubmit for Verification
                      </span>
                    </span>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
