"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { notFound, useParams } from "next/navigation";
import { EventApplication, UPEvent } from "@/types/events";
import QRCode from "react-qr-code";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";

export default function DigitalPassPage() {
  const params = useParams();
  const passId = params.passId as string;
  const { profile, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<EventApplication | null>(null);
  const [eventTitle, setEventTitle] = useState("UP CONNECT EVENT");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    "https://via.placeholder.com/300x400.png?text=NO+PHOTO",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!passId) return;
      try {
        const q = query(collection(db, "applications"), where("passId", "==", passId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          notFound();
          return;
        }

        const appData = snapshot.docs[0].data() as EventApplication;
        setApplication(appData);

        if (appData.eventId) {
          try {
            const eventDoc = await getDoc(doc(db, "events", appData.eventId));
            if (eventDoc.exists()) {
              setEventTitle(eventDoc.data().title || "UP CONNECT EVENT");
            }
          } catch (e) {
            console.error("Failed to fetch event title", e);
          }
        }

        if (appData.userId) {
          const userDoc = await getDoc(doc(db, "users", appData.userId));
          if (userDoc.exists() && userDoc.data().profilePhotoUrl) {
            setProfilePhotoUrl(userDoc.data().profilePhotoUrl);
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && profile && (profile.role === "admin" || profile.role === "manager")) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [passId, profile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <AlertCircle className="size-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground font-medium">
            You are not authorised to verify or view digital passes.
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return null; // Will be handled by notFound() above
  }

  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://bhavishyaeuttarpradesh.in"}/dashboard/admin/verify/${passId}`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
            --saffron: #FF6B00;
            --deep-red: #B91C1C;
            --crimson: #DC2626;
            --gold: #D97706;
            --gold-light: #FCD34D;
            --india-green: #15803D;
            --navy: #1E3A8A;
            --navy-dark: #0F2460;
            --cream: #FFFBF5;
            --card-w: 340px;
            --card-h: 560px;
        }

        .pass-container * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .pass-container {
            font-family: 'DM Sans', sans-serif;
            background: #0A0A0A;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            background-image:
                radial-gradient(ellipse at 20% 30%, rgba(185, 28, 28, 0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 70%, rgba(255, 107, 0, 0.1) 0%, transparent 60%);
        }

        /* ── CARD SHELL ── */
        .card {
            width: var(--card-w);
            height: var(--card-h);
            border-radius: 22px;
            overflow: hidden;
            position: relative;
            background: #fff;
            box-shadow:
                0 0 0 1px rgba(255, 107, 0, 0.3),
                0 30px 80px rgba(0, 0, 0, 0.8),
                0 0 60px rgba(185, 28, 28, 0.2);
            animation: floatIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes floatIn {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.96);
            }
            to {
                opacity: 1;
                transform: none;
            }
        }

        /* ── HEADER BAND ── */
        .header {
            height: 130px;
            background: linear-gradient(135deg, #7f0000 0%, #B91C1C 40%, #FF6B00 100%);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            padding: 0 20px 14px;
        }

        .header::before {
            content: '';
            position: absolute;
            width: 220px;
            height: 220px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.08);
            top: -80px;
            right: -60px;
        }

        .header::after {
            content: '';
            position: absolute;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.08);
            top: -30px;
            right: -10px;
        }

        .ashoka-wheel {
            position: absolute;
            top: 12px;
            right: 18px;
            width: 52px;
            height: 52px;
            opacity: 0.18;
        }

        .org-logo {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-right: 12px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .org-logo img {
            width: 28px;
            height: 28px;
            object-fit: contain;
        }

        .header-text {
            flex: 1;
        }

        .org-hindi {
            font-family: 'Noto Sans Devanagari', sans-serif;
            font-size: 13px;
            font-weight: 700;
            color: #fff;
            line-height: 1.2;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }

        .org-eng {
            font-size: 9px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.75);
            letter-spacing: 0.04em;
            margin-top: 2px;
        }

        /* tricolor stripe */
        .tricolor {
            width: 100%;
            height: 4px;
            display: flex;
        }

        .tricolor span {
            flex: 1;
        }

        .tricolor .s {
            background: #FF9933;
        }

        .tricolor .w {
            background: #FFFFFF;
        }

        .tricolor .g {
            background: #138808;
        }

        /* ── EVENT TITLE BAND ── */
        .event-band {
            background: var(--cream);
            padding: 14px 20px 12px;
            text-align: center;
            position: relative;
            border-bottom: 1px solid rgba(185, 28, 28, 0.12);
        }

        .presents-tag {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.3em;
            color: var(--gold);
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .event-title {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 900;
            color: var(--deep-red);
            line-height: 1.05;
            letter-spacing: -0.01em;
        }

        .event-sub {
            font-size: 8.5px;
            font-weight: 500;
            color: var(--crimson);
            margin-top: 5px;
            letter-spacing: 0.02em;
        }

        /* ── PHOTO + BADGE AREA ── */
        .badge-area {
            background: var(--cream);
            padding: 16px 20px;
            display: flex;
            gap: 14px;
            align-items: flex-start;
            border-bottom: 1px dashed rgba(185, 28, 28, 0.2);
        }

        .photo-frame {
            flex-shrink: 0;
            position: relative;
        }

        .photo-box {
            width: 88px;
            height: 104px;
            border-radius: 10px;
            background: linear-gradient(135deg, #e5e7eb, #d1d5db);
            border: 2.5px solid var(--navy);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-align: center;
        }

        .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .role-pill {
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, var(--saffron), var(--india-green));
            color: white;
            font-size: 7.5px;
            font-weight: 700;
            letter-spacing: 0.1em;
            padding: 3px 10px;
            border-radius: 999px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .participant-info {
            flex: 1;
            padding-top: 2px;
        }

        .p-name {
            font-family: 'Playfair Display', serif;
            font-size: 17px;
            font-weight: 700;
            color: var(--navy-dark);
            line-height: 1.15;
            margin-bottom: 4px;
        }

        .p-id {
            font-size: 10.5px;
            font-weight: 700;
            color: var(--crimson);
            letter-spacing: 0.04em;
            margin-bottom: 14px;
            text-transform: uppercase;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }

        .info-cell {
            background: white;
            border-radius: 6px;
            padding: 5px 8px;
            border: 1px solid rgba(185, 28, 28, 0.1);
        }

        .info-cell .lbl {
            font-size: 7.5px;
            font-weight: 600;
            letter-spacing: 0.08em;
            color: #9ca3af;
            text-transform: uppercase;
        }

        .info-cell .val {
            font-size: 10px;
            font-weight: 700;
            color: #1f2937;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* ── BOTTOM BAND ── */
        .bottom-band {
            background: var(--cream);
            padding: 20px 20px 16px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
        }

        .qr-section {
            text-align: center;
        }

        .qr-box {
            width: 72px;
            height: 72px;
            border: 2px solid var(--navy);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            padding: 4px;
        }

        .qr-box svg {
            width: 100%;
            height: 100%;
        }

        .qr-label {
            font-size: 8px;
            font-weight: 600;
            color: #6b7280;
            letter-spacing: 0.06em;
            margin-top: 5px;
        }

        .sig-section {
            text-align: center;
        }

        .sig-line {
            width: 110px;
            height: 1px;
            background: #1f2937;
            margin-bottom: 5px;
        }

        .sig-name {
            font-size: 8.5px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: 0.03em;
        }

        .sig-title {
            font-size: 8px;
            color: #6b7280;
            margin-top: 2px;
        }

        /* ── HOLOGRAPHIC STRIP ── */
        .holo-strip {
            height: 14px;
            background: linear-gradient(90deg,
                    #FF9933 0%, #FF9933 33.3%,
                    #ffffff 33.3%, #ffffff 66.6%,
                    #138808 66.6%, #138808 100%);
            position: relative;
            overflow: hidden;
        }

        .holo-strip::after {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(-45deg,
                    transparent,
                    transparent 4px,
                    rgba(255, 255, 255, 0.15) 4px,
                    rgba(255, 255, 255, 0.15) 8px);
        }

        /* ── FOOTER ── */
        .card-footer {
            background: linear-gradient(90deg, #7f0000, #B91C1C, #7f0000);
            padding: 9px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-url {
            font-size: 8.5px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.85);
            letter-spacing: 0.03em;
        }

        .footer-tag {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.12em;
            color: var(--gold-light);
            text-transform: uppercase;
        }

        /* ── PRINT HINT ── */
        .print-hint {
            margin-top: 28px;
            text-align: center;
            color: rgba(255, 255, 255, 0.25);
            font-size: 11px;
            letter-spacing: 0.05em;
        }
      `,
        }}
      />

      <div className="pass-container">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="card">
            {/* HEADER */}
            <div className="header">
              {/* Ashoka Chakra decorative */}
              <svg
                className="ashoka-wheel"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="3" />
                <circle cx="50" cy="50" r="8" fill="white" />
                <g stroke="white" strokeWidth="1.5">
                  <line x1="50" y1="4" x2="50" y2="96" />
                  <line x1="4" y1="50" x2="96" y2="50" />
                  <line x1="18.6" y1="18.6" x2="81.4" y2="81.4" />
                  <line x1="81.4" y1="18.6" x2="18.6" y2="81.4" />
                  <line x1="8.6" y1="34.5" x2="91.4" y2="65.5" />
                  <line x1="91.4" y1="34.5" x2="8.6" y2="65.5" />
                  <line x1="34.5" y1="8.6" x2="65.5" y2="91.4" />
                  <line x1="65.5" y1="8.6" x2="34.5" y2="91.4" />
                  <line x1="13.4" y1="24" x2="86.6" y2="76" />
                  <line x1="86.6" y1="24" x2="13.4" y2="76" />
                  <line x1="24" y1="13.4" x2="76" y2="86.6" />
                  <line x1="76" y1="13.4" x2="24" y2="86.6" />
                </g>
              </svg>

              <div className="org-logo">
                <img src="/brandlogo2.svg" alt="UP" />
              </div>

              <div className="header-text">
                <div className="org-hindi">भविष्य-ए-उत्तर प्रदेश</div>
                <div className="org-eng">Empowering Youth • Building Viksit Bharat 2047</div>
              </div>
            </div>

            {/* TRICOLOR */}
            <div className="tricolor">
              <span className="s"></span>
              <span className="w"></span>
              <span className="g"></span>
            </div>

            {/* EVENT TITLE */}
            <div className="event-band">
              <div className="presents-tag">✦ Presents ✦</div>
              <div className="event-title">
                {eventTitle ? eventTitle.toUpperCase() : "FUTURE LEADERS CONCLAVE 2026"}
              </div>
              <div className="event-sub">
                (Viksit Uttar Pradesh: The Growth Engine of Viksit Bharat @2047)
              </div>
            </div>

            {/* BADGE AREA */}
            <div className="badge-area">
              <div className="photo-frame">
                <div className="photo-box">
                  <img src={profilePhotoUrl} alt="Participant" />
                </div>
                <div className="role-pill">
                  {application.schoolCollegeName ? "STUDENT" : "PARTICIPANT"}
                </div>
              </div>

              <div className="participant-info">
                <div className="p-name">{application.applicantName}</div>
                <div className="p-id">{passId}</div>
                <div className="info-grid">
                  <div className="info-cell">
                    <div className="lbl">District</div>
                    <div className="val">{application.applicantDistrict || "Uttar Pradesh"}</div>
                  </div>
                  <div className="info-cell">
                    <div className="lbl">Mobile</div>
                    <div className="val">{application.applicantPhone || "Verified"}</div>
                  </div>
                  <div className="info-cell">
                    <div className="lbl">Status</div>
                    <div className="val" style={{ color: "var(--india-green)" }}>
                      ✔ Verified
                    </div>
                  </div>
                  <div className="info-cell">
                    <div className="lbl">Category</div>
                    <div className="val truncate">
                      {application.schoolCollegeName ? "Student" : "Participant"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM */}
            <div className="bottom-band">
              <div className="qr-section">
                <div className="qr-box">
                  <QRCode
                    value={verifyUrl}
                    size={64}
                    bgColor={"#ffffff"}
                    fgColor={"#1E3A8A"}
                    level={"M"}
                  />
                </div>
                <div className="qr-label">SCAN TO VERIFY</div>
              </div>

              <div
                className="sigs-wrapper"
                style={{ display: "flex", gap: "16px", textAlign: "center" }}
              >
                <div className="sig-section">
                  <img
                    src="/1.png"
                    alt="Director Signature"
                    style={{
                      height: "24px",
                      objectFit: "contain",
                      margin: "0 auto 4px",
                      display: "block",
                    }}
                  />
                  <div className="sig-line" style={{ width: "80px", margin: "0 auto 4px" }}></div>
                  <div className="sig-name">Program Director</div>
                </div>
                <div className="sig-section">
                  <img
                    src="/2.png"
                    alt="General Secretary Signature"
                    style={{
                      height: "24px",
                      objectFit: "contain",
                      margin: "0 auto 4px",
                      display: "block",
                    }}
                  />
                  <div className="sig-line" style={{ width: "80px", margin: "0 auto 4px" }}></div>
                  <div className="sig-name">General Secretary</div>
                </div>
              </div>
            </div>

            {/* HOLO STRIP */}
            <div className="holo-strip"></div>

            {/* FOOTER */}
            <div className="card-footer">
              <div className="footer-url">www.bhavishyaeuttarpradesh.in</div>
              <div className="footer-tag">Official Credential</div>
            </div>
          </div>

          <div className="print-hint">
            ⌘ + P to print &nbsp;•&nbsp; Set paper size to A6 or custom 340×560px
          </div>
        </div>
      </div>
    </>
  );
}
