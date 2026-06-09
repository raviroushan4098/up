"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { UPEvent } from "@/types/events";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Palette,
  Link as LinkIcon,
  Image as ImageIcon,
  Zap,
  Activity,
  Save,
  Trash2,
} from "lucide-react";

const PRESET_COLORS = [
  { name: "Navy Blue (Primary)", value: "#0A192F" },
  { name: "Saffron (Accent)", value: "#F97316" },
  { name: "Green (Success)", value: "#10B981" },
  { name: "Black", value: "#000000" },
];

export default function QRStudioPage() {
  const [events, setEvents] = useState<UPEvent[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Studio State
  const [mode, setMode] = useState<"static" | "dynamic">("static");

  // Static State
  const [staticUrl, setStaticUrl] = useState(
    typeof window !== "undefined" ? window.location.origin : "https://bhavishya.up.gov.in",
  );

  // Dynamic State
  const [campaignName, setCampaignName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [dynamicQrUrl, setDynamicQrUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Styling State
  const [fgColor, setFgColor] = useState("#0A192F");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [showLogo, setShowLogo] = useState(true);
  const [showFrame, setShowFrame] = useState(true);
  const [frameText, setFrameText] = useState("Scan to Apply");

  const qrRef = useRef<HTMLDivElement>(null);

  // Editing Dynamic Link
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingTargetUrl, setEditingTargetUrl] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventSnap = await getDocs(
        query(collection(db, "events"), orderBy("createdAt", "desc")),
      );
      setEvents(eventSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as UPEvent));

      // Fetch dynamic links
      const linkSnap = await getDocs(
        query(collection(db, "dynamic_links"), orderBy("createdAt", "desc")),
      );
      setLinks(linkSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    if (eventId === "custom") {
      if (mode === "static") setStaticUrl("https://");
      else setTargetUrl("https://");
      setFrameText("Scan Here");
      return;
    }
    const event = events.find((e) => e.id === eventId);
    if (event) {
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "https://bhavishya.up.gov.in";
      const url = `${baseUrl}/events/${eventId}`;
      if (mode === "static") setStaticUrl(url);
      else setTargetUrl(url);
      setFrameText(`Scan for ${event.title}`);
      if (mode === "dynamic" && !campaignName) setCampaignName(`Promo: ${event.title}`);
    }
  };

  const handleGenerateDynamic = async () => {
    if (!campaignName || !targetUrl) {
      toast.error("Please provide a Campaign Name and Target URL.");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate shortcode
      const shortCode = Math.random().toString(36).substring(2, 8).toLowerCase();
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "https://bhavishya.up.gov.in";
      const newDynamicUrl = `${baseUrl}/q/${shortCode}`;

      // Update the UI so the QR renders the shortlink
      setDynamicQrUrl(newDynamicUrl);

      // Wait for React to paint the new QR code to the DOM before taking a snapshot
      setTimeout(async () => {
        try {
          let qrImageUrl = "";
          if (qrRef.current) {
            toast.info("Saving QR code image...");
            const dataUrl = await toPng(qrRef.current, {
              cacheBust: true,
              quality: 1,
              pixelRatio: 3,
              skipFonts: true,
            });

            const storageRef = ref(storage, `cms/qr/${shortCode}.png`);
            await uploadString(storageRef, dataUrl, "data_url");
            qrImageUrl = await getDownloadURL(storageRef);
          }

          const newLink = {
            name: campaignName,
            targetUrl: targetUrl,
            clicks: 0,
            qrImageUrl: qrImageUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(doc(db, "dynamic_links", shortCode), newLink);
          toast.success("Dynamic QR Link Created and Saved!");

          // Reset form somewhat
          setCampaignName("");
          setTargetUrl("");

          fetchData(); // Refresh table
        } catch (error) {
          console.error(error);
          toast.error("Failed to create dynamic link and upload QR");
        } finally {
          setIsGenerating(false);
        }
      }, 500); // 500ms delay to allow SVG render
    } catch (error) {
      console.error(error);
      toast.error("Failed to create dynamic link");
      setIsGenerating(false);
    }
  };

  const handleUpdateLink = async (id: string) => {
    try {
      await updateDoc(doc(db, "dynamic_links", id), {
        targetUrl: editingTargetUrl,
        updatedAt: serverTimestamp(),
      });
      toast.success("Target URL updated! Scans will now redirect there.");
      setEditingLinkId(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update link");
    }
  };

  const handleDeleteLink = async (id: string, qrImageUrl?: string) => {
    if (
      !confirm("Are you sure you want to delete this QR link? It will stop working immediately.")
    ) {
      return;
    }

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "dynamic_links", id));

      // 2. Try to delete the image from Storage if it exists
      if (qrImageUrl) {
        try {
          const storageRef = ref(storage, `cms/qr/${id}.png`);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn("Storage image could not be deleted:", storageErr);
        }
      }

      toast.success("Dynamic QR link deleted");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete link");
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 3,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `QR-${frameText.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("QR Code downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.");
    }
  };

  const currentQrValue =
    mode === "static" ? staticUrl : dynamicQrUrl || "https://bhavishya.up.gov.in";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">QR Generator Studio</h1>
        <p className="text-muted-foreground mt-2">
          Design and download high-resolution QR codes. Use Dynamic mode to track analytics and
          update links after printing.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Config Panel */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="static" className="text-base gap-2">
                <LinkIcon className="size-4" /> Static QR
              </TabsTrigger>
              <TabsTrigger value="dynamic" className="text-base gap-2">
                <Zap className="size-4" /> Dynamic QR (Advanced)
              </TabsTrigger>
            </TabsList>

            <Card className="mt-4 border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {mode === "static" ? "Direct Destination" : "Redirect Configuration"}
                </CardTitle>
                <CardDescription>
                  {mode === "static"
                    ? "Link is permanently baked into the QR code."
                    : "Create a shortlink. You can change the destination later without reprinting."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === "dynamic" && (
                  <div className="grid gap-2">
                    <Label>Campaign Name</Label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g., Main Stage Poster"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Link to Event (Auto-fill)</Label>
                  <Select onValueChange={handleEventSelect} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event to link to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">-- Custom URL --</SelectItem>
                      {events.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Target URL</Label>
                  <Input
                    value={mode === "static" ? staticUrl : targetUrl}
                    onChange={(e) =>
                      mode === "static"
                        ? setStaticUrl(e.target.value)
                        : setTargetUrl(e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>

                {mode === "dynamic" && (
                  <div className="pt-4">
                    <Button
                      onClick={handleGenerateDynamic}
                      disabled={isGenerating}
                      className="w-full gap-2"
                    >
                      <Zap className="size-4" />{" "}
                      {isGenerating ? "Generating..." : "Generate Dynamic Link"}
                    </Button>
                    {dynamicQrUrl && (
                      <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm text-center">
                        <span className="text-muted-foreground">Shortlink: </span>
                        <a
                          href={dynamicQrUrl}
                          target="_blank"
                          className="font-medium text-primary hover:underline"
                        >
                          {dynamicQrUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="size-5 text-accent" /> Styling Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>QR Code Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFgColor(color.value)}
                        className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          fgColor === color.value
                            ? "ring-2 ring-accent ring-offset-2 scale-110"
                            : "border-transparent shadow-sm"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                    <div className="flex items-center gap-2 mt-2 w-full">
                      <Input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="p-1 h-9 w-14 shrink-0 cursor-pointer"
                      />
                      <Input
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-9 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="p-1 h-9 w-14 shrink-0 cursor-pointer"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base">Insert Brand Logo</Label>
                  <p className="text-xs text-muted-foreground">
                    Add the Bhavishya logo to the center of the QR code.
                  </p>
                </div>
                <Switch checked={showLogo} onCheckedChange={setShowLogo} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Print Frame</Label>
                  <p className="text-xs text-muted-foreground">
                    Wrap the QR code in a branded card with text.
                  </p>
                </div>
                <Switch checked={showFrame} onCheckedChange={setShowFrame} />
              </div>

              {showFrame && (
                <div className="grid gap-2 animate-in slide-in-from-top-2">
                  <Label>Frame Text</Label>
                  <Input
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    placeholder="Scan to Apply"
                    maxLength={40}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
            <CardHeader className="text-center pb-4 border-b">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                <ImageIcon className="size-5" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 gap-6">
              {/* The exportable area */}
              <div
                ref={qrRef}
                className="transition-all duration-300"
                style={{
                  padding: showFrame ? "24px 24px 32px 24px" : "16px",
                  backgroundColor: bgColor,
                  borderRadius: showFrame ? "24px" : "12px",
                  boxShadow: showFrame ? "0 20px 40px rgba(0,0,0,0.1)" : "none",
                  display: "inline-block",
                }}
              >
                <div className="flex flex-col items-center gap-6">
                  {showFrame && (
                    <div className="flex items-center gap-2 mb-2">
                      <img src="/brandlogo2.svg" alt="Logo" className="h-8" />
                      <div className="font-display font-bold text-[#0A192F] text-lg leading-tight">
                        Bhavishya
                      </div>
                    </div>
                  )}

                  <QRCodeSVG
                    value={currentQrValue}
                    size={240}
                    fgColor={fgColor}
                    bgColor="transparent"
                    level="H"
                    includeMargin={false}
                    imageSettings={
                      showLogo
                        ? {
                            src: "/brandlogo2.svg",
                            x: undefined,
                            y: undefined,
                            height: 56,
                            width: 56,
                            excavate: true,
                          }
                        : undefined
                    }
                  />

                  {showFrame && (
                    <div
                      className="font-display font-bold text-center mt-2 px-4 py-2 rounded-full w-full"
                      style={{ backgroundColor: fgColor, color: bgColor }}
                    >
                      {frameText || "Scan Here"}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full gap-2 mt-4" size="lg">
                <Download className="size-5" /> Download High-Res PNG
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics & Link Manager Section */}
      <div className="pt-10 border-t">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <Activity className="size-6 text-accent" /> Link Management & Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Track scans and instantly update the destination URLs of your printed Dynamic QR Codes.
          </p>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Shortlink (QR Content)</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead className="text-right">Total Scans</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    No dynamic links created yet.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => {
                  const baseUrl =
                    typeof window !== "undefined"
                      ? window.location.origin
                      : "https://bhavishya.up.gov.in";
                  const shortUrl = `${baseUrl}/q/${link.id}`;
                  const isEditing = editingLinkId === link.id;

                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.name}</TableCell>
                      <TableCell>
                        <a
                          href={shortUrl}
                          target="_blank"
                          className="text-accent hover:underline text-xs bg-accent/10 px-2 py-1 rounded"
                        >
                          /q/{link.id}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {isEditing ? (
                          <Input
                            value={editingTargetUrl}
                            onChange={(e) => setEditingTargetUrl(e.target.value)}
                            className="h-8 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground" title={link.targetUrl}>
                            {link.targetUrl}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {link.clicks || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {link.qrImageUrl && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                              <a
                                href={link.qrImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Download QR image"
                              >
                                <Download className="size-4 text-muted-foreground" />
                              </a>
                            </Button>
                          )}
                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateLink(link.id)}
                              className="h-8 gap-1"
                            >
                              <Save className="size-3" /> Save
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLinkId(link.id);
                                setEditingTargetUrl(link.targetUrl);
                              }}
                              className="h-8"
                            >
                              Edit Target
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteLink(link.id, link.qrImageUrl)}
                            title="Delete QR Link"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
