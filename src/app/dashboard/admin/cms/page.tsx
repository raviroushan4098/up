"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, app } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LandingPageCMS, AboutPageCMS } from "@/types/cms";
import { emptyLandingCMS, emptyAboutCMS } from "@/types/cms";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, RefreshCw, ImagePlus, UploadCloud, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CMSPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<LandingPageCMS>(emptyLandingCMS);
  const [aboutData, setAboutData] = useState<AboutPageCMS>(emptyAboutCMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [activeTopTab, setActiveTopTab] = useState("landing");
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.role === "admin") {
      fetchCMS();
    }
  }, [authLoading, profile]);

  const fetchCMS = async () => {
    try {
      const [landingSnap, aboutSnap] = await Promise.all([
        getDoc(doc(db, "settings", "landingPage")),
        getDoc(doc(db, "settings", "aboutPage")),
      ]);

      if (landingSnap.exists()) {
        const docData = landingSnap.data();
        const loadedData = {
          ...emptyLandingCMS,
          ...docData,
          visibility: {
            ...emptyLandingCMS.visibility,
            ...(docData.visibility || {}),
          },
        } as LandingPageCMS;

        if (!loadedData.profileSections || loadedData.profileSections.length === 0) {
          loadedData.profileSections = [
            {
              id: "speakers-legacy",
              title: "Speakers",
              visible: loadedData.visibility?.speakers ?? true,
              members: loadedData.speakers || [],
            },
          ];
        }
        setData(loadedData);
      }

      if (aboutSnap.exists()) {
        const docData = aboutSnap.data();
        setAboutData({
          ...emptyAboutCMS,
          ...docData,
        } as AboutPageCMS);
      }
    } catch (error) {
      console.error("Error fetching CMS data:", error);
      toast.error("Failed to load CMS data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTopTab === "landing") {
        let newHeroImages = [...(data.hero.images || [])];
        const storage = getStorage(app);

        // Upload new array of images
        if (heroFiles.length > 0) {
          const uploadPromises = heroFiles.map(async (file, idx) => {
            const ext = file.name.split(".").pop();
            const imageRef = ref(storage, `cms/hero_multi_${Date.now()}_${idx}.${ext}`);
            const uploadResult = await uploadBytes(imageRef, file);
            return await getDownloadURL(uploadResult.ref);
          });
          const uploadedUrls = await Promise.all(uploadPromises);
          newHeroImages = [...newHeroImages, ...uploadedUrls];
        }

        // Backward compatibility: set image to the first image if available
        const heroImageUrl = newHeroImages.length > 0 ? newHeroImages[0] : data.hero.image || "";

        const payload = {
          ...data,
          hero: {
            ...data.hero,
            image: heroImageUrl,
            images: newHeroImages,
          },
        };

        const docRef = doc(db, "settings", "landingPage");
        await setDoc(docRef, payload);

        setData(payload as LandingPageCMS);
        setHeroFiles([]);
        toast.success("Landing page content updated successfully");
      } else {
        const docRef = doc(db, "settings", "aboutPage");
        await setDoc(docRef, aboutData);
        toast.success("About page content updated successfully");
      }
    } catch (error) {
      console.error(error);
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
      if (activeTopTab === "landing") {
        setData(emptyLandingCMS);
      } else {
        setAboutData(emptyAboutCMS);
      }
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
              Changes saved here will instantly reflect on the public{" "}
              {activeTopTab === "landing" ? "landing" : "about"} page.
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

        <Tabs value={activeTopTab} onValueChange={setActiveTopTab} className="w-full">
          <TabsList className="mb-6 w-full grid grid-cols-2 max-w-md h-auto">
            <TabsTrigger value="landing">Landing Page</TabsTrigger>
            <TabsTrigger value="about">About Page</TabsTrigger>
          </TabsList>

          <TabsContent value="landing">
            <Tabs defaultValue="hero" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-5 lg:grid-cols-9 h-auto">
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="speakers">Speakers & Guests</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="benefits">Benefits</TabsTrigger>
                <TabsTrigger value="howItWorks">How It Works</TabsTrigger>
                <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              {/* HERO SECTION */}
              <TabsContent value="hero">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Hero Section</CardTitle>
                      <CardDescription>The main banner at the top of the homepage.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="hero-visibility">Visible</Label>
                      <Switch
                        id="hero-visibility"
                        checked={data.visibility?.hero ?? true}
                        onCheckedChange={(checked) =>
                          setData({ ...data, visibility: { ...data.visibility, hero: checked } })
                        }
                      />
                    </div>
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
                            setData({
                              ...data,
                              hero: { ...data.hero, titleGradient: e.target.value },
                            })
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
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Hero Images Carousel</label>
                      <div className="flex flex-wrap gap-4 items-start">
                        {/* Existing Images */}
                        {(data.hero.images?.length
                          ? data.hero.images
                          : data.hero.image
                            ? [data.hero.image]
                            : []
                        ).map((url, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={url}
                              alt="Hero"
                              className="h-20 w-32 object-cover rounded-md border"
                            />
                            <button
                              onClick={() => {
                                const newImages = [
                                  ...(data.hero.images ||
                                    (data.hero.image ? [data.hero.image] : [])),
                                ];
                                newImages.splice(i, 1);
                                setData({ ...data, hero: { ...data.hero, images: newImages } });
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}

                        {/* New Uploading Images */}
                        {heroFiles.map((file, i) => (
                          <div key={`new-${i}`} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Hero Preview"
                              className="h-20 w-32 object-cover rounded-md border opacity-70"
                            />
                            <button
                              onClick={() => {
                                const newFiles = [...heroFiles];
                                newFiles.splice(i, 1);
                                setHeroFiles(newFiles);
                              }}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}

                        {/* Add Image Tile */}
                        <label className="h-20 w-32 border-2 border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-md flex flex-col items-center justify-center cursor-pointer shrink-0">
                          <Plus className="size-6 text-primary mb-1" />
                          <span className="text-[10px] font-medium text-primary">Add Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                setHeroFiles([...heroFiles, ...Array.from(e.target.files)]);
                              }
                              // Reset the input value so the same file can be selected again if needed
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {/* The file input has been moved to the Add Image Tile in the grid above */}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload high-quality images (recommended: 1536x1024px). These will rotate
                        every 10 seconds.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Video URL (YouTube Embed)</label>
                      <Input
                        value={data.hero.videoUrl || ""}
                        placeholder="https://www.youtube.com/embed/..."
                        onChange={(e) =>
                          setData({ ...data, hero: { ...data.hero, videoUrl: e.target.value } })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste a YouTube embed URL. If set, this replaces the image carousel on the
                        right side of the hero.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* STATS SECTION */}
              <TabsContent value="stats">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Statistics</CardTitle>
                      <CardDescription>
                        The 4 large numbers displayed below the hero.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="stats-visibility">Visible</Label>
                      <Switch
                        id="stats-visibility"
                        checked={data.visibility?.stats ?? true}
                        onCheckedChange={(checked) =>
                          setData({ ...data, visibility: { ...data.visibility, stats: checked } })
                        }
                      />
                    </div>
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
                      <CardTitle>Timeline</CardTitle>
                      <CardDescription>Important dates for the current season.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="timeline-visibility">Visible</Label>
                        <Switch
                          id="timeline-visibility"
                          checked={data.visibility?.timeline ?? true}
                          onCheckedChange={(checked) =>
                            setData({
                              ...data,
                              visibility: { ...data.visibility, timeline: checked },
                            })
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setData({
                            ...data,
                            timeline: [
                              ...data.timeline,
                              {
                                date: "New Date",
                                title: "New Milestone",
                                desc: "Description...",
                                image: "",
                              },
                            ],
                          });
                        }}
                      >
                        <Plus className="size-4 mr-2" /> Add
                      </Button>
                    </div>
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

                        <div className="grid gap-4 md:grid-cols-12 items-end">
                          <div className="md:col-span-8 space-y-2">
                            <label className="text-xs font-medium">Image URL</label>
                            <Input
                              placeholder="https://..."
                              value={item.image || ""}
                              onChange={(e) => {
                                const newTimeline = [...data.timeline];
                                newTimeline[i].image = e.target.value;
                                setData({ ...data, timeline: newTimeline });
                              }}
                            />
                          </div>
                          <div className="md:col-span-4 flex items-center gap-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt="preview"
                                className="h-10 w-16 object-cover rounded border"
                              />
                            )}
                            <CMSImageUploader
                              path={`timeline_${i}`}
                              onUploaded={(url) => {
                                const newTimeline = [...data.timeline];
                                newTimeline[i].image = url;
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Benefits Grid</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="benefits-visibility">Visible</Label>
                      <Switch
                        id="benefits-visibility"
                        checked={data.visibility?.benefits ?? true}
                        onCheckedChange={(checked) =>
                          setData({
                            ...data,
                            visibility: { ...data.visibility, benefits: checked },
                          })
                        }
                      />
                    </div>
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>How It Works</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="how-it-works-visibility">Visible</Label>
                      <Switch
                        id="how-it-works-visibility"
                        checked={data.visibility?.howItWorks ?? true}
                        onCheckedChange={(checked) =>
                          setData({
                            ...data,
                            visibility: { ...data.visibility, howItWorks: checked },
                          })
                        }
                      />
                    </div>
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
                      <CardDescription>Stories and quotes from users.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="testimonials-visibility">Visible</Label>
                        <Switch
                          id="testimonials-visibility"
                          checked={data.visibility?.testimonials ?? true}
                          onCheckedChange={(checked) =>
                            setData({
                              ...data,
                              visibility: { ...data.visibility, testimonials: checked },
                            })
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setData({
                            ...data,
                            testimonials: [
                              ...data.testimonials,
                              {
                                name: "New Person",
                                role: "Student",
                                district: "Lucknow",
                                quote: "...",
                              },
                            ],
                          });
                        }}
                      >
                        <Plus className="size-4 mr-2" /> Add
                      </Button>
                    </div>
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
                      <CardDescription>
                        Frequently asked questions on the landing page.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="faqs-visibility">Visible</Label>
                        <Switch
                          id="faqs-visibility"
                          checked={data.visibility?.faqs ?? true}
                          onCheckedChange={(checked) =>
                            setData({ ...data, visibility: { ...data.visibility, faqs: checked } })
                          }
                        />
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
                    </div>
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

              {/* SPEAKERS & GUESTS SECTION */}
              <TabsContent value="speakers">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Speakers & Guest Sections</CardTitle>
                      <CardDescription>
                        Create and manage dynamic profile sections (e.g. Speakers, VIP Guests,
                        Mentors) for the landing page.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const newSectionId = `section_${Date.now()}`;
                        setData({
                          ...data,
                          profileSections: [
                            ...(data.profileSections || []),
                            {
                              id: newSectionId,
                              title: "New Section",
                              visible: true,
                              members: [],
                            },
                          ],
                        });
                      }}
                    >
                      <Plus className="size-4 mr-2" /> Add Section
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!data.profileSections || data.profileSections.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                        No sections created yet. Click "Add Section" above to start.
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full space-y-4">
                        {data.profileSections.map((section, sIdx) => (
                          <AccordionItem
                            key={section.id}
                            value={section.id}
                            className="border border-border/60 rounded-xl px-4 bg-muted/20"
                          >
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-center justify-between w-full pr-4 text-left">
                                <span className="font-semibold text-primary">
                                  {section.title || "Untitled Section"}
                                </span>
                                <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-normal">
                                  {section.members?.length || 0} Members
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-6 space-y-6">
                              {/* Section Title & Visibility Toggle */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-card shadow-sm">
                                <div className="grid gap-1.5 flex-1">
                                  <label className="text-xs font-semibold text-primary">
                                    Section Title
                                  </label>
                                  <Input
                                    value={section.title}
                                    placeholder="e.g. Keynote Speakers"
                                    onChange={(e) => {
                                      const newSections = [...(data.profileSections || [])];
                                      newSections[sIdx] = {
                                        ...newSections[sIdx],
                                        title: e.target.value,
                                      };
                                      setData({ ...data, profileSections: newSections });
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-4 border-l pl-0 sm:pl-6 border-border/50">
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={`visible-${section.id}`}
                                      className="text-sm font-medium"
                                    >
                                      Visible
                                    </Label>
                                    <Switch
                                      id={`visible-${section.id}`}
                                      checked={section.visible}
                                      onCheckedChange={(checked) => {
                                        const newSections = [...(data.profileSections || [])];
                                        newSections[sIdx] = {
                                          ...newSections[sIdx],
                                          visible: checked,
                                        };
                                        setData({ ...data, profileSections: newSections });
                                      }}
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10 border-destructive/20 size-9 rounded-lg"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Are you sure you want to delete the section "${section.title}"?`,
                                        )
                                      ) {
                                        const newSections = (data.profileSections || []).filter(
                                          (_, idx) => idx !== sIdx,
                                        );
                                        setData({ ...data, profileSections: newSections });
                                      }
                                    }}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Members Accordion */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-[#3D1B0E]">
                                    Members in this Section
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary"
                                    onClick={() => {
                                      const newSections = [...(data.profileSections || [])];
                                      const currentMembers = newSections[sIdx].members || [];
                                      newSections[sIdx] = {
                                        ...newSections[sIdx],
                                        members: [
                                          ...currentMembers,
                                          {
                                            name: "New Member",
                                            role: "Role",
                                            phone: "",
                                            image: "",
                                          },
                                        ],
                                      };
                                      setData({ ...data, profileSections: newSections });
                                    }}
                                  >
                                    <Plus className="size-3.5 mr-1" /> Add Member
                                  </Button>
                                </div>

                                {!section.members || section.members.length === 0 ? (
                                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg bg-card/50">
                                    No members added to this section yet. Click "Add Member" to
                                    start.
                                  </div>
                                ) : (
                                  <Accordion type="single" collapsible className="w-full space-y-2">
                                    {section.members.map((member, mIdx) => (
                                      <AccordionItem
                                        key={mIdx}
                                        value={`member-${section.id}-${mIdx}`}
                                        className="border rounded-lg px-3 bg-card shadow-sm"
                                      >
                                        <AccordionTrigger className="hover:no-underline py-3 text-sm">
                                          <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                              <img
                                                src={member.image || "/placeholder-avatar.png"}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <span className="font-semibold text-[#3D1B0E]">
                                              {member.name}{" "}
                                              <span className="font-normal text-xs text-muted-foreground">
                                                — {member.role}
                                              </span>
                                            </span>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-2 pb-4">
                                          <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="grid gap-1.5">
                                              <label className="text-xs font-semibold">Name</label>
                                              <Input
                                                value={member.name}
                                                onChange={(e) => {
                                                  const newSections = [
                                                    ...(data.profileSections || []),
                                                  ];
                                                  const newMembers = [...newSections[sIdx].members];
                                                  newMembers[mIdx] = {
                                                    ...newMembers[mIdx],
                                                    name: e.target.value,
                                                  };
                                                  newSections[sIdx] = {
                                                    ...newSections[sIdx],
                                                    members: newMembers,
                                                  };
                                                  setData({
                                                    ...data,
                                                    profileSections: newSections,
                                                  });
                                                }}
                                              />
                                            </div>
                                            <div className="grid gap-1.5">
                                              <label className="text-xs font-semibold">Role</label>
                                              <Input
                                                value={member.role}
                                                onChange={(e) => {
                                                  const newSections = [
                                                    ...(data.profileSections || []),
                                                  ];
                                                  const newMembers = [...newSections[sIdx].members];
                                                  newMembers[mIdx] = {
                                                    ...newMembers[mIdx],
                                                    role: e.target.value,
                                                  };
                                                  newSections[sIdx] = {
                                                    ...newSections[sIdx],
                                                    members: newMembers,
                                                  };
                                                  setData({
                                                    ...data,
                                                    profileSections: newSections,
                                                  });
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div className="grid gap-1.5">
                                            <label className="text-xs font-semibold">
                                              Phone (Optional)
                                            </label>
                                            <Input
                                              value={member.phone || ""}
                                              placeholder="+91 79917 53893"
                                              onChange={(e) => {
                                                const newSections = [
                                                  ...(data.profileSections || []),
                                                ];
                                                const newMembers = [...newSections[sIdx].members];
                                                newMembers[mIdx] = {
                                                  ...newMembers[mIdx],
                                                  phone: e.target.value,
                                                };
                                                newSections[sIdx] = {
                                                  ...newSections[sIdx],
                                                  members: newMembers,
                                                };
                                                setData({ ...data, profileSections: newSections });
                                              }}
                                            />
                                          </div>
                                          <div className="grid gap-1.5">
                                            <label className="text-xs font-semibold">
                                              Guest/Speaker Photo
                                            </label>
                                            <div className="flex items-start gap-4">
                                              {member.image ? (
                                                <div className="relative group size-20 rounded-lg overflow-hidden border">
                                                  <img
                                                    src={member.image}
                                                    alt={member.name}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      const newSections = [
                                                        ...(data.profileSections || []),
                                                      ];
                                                      const newMembers = [
                                                        ...newSections[sIdx].members,
                                                      ];
                                                      newMembers[mIdx] = {
                                                        ...newMembers[mIdx],
                                                        image: "",
                                                      };
                                                      newSections[sIdx] = {
                                                        ...newSections[sIdx],
                                                        members: newMembers,
                                                      };
                                                      setData({
                                                        ...data,
                                                        profileSections: newSections,
                                                      });
                                                    }}
                                                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors size-6 flex items-center justify-center"
                                                  >
                                                    <Trash2 className="size-3" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <ProfileImageUploader
                                                  sectionId={section.id}
                                                  memberIndex={mIdx}
                                                  onUploaded={(url) => {
                                                    const newSections = [
                                                      ...(data.profileSections || []),
                                                    ];
                                                    const newMembers = [
                                                      ...newSections[sIdx].members,
                                                    ];
                                                    newMembers[mIdx] = {
                                                      ...newMembers[mIdx],
                                                      image: url,
                                                    };
                                                    newSections[sIdx] = {
                                                      ...newSections[sIdx],
                                                      members: newMembers,
                                                    };
                                                    setData({
                                                      ...data,
                                                      profileSections: newSections,
                                                    });
                                                  }}
                                                />
                                              )}
                                            </div>
                                          </div>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                              const newSections = [...(data.profileSections || [])];
                                              const newMembers = newSections[sIdx].members.filter(
                                                (_, idx) => idx !== mIdx,
                                              );
                                              newSections[sIdx] = {
                                                ...newSections[sIdx],
                                                members: newMembers,
                                              };
                                              setData({ ...data, profileSections: newSections });
                                            }}
                                            className="h-8 text-xs font-semibold"
                                          >
                                            <Trash2 className="size-3.5 mr-1" /> Remove Member
                                          </Button>
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONTACT SECTION */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Update the contact details shown in the footer and contact page.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Helpline </label>
                      <Input
                        value={data.contact?.helpline || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            contact: { ...data.contact, helpline: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Email Support</label>
                      <Input
                        value={data.contact?.email || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            contact: { ...data.contact, email: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Office Address</label>
                      <Input
                        value={data.contact?.office || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            contact: { ...data.contact, office: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">WhatsApp</label>
                      <Input
                        value={data.contact?.whatsapp || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            contact: { ...data.contact, whatsapp: e.target.value },
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ABOUT PAGE EDITOR */}
          <TabsContent value="about">
            <Tabs defaultValue="aboutHero" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="aboutHero">Hero</TabsTrigger>
                <TabsTrigger value="aboutMission">Mission & Vision</TabsTrigger>
                <TabsTrigger value="aboutObjectives">Objectives</TabsTrigger>
                <TabsTrigger value="aboutTimeline">Timeline</TabsTrigger>
                <TabsTrigger value="aboutTeam">Team</TabsTrigger>
              </TabsList>

              <TabsContent value="aboutHero">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                    <CardDescription>The main banner at the top of the About page.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Badge Text</label>
                      <Input
                        value={aboutData.hero.badgeText}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            hero: { ...aboutData.hero, badgeText: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Title Line 1</label>
                        <Input
                          value={aboutData.hero.titleLine1}
                          onChange={(e) =>
                            setAboutData({
                              ...aboutData,
                              hero: { ...aboutData.hero, titleLine1: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Title Gradient Text</label>
                        <Input
                          value={aboutData.hero.titleGradient}
                          onChange={(e) =>
                            setAboutData({
                              ...aboutData,
                              hero: { ...aboutData.hero, titleGradient: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Subtitle</label>
                      <Textarea
                        value={aboutData.hero.subtitle}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            hero: { ...aboutData.hero, subtitle: e.target.value },
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aboutMission">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Mission</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={aboutData.mission.title}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            mission: { ...aboutData.mission, title: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={aboutData.mission.description}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            mission: { ...aboutData.mission, description: e.target.value },
                          })
                        }
                        rows={8}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Mission Image</label>
                      {aboutData.mission.image ? (
                        <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden border border-border">
                          <img
                            src={aboutData.mission.image}
                            alt="Mission"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAboutData({
                                ...aboutData,
                                mission: { ...aboutData.mission, image: "" },
                              })
                            }
                            className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <CMSImageUploader
                          path="mission"
                          onUploaded={(url) =>
                            setAboutData({
                              ...aboutData,
                              mission: { ...aboutData.mission, image: url },
                            })
                          }
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Vision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={aboutData.vision.title}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            vision: { ...aboutData.vision, title: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={aboutData.vision.description}
                        onChange={(e) =>
                          setAboutData({
                            ...aboutData,
                            vision: { ...aboutData.vision, description: e.target.value },
                          })
                        }
                        rows={8}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Vision Image</label>
                      {aboutData.vision.image ? (
                        <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden border border-border">
                          <img
                            src={aboutData.vision.image}
                            alt="Vision"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAboutData({
                                ...aboutData,
                                vision: { ...aboutData.vision, image: "" },
                              })
                            }
                            className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <CMSImageUploader
                          path="vision"
                          onUploaded={(url) =>
                            setAboutData({
                              ...aboutData,
                              vision: { ...aboutData.vision, image: url },
                            })
                          }
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aboutObjectives">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Objectives</CardTitle>
                      <CardDescription>The core goals of the initiative.</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        setAboutData({
                          ...aboutData,
                          objectives: [
                            ...aboutData.objectives,
                            { icon: "Users", title: "", description: "" },
                          ],
                        })
                      }
                    >
                      <Plus className="size-4 mr-2" /> Add Objective
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {aboutData.objectives.map((obj, i) => (
                        <AccordionItem key={i} value={`obj-${i}`}>
                          <AccordionTrigger className="hover:no-underline font-medium">
                            {obj.title || `Objective ${i + 1}`}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                            <div className="grid gap-2">
                              <label className="text-xs font-medium">Icon Name</label>
                              <Input
                                value={obj.icon}
                                onChange={(e) => {
                                  const newArr = [...aboutData.objectives];
                                  newArr[i].icon = e.target.value;
                                  setAboutData({ ...aboutData, objectives: newArr });
                                }}
                                placeholder="e.g., Users, Target, Rocket"
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-medium">Title</label>
                              <Input
                                value={obj.title}
                                onChange={(e) => {
                                  const newArr = [...aboutData.objectives];
                                  newArr[i].title = e.target.value;
                                  setAboutData({ ...aboutData, objectives: newArr });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-medium">Description</label>
                              <Textarea
                                value={obj.description}
                                onChange={(e) => {
                                  const newArr = [...aboutData.objectives];
                                  newArr[i].description = e.target.value;
                                  setAboutData({ ...aboutData, objectives: newArr });
                                }}
                                rows={3}
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newArr = aboutData.objectives.filter((_, idx) => idx !== i);
                                setAboutData({ ...aboutData, objectives: newArr });
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

              <TabsContent value="aboutTimeline">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Journey Timeline</CardTitle>
                      <CardDescription>Historical milestones of the organization.</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        setAboutData({
                          ...aboutData,
                          timeline: [...aboutData.timeline, { date: "", title: "", desc: "" }],
                        })
                      }
                    >
                      <Plus className="size-4 mr-2" /> Add Milestone
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {aboutData.timeline.map((item, i) => (
                        <AccordionItem key={i} value={`about-timeline-${i}`}>
                          <AccordionTrigger className="hover:no-underline font-medium">
                            {item.title || `Milestone ${i + 1}`}
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 p-4 border rounded-md mt-2">
                            <div className="grid gap-2">
                              <label className="text-xs font-medium">Date/Year</label>
                              <Input
                                value={item.date}
                                onChange={(e) => {
                                  const newArr = [...aboutData.timeline];
                                  newArr[i].date = e.target.value;
                                  setAboutData({ ...aboutData, timeline: newArr });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-medium">Title</label>
                              <Input
                                value={item.title}
                                onChange={(e) => {
                                  const newArr = [...aboutData.timeline];
                                  newArr[i].title = e.target.value;
                                  setAboutData({ ...aboutData, timeline: newArr });
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs font-medium">Description</label>
                              <Textarea
                                value={item.desc}
                                onChange={(e) => {
                                  const newArr = [...aboutData.timeline];
                                  newArr[i].desc = e.target.value;
                                  setAboutData({ ...aboutData, timeline: newArr });
                                }}
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newArr = aboutData.timeline.filter((_, idx) => idx !== i);
                                setAboutData({ ...aboutData, timeline: newArr });
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

              <TabsContent value="aboutTeam">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Team Categories</CardTitle>
                      <CardDescription>
                        Add founders, directors, and other team members.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        const newCat = {
                          id: Date.now().toString(),
                          categoryName: "New Category",
                          members: [],
                        };
                        setAboutData({
                          ...aboutData,
                          teamCategories: [...(aboutData.teamCategories || []), newCat],
                        });
                      }}
                    >
                      <Plus className="size-4 mr-2" /> Add Category
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {(aboutData.teamCategories || []).map((cat, catIdx) => (
                        <AccordionItem key={cat.id} value={`cat-${cat.id}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-semibold">{cat.categoryName}</span>
                              <Badge variant="secondary">{cat.members.length} Members</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-6 pt-4 border-t mt-2">
                            <div className="flex items-center justify-between gap-4">
                              <Input
                                value={cat.categoryName}
                                onChange={(e) => {
                                  const newArr = [...(aboutData.teamCategories || [])];
                                  newArr[catIdx].categoryName = e.target.value;
                                  setAboutData({ ...aboutData, teamCategories: newArr });
                                }}
                                className="max-w-xs font-semibold"
                                placeholder="Category Name (e.g. Founders)"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newArr = (aboutData.teamCategories || []).filter(
                                    (_, idx) => idx !== catIdx,
                                  );
                                  setAboutData({ ...aboutData, teamCategories: newArr });
                                }}
                              >
                                <Trash2 className="size-4 mr-2" /> Remove Category
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {cat.members.map((member, memberIdx) => (
                                <div
                                  key={member.id}
                                  className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 space-y-4"
                                >
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium text-sm">Member {memberIdx + 1}</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        const newCategories = [...(aboutData.teamCategories || [])];
                                        newCategories[catIdx].members = newCategories[
                                          catIdx
                                        ].members.filter((_, mIdx) => mIdx !== memberIdx);
                                        setAboutData({
                                          ...aboutData,
                                          teamCategories: newCategories,
                                        });
                                      }}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Image Upload */}
                                    <div className="shrink-0 flex flex-col gap-2">
                                      <div className="size-32 rounded-lg border-2 border-dashed bg-white dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden relative group">
                                        {uploadingMemberId === member.id ? (
                                          <div className="text-center p-2 flex flex-col items-center">
                                            <Loader2 className="size-6 text-primary mx-auto mb-1 animate-spin" />
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                              Uploading...
                                            </span>
                                          </div>
                                        ) : member.image ? (
                                          <img
                                            src={member.image}
                                            className="w-full h-full object-cover"
                                            alt={member.name}
                                          />
                                        ) : (
                                          <div className="text-center p-2">
                                            <UploadCloud className="size-6 text-muted-foreground mx-auto mb-1" />
                                            <span className="text-[10px] text-muted-foreground">
                                              Upload Image
                                            </span>
                                          </div>
                                        )}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          disabled={uploadingMemberId === member.id}
                                          className={`absolute inset-0 opacity-0 ${uploadingMemberId === member.id ? "cursor-not-allowed" : "cursor-pointer"}`}
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              setUploadingMemberId(member.id);
                                              const { ref, uploadBytes, getDownloadURL } =
                                                await import("firebase/storage");
                                              const { storage } = await import("@/lib/firebase");
                                              const fileRef = ref(
                                                storage,
                                                `cms/team/${Date.now()}-${file.name}`,
                                              );
                                              await uploadBytes(fileRef, file);
                                              const url = await getDownloadURL(fileRef);

                                              const newCategories = [
                                                ...(aboutData.teamCategories || []),
                                              ];
                                              newCategories[catIdx].members[memberIdx].image = url;
                                              setAboutData({
                                                ...aboutData,
                                                teamCategories: newCategories,
                                              });
                                              setUploadingMemberId(null);
                                            } catch (error) {
                                              console.error("Upload error:", error);
                                              setUploadingMemberId(null);
                                              toast.error(
                                                "Failed to upload image. Make sure you are an admin and the rules are deployed.",
                                              );
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Member Details */}
                                    <div className="flex-1 space-y-4">
                                      <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                          <label className="text-xs font-medium">Name</label>
                                          <Input
                                            value={member.name}
                                            onChange={(e) => {
                                              const newCategories = [
                                                ...(aboutData.teamCategories || []),
                                              ];
                                              newCategories[catIdx].members[memberIdx].name =
                                                e.target.value;
                                              setAboutData({
                                                ...aboutData,
                                                teamCategories: newCategories,
                                              });
                                            }}
                                            placeholder="John Doe"
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <label className="text-xs font-medium">
                                            Role / Subtitle
                                          </label>
                                          <Input
                                            value={member.role || ""}
                                            onChange={(e) => {
                                              const newCategories = [
                                                ...(aboutData.teamCategories || []),
                                              ];
                                              newCategories[catIdx].members[memberIdx].role =
                                                e.target.value;
                                              setAboutData({
                                                ...aboutData,
                                                teamCategories: newCategories,
                                              });
                                            }}
                                            placeholder="Co-founder"
                                          />
                                        </div>
                                      </div>
                                      <div className="grid gap-2">
                                        <label className="text-xs font-medium">Bio / Notes</label>
                                        <Textarea
                                          value={member.notes}
                                          onChange={(e) => {
                                            const newCategories = [
                                              ...(aboutData.teamCategories || []),
                                            ];
                                            newCategories[catIdx].members[memberIdx].notes =
                                              e.target.value;
                                            setAboutData({
                                              ...aboutData,
                                              teamCategories: newCategories,
                                            });
                                          }}
                                          rows={3}
                                          placeholder="Short bio about this team member..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <Button
                                variant="outline"
                                className="w-full border-dashed"
                                onClick={() => {
                                  const newCategories = [...(aboutData.teamCategories || [])];
                                  newCategories[catIdx].members.push({
                                    id: Date.now().toString(),
                                    name: "",
                                    role: "",
                                    notes: "",
                                    image: "",
                                  });
                                  setAboutData({ ...aboutData, teamCategories: newCategories });
                                }}
                              >
                                <Plus className="size-4 mr-2" /> Add Team Member
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── Profile Image Uploader (uploads directly to Firebase Storage) ─── */
function ProfileImageUploader({
  sectionId,
  memberIndex,
  onUploaded,
}: {
  sectionId: string;
  memberIndex: number;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storage = getStorage(app);
      const ext = file.name.split(".").pop();
      const imageRef = ref(
        storage,
        `cms/profiles/profile_${sectionId}_${Date.now()}_${memberIndex}.${ext}`,
      );
      const uploadResult = await uploadBytes(imageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      onUploaded(url);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Profile image upload failed:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label className="h-20 w-20 border-2 border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-lg flex flex-col items-center justify-center cursor-pointer shrink-0">
      {uploading ? (
        <Loader2 className="size-5 text-primary animate-spin" />
      ) : (
        <>
          <ImagePlus className="size-5 text-primary mb-1" />
          <span className="text-[9px] font-medium text-primary">Upload</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={handleFileChange}
      />
    </label>
  );
}

/* ─── CMS Image Uploader (uploads directly to Firebase Storage) ─── */
function CMSImageUploader({
  path,
  onUploaded,
}: {
  path: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storage = getStorage(app);
      const ext = file.name.split(".").pop();
      const imageRef = ref(storage, `cms/about/${path}_${Date.now()}.${ext}`);
      const uploadResult = await uploadBytes(imageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      onUploaded(url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("CMS image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label className="h-24 w-full md:w-48 border-2 border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-colors rounded-lg flex flex-col items-center justify-center cursor-pointer shrink-0 py-4">
      {uploading ? (
        <Loader2 className="size-6 text-primary animate-spin" />
      ) : (
        <>
          <ImagePlus className="size-6 text-primary mb-1.5" />
          <span className="text-xs font-semibold text-primary">Upload Custom Image</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={handleFileChange}
      />
    </label>
  );
}
