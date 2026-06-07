"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LandingPageCMS } from "@/types/cms";
import { defaultLandingCMS } from "@/data/cms-defaults";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function CMSPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<LandingPageCMS>(defaultLandingCMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") {
      fetchCMS();
    }
  }, [authLoading, profile]);

  const fetchCMS = async () => {
    try {
      const docRef = doc(db, "settings", "landingPage");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData({ ...defaultLandingCMS, ...docSnap.data() } as LandingPageCMS);
      }
    } catch (error) {
      console.error("Error fetching CMS data:", error);
      toast.error("Failed to load CMS data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || profile.role !== "admin") return;
    setSaving(true);
    try {
      const docRef = doc(db, "settings", "landingPage");
      await setDoc(docRef, data);
      toast.success("Landing Page updated successfully!");
    } catch (error) {
      console.error("Error saving CMS data:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset all changes back to the default layout? This will discard unsaved changes.",
      )
    ) {
      setData(defaultLandingCMS);
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

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-semibold">Live Content Editor</h2>
            <p className="text-sm text-muted-foreground">
              Changes saved here will instantly reflect on the public landing page.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Publish Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-4 lg:grid-cols-7 h-auto">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="howItWorks">How It Works</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>

          {/* HERO SECTION */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>The main banner at the top of the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Badge Text</label>
                  <Input
                    value={data.hero.badgeText}
                    onChange={(e) =>
                      setData({ ...data, hero: { ...data.hero, badgeText: e.target.value } })
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Title Line 1</label>
                    <Input
                      value={data.hero.titleLine1}
                      onChange={(e) =>
                        setData({ ...data, hero: { ...data.hero, titleLine1: e.target.value } })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Title Gradient Text</label>
                    <Input
                      value={data.hero.titleGradient}
                      onChange={(e) =>
                        setData({ ...data, hero: { ...data.hero, titleGradient: e.target.value } })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Subtitle</label>
                  <Textarea
                    value={data.hero.subtitle}
                    onChange={(e) =>
                      setData({ ...data, hero: { ...data.hero, subtitle: e.target.value } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATS SECTION */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>The 4 large numbers displayed below the hero.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.stats.map((stat, i) => (
                  <div key={i} className="flex gap-4 items-end border p-4 rounded-lg">
                    <div className="grid gap-2 flex-1">
                      <label className="text-xs font-medium">Label</label>
                      <Input
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...data.stats];
                          newStats[i].label = e.target.value;
                          setData({ ...data, stats: newStats });
                        }}
                      />
                    </div>
                    <div className="grid gap-2 flex-1">
                      <label className="text-xs font-medium">Value</label>
                      <Input
                        value={stat.value}
                        onChange={(e) => {
                          const newStats = [...data.stats];
                          newStats[i].value = e.target.value;
                          setData({ ...data, stats: newStats });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMELINE SECTION */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Timeline Roadmap</CardTitle>
                  <CardDescription>Important dates for the current season.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setData({
                      ...data,
                      timeline: [
                        ...data.timeline,
                        { date: "New Date", title: "New Milestone", desc: "Description..." },
                      ],
                    });
                  }}
                >
                  <Plus className="size-4 mr-2" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.timeline.map((item, i) => (
                  <div key={i} className="border p-4 rounded-lg relative space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Date/Month</label>
                        <Input
                          value={item.date}
                          onChange={(e) => {
                            const newTimeline = [...data.timeline];
                            newTimeline[i].date = e.target.value;
                            setData({ ...data, timeline: newTimeline });
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Title</label>
                        <Input
                          value={item.title}
                          onChange={(e) => {
                            const newTimeline = [...data.timeline];
                            newTimeline[i].title = e.target.value;
                            setData({ ...data, timeline: newTimeline });
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium">Description</label>
                        <Input
                          value={item.desc}
                          onChange={(e) => {
                            const newTimeline = [...data.timeline];
                            newTimeline[i].desc = e.target.value;
                            setData({ ...data, timeline: newTimeline });
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const newTimeline = data.timeline.filter((_, idx) => idx !== i);
                        setData({ ...data, timeline: newTimeline });
                      }}
                    >
                      <Trash2 className="size-4 mr-2" /> Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BENEFITS SECTION */}
          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle>Benefits Grid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.benefits.map((item, i) => (
                  <div key={i} className="grid sm:grid-cols-2 gap-4 border p-4 rounded-lg">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium">Title</label>
                      <Input
                        value={item.title}
                        onChange={(e) => {
                          const newArr = [...data.benefits];
                          newArr[i].title = e.target.value;
                          setData({ ...data, benefits: newArr });
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium">Description</label>
                      <Input
                        value={item.desc}
                        onChange={(e) => {
                          const newArr = [...data.benefits];
                          newArr[i].desc = e.target.value;
                          setData({ ...data, benefits: newArr });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HOW IT WORKS SECTION */}
          <TabsContent value="howItWorks">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.howItWorks.map((item, i) => (
                  <div key={i} className="grid sm:grid-cols-3 gap-4 border p-4 rounded-lg">
                    <div className="grid gap-2 col-span-1">
                      <label className="text-xs font-medium">Step Title</label>
                      <Input
                        value={item.t}
                        onChange={(e) => {
                          const newArr = [...data.howItWorks];
                          newArr[i].t = e.target.value;
                          setData({ ...data, howItWorks: newArr });
                        }}
                      />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <label className="text-xs font-medium">Description</label>
                      <Input
                        value={item.d}
                        onChange={(e) => {
                          const newArr = [...data.howItWorks];
                          newArr[i].d = e.target.value;
                          setData({ ...data, howItWorks: newArr });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TESTIMONIALS SECTION */}
          <TabsContent value="testimonials">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Testimonials</CardTitle>
                  <CardDescription>Stories and quotes from citizens.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setData({
                      ...data,
                      testimonials: [
                        ...data.testimonials,
                        { name: "New Person", role: "Student", district: "Lucknow", quote: "..." },
                      ],
                    });
                  }}
                >
                  <Plus className="size-4 mr-2" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {data.testimonials.map((item, i) => (
                    <AccordionItem key={i} value={`t-${i}`}>
                      <AccordionTrigger>
                        {item.name} - {item.district}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4 border rounded-lg mt-2">
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <label className="text-xs font-medium">Name</label>
                            <Input
                              value={item.name}
                              onChange={(e) => {
                                const newArr = [...data.testimonials];
                                newArr[i].name = e.target.value;
                                setData({ ...data, testimonials: newArr });
                              }}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-xs font-medium">Role</label>
                            <Input
                              value={item.role}
                              onChange={(e) => {
                                const newArr = [...data.testimonials];
                                newArr[i].role = e.target.value;
                                setData({ ...data, testimonials: newArr });
                              }}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-xs font-medium">District</label>
                            <Input
                              value={item.district}
                              onChange={(e) => {
                                const newArr = [...data.testimonials];
                                newArr[i].district = e.target.value;
                                setData({ ...data, testimonials: newArr });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Quote</label>
                          <Textarea
                            value={item.quote}
                            onChange={(e) => {
                              const newArr = [...data.testimonials];
                              newArr[i].quote = e.target.value;
                              setData({ ...data, testimonials: newArr });
                            }}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newArr = data.testimonials.filter((_, idx) => idx !== i);
                            setData({ ...data, testimonials: newArr });
                          }}
                        >
                          <Trash2 className="size-4 mr-2" /> Remove
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQS SECTION */}
          <TabsContent value="faqs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>FAQs</CardTitle>
                  <CardDescription>Frequently asked questions on the landing page.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setData({
                      ...data,
                      faqs: [...data.faqs, { q: "New Question?", a: "New Answer." }],
                    });
                  }}
                >
                  <Plus className="size-4 mr-2" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {data.faqs.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4 border rounded-lg mt-2">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Question</label>
                          <Input
                            value={item.q}
                            onChange={(e) => {
                              const newArr = [...data.faqs];
                              newArr[i].q = e.target.value;
                              setData({ ...data, faqs: newArr });
                            }}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-medium">Answer</label>
                          <Textarea
                            value={item.a}
                            onChange={(e) => {
                              const newArr = [...data.faqs];
                              newArr[i].a = e.target.value;
                              setData({ ...data, faqs: newArr });
                            }}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newArr = data.faqs.filter((_, idx) => idx !== i);
                            setData({ ...data, faqs: newArr });
                          }}
                        >
                          <Trash2 className="size-4 mr-2" /> Remove
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
