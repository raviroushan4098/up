"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function Footer() {
  const [contact, setContact] = useState({
    office: "Loading...",
    helpline: "Loading...",
    email: "Loading...",
    whatsapp: "Loading...",
  });

  useEffect(() => {
    const fetchCMS = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "landingPage"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.contact) {
            setContact(data.contact);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCMS();
  }, []);
  return (
    <footer className="mt-24 border-t bg-gradient-navy text-primary-foreground">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-white overflow-hidden grid place-items-center">
              <img src="/brandlogo2.svg" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <div className="font-display font-bold">Bhavishya E Uttar Pradesh</div>
              <div className="text-xs opacity-70"> Uttar Pradesh</div>
            </div>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            विकसित भारत की सीढ़ी आज की युवा पीढ़ी Official registration platform for Uttar Pradesh
            initiatives.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-accent-glow">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-90">
            <li>
              <Link href="/" className="hover:text-accent transition-base">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-accent transition-base">
                About
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-accent transition-base">
                Events
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-accent transition-base">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-accent transition-base">
                User Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-accent-glow">Contact</h4>
          <ul className="space-y-3 text-sm opacity-90">
            <li className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 shrink-0" /> {contact.office}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> {contact.helpline}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> {contact.email}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-accent-glow">Follow</h4>
          <div className="flex gap-3">
            {[
              { Icon: Instagram, href: "https://www.instagram.com/bhavishya_e_uttarpradesh" },
              { Icon: Youtube, href: "https://youtube.com/@bhavishya-e-uttarpradesh" },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="size-10 grid place-items-center rounded-full bg-white/10 hover:bg-accent hover:text-primary transition-base"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
          <p className="text-xs opacity-70 mt-6 leading-relaxed"></p>
        </div>
      </div>

      <div className="h-0.5 bg-gradient-tricolor" />
      <div className="container mx-auto px-4 py-5 text-xs flex flex-col md:flex-row items-center justify-between gap-3 opacity-80">
        <span>© 2026 Uttar Pradesh · All rights reserved</span>
        <span>Designed in भारत — Made with care for the youth of UP</span>
      </div>
    </footer>
  );
}
