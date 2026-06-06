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
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { UPEvent } from "@/types/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarSearch, Plus, List, Loader2, Image as ImageIcon } from "lucide-react";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [videoGuidelines, setVideoGuidelines] = useState("");
  const [rules, setRules] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [venue, setVenue] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [agendaTopics, setAgendaTopics] = useState("");
  const [customDeclaration, setCustomDeclaration] = useState("");

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
    setDeadline(ev.deadline);
    setVideoGuidelines(ev.videoGuidelines || "");
    setRules(ev.rules || "");
    setDressCode(ev.dressCode || "");
    setVenue(ev.venue || "");
    setContactInfo(ev.contactInfo || "");
    setAgendaTopics(ev.agendaTopics?.join(", ") || "");
    setCustomDeclaration(ev.customDeclaration || "");
    setBannerFile(null);
    setActiveTab("create");
  };

  const resetForm = () => {
    setEditEventId(null);
    setBannerFile(null);
    setTitle("");
    setDescription("");
    setDeadline("");
    setVideoGuidelines("");
    setRules("");
    setDressCode("");
    setVenue("");
    setContactInfo("");
    setAgendaTopics("");
    setCustomDeclaration("");
    setActiveTab("list");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) {
      toast.error("Title, Description, and Deadline are required");
      return;
    }

    setSubmitting(true);
    try {
      const topicsArray = agendaTopics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const eventData: any = {
        title,
        description,
        deadline,
        videoGuidelines,
        rules,
        dressCode,
        venue,
        contactInfo,
        agendaTopics: topicsArray,
        customDeclaration,
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
                  <label className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/5 transition-base">
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
                        {bannerFile.name} (Click to change)
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="size-6" />
                        <span className="text-sm">Click to upload banner image</span>
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

                <div className="space-y-1.5">
                  <Label>Deadline Date *</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Venue & Reporting Time</Label>
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. RMLNLU, Lucknow @ 8:00 AM"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Video Guidelines</Label>
                  <Textarea
                    value={videoGuidelines}
                    onChange={(e) => setVideoGuidelines(e.target.value)}
                    rows={3}
                    placeholder="Guidelines for the video submission..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Rules & Regulations</Label>
                  <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} />
                </div>

                <div className="space-y-1.5">
                  <Label>Dress Code</Label>
                  <Input
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    placeholder="e.g. Formal Attire"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Contact Info</Label>
                  <Input
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. Rudransh (1234567890)"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Agenda Topics (Comma separated)</Label>
                  <Input
                    value={agendaTopics}
                    onChange={(e) => setAgendaTopics(e.target.value)}
                    placeholder="Topic 1, Topic 2, Topic 3"
                  />
                  <p className="text-xs text-muted-foreground">
                    These will appear in the dropdown for applicants.
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
