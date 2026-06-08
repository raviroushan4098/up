"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  setDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { UPEvent } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CalendarSearch, Plus, List, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";

export default function AdminEventsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<UPEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [videoGuidelines, setVideoGuidelines] = useState("");
  const [rules, setRules] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [venue, setVenue] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [agendaTopics, setAgendaTopics] = useState<{ title: string; description: string }[]>([]);
  const [eligibility, setEligibility] = useState("");
  const [benefits, setBenefits] = useState("");
  const [schedule, setSchedule] = useState<{ date: string; label: string }[]>([]);
  const [customDeclaration, setCustomDeclaration] = useState("");
  const [requireEducation, setRequireEducation] = useState(true);
  const [requireTopic, setRequireTopic] = useState(true);
  const [requireVideo, setRequireVideo] = useState(true);

  // Display Config State
  const [showDates, setShowDates] = useState(true);
  const [showVenue, setShowVenue] = useState(true);
  const [showDressCode, setShowDressCode] = useState(true);
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [showVideoGuidelines, setShowVideoGuidelines] = useState(true);
  const [showRules, setShowRules] = useState(true);
  const [showAgendaTopics, setShowAgendaTopics] = useState(true);
  const [showEligibility, setShowEligibility] = useState(true);
  const [showBenefits, setShowBenefits] = useState(true);
  const [showSchedule, setShowSchedule] = useState(true);

  useEffect(() => {
    if (!authLoading && profile?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (activeTab === "list") {
      fetchEvents();
    }
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: UPEvent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UPEvent[];
      setEvents(fetched);
    } catch (error) {
      toast.error("Failed to fetch events");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (ev: UPEvent) => {
    setEditEventId(ev.id);
    setTitle(ev.title);
    setDescription(ev.description);
    setDeadline(ev.deadline || "");
    setStartDate(ev.startDate || "");
    setEndDate(ev.endDate || "");
    setVideoGuidelines(ev.videoGuidelines || "");
    setRules(ev.rules || "");
    setDressCode(ev.dressCode || "");
    setVenue(ev.venue || "");
    setContactInfo(ev.contactInfo || "");
    setEligibility(ev.eligibility ? ev.eligibility.join("\n") : "");
    setBenefits(ev.benefits ? ev.benefits.join("\n") : "");
    setSchedule(ev.schedule || []);

    if (ev.agendaTopics) {
      if (typeof ev.agendaTopics[0] === "string") {
        setAgendaTopics(ev.agendaTopics.map((t: string) => ({ title: t, description: "" })));
      } else {
        setAgendaTopics(ev.agendaTopics);
      }
    } else {
      setAgendaTopics([]);
    }

    const conf = ev.formConfig || {
      requireEducation: true,
      requireTopic: true,
      requireVideo: true,
    };
    setRequireEducation(conf.requireEducation ?? true);
    setRequireTopic(conf.requireTopic ?? true);
    setRequireVideo(conf.requireVideo ?? true);

    const dConf = ev.displayConfig || {
      showDates: true,
      showVenue: true,
      showDressCode: true,
      showContactInfo: true,
      showVideoGuidelines: true,
      showRules: true,
      showAgendaTopics: true,
      showEligibility: true,
      showBenefits: true,
      showSchedule: true,
    };
    setShowDates(dConf.showDates ?? true);
    setShowVenue(dConf.showVenue ?? true);
    setShowDressCode(dConf.showDressCode ?? true);
    setShowContactInfo(dConf.showContactInfo ?? true);
    setShowVideoGuidelines(dConf.showVideoGuidelines ?? true);
    setShowRules(dConf.showRules ?? true);
    setShowAgendaTopics(dConf.showAgendaTopics ?? true);
    setShowEligibility(dConf.showEligibility ?? true);
    setShowBenefits(dConf.showBenefits ?? true);
    setShowSchedule(dConf.showSchedule ?? true);

    setCustomDeclaration(ev.customDeclaration || "");
    setBannerFile(null);
    setIsDragging(false);
    setActiveTab("create");
  };

  const resetForm = () => {
    setEditEventId(null);
    setBannerFile(null);
    setIsDragging(false);
    setTitle("");
    setDescription("");
    setDeadline("");
    setStartDate("");
    setEndDate("");
    setVideoGuidelines("");
    setRules("");
    setDressCode("");
    setVenue("");
    setContactInfo("");
    setEligibility("");
    setBenefits("");
    setSchedule([]);
    setAgendaTopics([]);
    setCustomDeclaration("");
    setRequireEducation(true);
    setRequireTopic(true);
    setRequireVideo(true);

    setShowDates(true);
    setShowVenue(true);
    setShowDressCode(true);
    setShowContactInfo(true);
    setShowVideoGuidelines(true);
    setShowRules(true);
    setShowAgendaTopics(true);
    setShowEligibility(true);
    setShowBenefits(true);
    setShowSchedule(true);

    setIsDragging(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) {
      toast.error("Title, Description, and Deadline are required");
      return;
    }

    setSubmitting(true);
    try {
      // Validate topics
      const validTopics = agendaTopics.filter((t) => t.title.trim().length > 0);

      const eventData: any = {
        title,
        description,
        deadline,
        startDate,
        endDate,
        videoGuidelines,
        rules,
        dressCode,
        venue,
        contactInfo,
        eligibility: eligibility
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: benefits
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        schedule: schedule.filter((s) => s.date.trim() || s.label.trim()),
        agendaTopics: validTopics,
        customDeclaration,
        formConfig: {
          requireEducation,
          requireTopic,
          requireVideo,
        },
        displayConfig: {
          showDates,
          showVenue,
          showDressCode,
          showContactInfo,
          showVideoGuidelines,
          showRules,
          showAgendaTopics,
          showEligibility,
          showBenefits,
          showSchedule,
        },
        status: "Open", // Default to open for now
      };

      let targetDocId = editEventId;

      if (editEventId) {
        await updateDoc(doc(db, "events", editEventId), eventData);
        toast.success("Event updated successfully!");
      } else {
        eventData.createdAt = new Date().toISOString();
        eventData.image = ""; // placeholder
        const docRef = await addDoc(collection(db, "events"), eventData);
        targetDocId = docRef.id;

        // Increment global event counter
        try {
          await setDoc(
            doc(db, "counters", "global"),
            {
              totalEvents: increment(1),
            },
            { merge: true },
          );
        } catch (e) {
          console.error("Failed to update global event counter", e);
        }

        toast.success("Event created successfully!");
      }

      // If banner uploaded
      if (bannerFile && targetDocId) {
        const storage = getStorage(app);
        const ext = bannerFile.name.split(".").pop();
        const bannerRef = ref(storage, `events/${targetDocId}/banner.${ext}`);
        const uploadResult = await uploadBytes(bannerRef, bannerFile);
        const bannerUrl = await getDownloadURL(uploadResult.ref);

        await updateDoc(doc(db, "events", targetDocId), {
          image: bannerUrl,
        });
      }

      resetForm();
    } catch (error) {
      toast.error(editEventId ? "Failed to update event" : "Failed to create event");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone."))
      return;

    try {
      await deleteDoc(doc(db, "events", eventId));
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete event");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setBannerFile(file);
      } else {
        toast.error("Please upload an image file");
      }
    }
  };

  if (authLoading || profile?.role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">Manage Events</h1>
          <p className="text-muted-foreground text-sm">Create and oversee platform events.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary p-1 rounded-xl">
          <Button
            variant={activeTab === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("list")}
            className="rounded-lg"
          >
            <List className="size-4 mr-2" /> List
          </Button>
          <Button
            variant={activeTab === "create" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              if (editEventId) resetForm(); // clear edit state if they click "Create New" while editing
              setActiveTab("create");
            }}
            className="rounded-lg"
          >
            <Plus className="size-4 mr-2" /> {editEventId ? "Edit Event" : "Create New"}
          </Button>
        </div>
      </div>

      {activeTab === "list" && (
        <Card className="border-0 shadow-elegant">
          <CardHeader>
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No events found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-primary">{event.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {event.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${event.status === "Open" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
                        >
                          {event.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(event)}
                          className="h-7 text-xs px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="h-7 text-xs px-2"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Due: {event.deadline}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "create" && (
        <Card className="border-0 shadow-elegant max-w-4xl">
          <CardHeader>
            <CardTitle>{editEventId ? "Edit Event" : "Create New Event"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Event Banner Image</Label>
                  <label
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-base ${isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-accent/5"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBannerFile(e.target.files[0]);
                        }
                      }}
                      disabled={submitting}
                    />
                    {bannerFile ? (
                      <span className="font-semibold text-sm text-primary">
                        {bannerFile.name} (Click or drag to change)
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon
                          className={`size-6 ${isDragging ? "text-primary animate-bounce" : ""}`}
                        />
                        <span className="text-sm">
                          {isDragging ? "Drop image here" : "Click or drag to upload banner image"}
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Event Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Application Deadline *</Label>
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Event Start Date</Label>
                    <Switch checked={showDates} onCheckedChange={setShowDates} />
                  </div>
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Event End Date</Label>
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Venue & Reporting Time</Label>
                    <Switch checked={showVenue} onCheckedChange={setShowVenue} />
                  </div>
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. RMLNLU, Lucknow @ 8:00 AM"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Video Guidelines</Label>
                    <Switch
                      checked={showVideoGuidelines}
                      onCheckedChange={setShowVideoGuidelines}
                    />
                  </div>
                  <Textarea
                    value={videoGuidelines}
                    onChange={(e) => setVideoGuidelines(e.target.value)}
                    rows={3}
                    placeholder="Guidelines for the video submission..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Rules & Regulations</Label>
                    <Switch checked={showRules} onCheckedChange={setShowRules} />
                  </div>
                  <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Eligibility (One item per line)</Label>
                    <Switch checked={showEligibility} onCheckedChange={setShowEligibility} />
                  </div>
                  <Textarea
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    rows={4}
                    placeholder="E.g. Must be a student in UP&#10;Must be between 18-25 years old"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Benefits of Participation (One item per line)</Label>
                    <Switch checked={showBenefits} onCheckedChange={setShowBenefits} />
                  </div>
                  <Textarea
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    rows={4}
                    placeholder="E.g. Certificate of Participation&#10;Mentorship from industry leaders"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Dress Code</Label>
                    <Switch checked={showDressCode} onCheckedChange={setShowDressCode} />
                  </div>
                  <Input
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    placeholder="e.g. Formal Attire"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Contact Info</Label>
                    <Switch checked={showContactInfo} onCheckedChange={setShowContactInfo} />
                  </div>
                  <Input
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. Rudransh (1234567890)"
                  />
                </div>

                <div className="space-y-4 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Label>Agenda Topics</Label>
                      <Switch checked={showAgendaTopics} onCheckedChange={setShowAgendaTopics} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAgendaTopics([...agendaTopics, { title: "", description: "" }])
                      }
                    >
                      <Plus className="size-4 mr-2" /> Add Topic
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {agendaTopics.map((topic, i) => (
                      <div
                        key={i}
                        className="flex gap-3 items-start border p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Topic Title (e.g., Youth Leadership)"
                            value={topic.title}
                            onChange={(e) => {
                              const newArr = [...agendaTopics];
                              newArr[i].title = e.target.value;
                              setAgendaTopics(newArr);
                            }}
                            required
                          />
                          <Textarea
                            placeholder="Topic Description"
                            value={topic.description}
                            onChange={(e) => {
                              const newArr = [...agendaTopics];
                              newArr[i].description = e.target.value;
                              setAgendaTopics(newArr);
                            }}
                            rows={2}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const newArr = [...agendaTopics];
                            newArr.splice(i, 1);
                            setAgendaTopics(newArr);
                          }}
                        >
                          X
                        </Button>
                      </div>
                    ))}
                    {agendaTopics.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No topics added.</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    These will appear in the dropdown for applicants. Both Title and Description are
                    required for each topic.
                  </p>
                </div>

                <div className="space-y-4 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Label>Event Schedule Timeline</Label>
                      <Switch checked={showSchedule} onCheckedChange={setShowSchedule} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSchedule([...schedule, { date: "", label: "" }])}
                    >
                      <Plus className="size-4 mr-2" /> Add Schedule Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {schedule.map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-3 items-start border p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex-1 grid sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Date/Time (e.g., 10 Oct, 9:00 AM)"
                            value={item.date}
                            onChange={(e) => {
                              const newArr = [...schedule];
                              newArr[i].date = e.target.value;
                              setSchedule(newArr);
                            }}
                          />
                          <Input
                            placeholder="Label (e.g., Opening Ceremony)"
                            value={item.label}
                            onChange={(e) => {
                              const newArr = [...schedule];
                              newArr[i].label = e.target.value;
                              setSchedule(newArr);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const newArr = [...schedule];
                            newArr.splice(i, 1);
                            setSchedule(newArr);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    {schedule.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        No schedule items added.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This displays a vertical timeline of the event on the public details page.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Custom Declaration Checklist Text</Label>
                  <Textarea
                    value={customDeclaration}
                    onChange={(e) => setCustomDeclaration(e.target.value)}
                    rows={2}
                    placeholder="I hereby declare that..."
                  />
                </div>

                <div className="sm:col-span-2 mt-6 p-5 border rounded-xl bg-primary/5 space-y-4">
                  <h3 className="font-semibold text-lg border-b border-primary/10 pb-2">
                    Student Application Form Requirements
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Toggle sections on/off for the student application form. Disabled sections will
                    be completely hidden from applicants.
                  </p>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm">
                    <div>
                      <Label className="text-base font-medium">Educational Details</Label>
                      <p className="text-xs text-muted-foreground">
                        Require applicants to provide school/college name and course details.
                      </p>
                    </div>
                    <Switch checked={requireEducation} onCheckedChange={setRequireEducation} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm">
                    <div>
                      <Label className="text-base font-medium">Agenda/Topic Selection</Label>
                      <p className="text-xs text-muted-foreground">
                        Require applicants to select a specific agenda topic.
                      </p>
                    </div>
                    <Switch checked={requireTopic} onCheckedChange={setRequireTopic} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm">
                    <div>
                      <Label className="text-base font-medium">Video Submission</Label>
                      <p className="text-xs text-muted-foreground">
                        Require applicants to upload a video entry.
                      </p>
                    </div>
                    <Switch checked={requireVideo} onCheckedChange={setRequireVideo} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground"
                >
                  {submitting ? "Saving..." : editEventId ? "Save Changes" : "Publish Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
