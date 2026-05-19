import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({ meta: [{ title: "Contact — Bhavishya UP" }, { name: "description", content: "Get in touch with the Bhavishya Uttar Pradesh helpline and support team." }] }),
});

function ContactPage() {
  return (
    <PublicLayout>
      <section className="bg-gradient-soft py-14">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="outline" className="mb-3">Contact</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primary">We're here to <span className="text-gradient-saffron">help</span></h1>
          <p className="mt-4 text-muted-foreground">Reach out anytime — our helpline operates 7am to 9pm, every day.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-4">
          {[
            { i: Phone, t: "Helpline (Toll Free)", d: "1800-180-5555" },
            { i: Mail, t: "Email Support", d: "support@bhavishyaup.gov.in" },
            { i: MapPin, t: "Office", d: "Yojana Bhawan, Lucknow, UP 226001" },
            { i: MessageCircle, t: "WhatsApp", d: "+91 90000 90000" },
          ].map((c, i) => (
            <Card key={i} className="border-0 shadow-card hover:shadow-elegant transition-base">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-gradient-saffron grid place-items-center shrink-0"><c.i className="size-5 text-primary" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">{c.t}</div>
                  <div className="font-semibold text-primary">{c.d}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="rounded-2xl overflow-hidden shadow-card aspect-video">
            <iframe title="Lucknow Map" src="https://www.openstreetmap.org/export/embed.html?bbox=80.85%2C26.78%2C80.99%2C26.89&amp;layer=mapnik" className="w-full h-full border-0" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-3">
          <Card className="border-0 shadow-elegant">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-display font-bold text-2xl text-primary">Send us a message</h2>
              <p className="text-sm text-muted-foreground mt-1">We respond within 24 hours.</p>
              <form
                onSubmit={(e) => { e.preventDefault(); toast.success("Message sent! We'll reply within 24 hours."); (e.target as HTMLFormElement).reset(); }}
                className="mt-6 grid sm:grid-cols-2 gap-4"
              >
                <div className="space-y-1.5"><Label>Full Name</Label><Input required placeholder="Aarav Sharma" /></div>
                <div className="space-y-1.5"><Label>Mobile</Label><Input required type="tel" placeholder="+91 90000 00000" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input required type="email" placeholder="you@email.com" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Subject</Label><Input required placeholder="How can we help?" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label><Textarea required rows={5} placeholder="Type your message..." /></div>
                <div className="sm:col-span-2"><Button type="submit" size="lg" className="w-full bg-gradient-saffron text-primary font-semibold">Send Message <Send className="size-4 ml-2" /></Button></div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
