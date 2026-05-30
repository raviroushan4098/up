"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { UPEvent } from "@/types/events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Phone,
  Users,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  PlaySquare,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EventDetailsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const { user } = useAuth();
  const [event, setEvent] = useState<UPEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

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
      router.push("/dashboard/events");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4 mr-1" /> Back to Events
      </Link>

      <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] bg-secondary rounded-2xl overflow-hidden flex items-center justify-center">
        {event.image ? (
          <img src={event.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-saffron opacity-20"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10">
          <Badge className="w-fit mb-3 bg-success/20 text-green-300 border-success/30 backdrop-blur-md">
            {event.status}
          </Badge>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-elegant">
            <CardContent className="p-6 sm:p-8 space-y-6 text-sm">
              <div>
                <h2 className="font-display font-bold text-xl text-primary mb-3">
                  About the Event
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              {event.videoGuidelines && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
                    <PlaySquare className="size-5 text-accent" /> Video Submission Guidelines
                  </h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.videoGuidelines}
                  </p>
                </div>
              )}

              {event.rules && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
                    <ShieldAlert className="size-5 text-destructive" /> Rules &amp; Regulations
                  </h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.rules}
                  </p>
                </div>
              )}

              {event.agendaTopics && event.agendaTopics.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
                    <Users className="size-5 text-success" /> Agenda Topics
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {event.agendaTopics.map((topic, idx) => (
                      <li key={idx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-elegant sticky top-20">
            <CardContent className="p-6 space-y-6">
              {hasApplied ? (
                <Button
                  asChild
                  className="w-full h-12 text-base font-bold text-success border-success/50 bg-success/10 hover:bg-success/20 shadow-glow"
                  variant="outline"
                >
                  <Link href={`/dashboard/applications`}>Already Registered</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full h-12 text-base font-bold bg-gradient-saffron text-primary shadow-glow hover:opacity-95"
                >
                  <Link href={`/dashboard/events/${event.id}/apply`}>Proceed to Apply</Link>
                </Button>
              )}

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary">Deadline</p>
                    <p className="text-muted-foreground">{event.deadline}</p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-primary">Venue</p>
                      <p className="text-muted-foreground">{event.venue}</p>
                    </div>
                  </div>
                )}

                {event.dressCode && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-primary">Dress Code</p>
                      <p className="text-muted-foreground">{event.dressCode}</p>
                    </div>
                  </div>
                )}

                {event.contactInfo && (
                  <div className="flex items-start gap-3">
                    <Phone className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-primary">Contact</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {event.contactInfo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
