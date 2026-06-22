import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MAX_PHONE_OTP_PER_DAY = 3;
const MAX_IP_OTP_PER_DAY = 6;
const MAX_DEVICE_OTP_PER_DAY = 6;
const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

/** Helper: Generate SHA-256 hash */
const hashString = (val: string): string => {
  return crypto.createHash("sha256").update(val).digest("hex");
};

/** Helper: Get today's date in YYYY-MM-DD format (IST) */
const getTodayIST = (): string => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

/** Helper: Sanitize phone to digits only */
const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

export async function POST(request: Request) {
  try {
    const { phone, deviceId, fingerprint } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { allowed: false, error: "Phone number is required." },
        { status: 400 },
      );
    }

    const today = getTodayIST();
    const phoneKey = sanitizePhone(phone);

    // ─── Get Client IP ──────────────────────────────────────────────────
    const headersList = await headers();
    const rawIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
    const ip = rawIp.split(",")[0].trim();
    const hashedIp = hashString(ip);

    // ─── Generate Device Key ────────────────────────────────────────────
    const deviceKey = deviceId
      ? deviceId.replace(/[^a-zA-Z0-9-_]/g, "")
      : hashString(fingerprint || "unknown");

    // ─── Fetch Documents Concurrently ───────────────────────────────────
    const phoneDocRef = doc(db, "otp_limits", phoneKey);
    const ipDocRef = doc(db, "ip_limits", hashedIp);
    const deviceDocRef = doc(db, "device_limits", deviceKey);

    const [phoneSnap, ipSnap, deviceSnap] = await Promise.all([
      getDoc(phoneDocRef),
      getDoc(ipDocRef),
      getDoc(deviceDocRef),
    ]);

    const now = Date.now();

    // ─── Check 1: Phone Cooldown & Daily Limit ──────────────────────────
    if (phoneSnap.exists()) {
      const data = phoneSnap.data();

      // Check Cooldown first (always check 2-minute gap)
      if (data.lastSentAt?.toMillis) {
        const elapsed = now - data.lastSentAt.toMillis();
        if (elapsed < OTP_COOLDOWN_MS) {
          const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
          return NextResponse.json({
            allowed: false,
            reason: "cooldown",
            waitSeconds,
            message: `Please wait ${waitSeconds}s before requesting another OTP.`,
          });
        }
      }

      // Check daily limit if date is same
      if (data.date === today && (data.count || 0) >= MAX_PHONE_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "phone_limit",
          message: "Daily OTP limit reached for this phone number. Please try again tomorrow.",
        });
      }
    }

    // ─── Check 2: IP Daily Limit ────────────────────────────────────────
    if (ipSnap.exists()) {
      const data = ipSnap.data();
      if (data.date === today && (data.count || 0) >= MAX_IP_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "ip_limit",
          message: "Too many requests from this network. Please try again tomorrow.",
        });
      }
    }

    // ─── Check 3: Device Daily Limit ────────────────────────────────────
    if (deviceSnap.exists()) {
      const data = deviceSnap.data();
      if (data.date === today && (data.count || 0) >= MAX_DEVICE_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "device_limit",
          message: "Too many requests from this device. Please try again tomorrow.",
        });
      }
    }

    // ─── All Checks Passed: Pre-increment all counters ─────────────────
    const updates: Promise<void>[] = [];

    // Increment Phone
    if (!phoneSnap.exists() || phoneSnap.data()?.date !== today) {
      updates.push(setDoc(phoneDocRef, { count: 1, date: today, lastSentAt: serverTimestamp() }));
    } else {
      const count = phoneSnap.data()?.count || 0;
      updates.push(
        setDoc(phoneDocRef, { count: count + 1, date: today, lastSentAt: serverTimestamp() }),
      );
    }

    // Increment IP
    if (!ipSnap.exists() || ipSnap.data()?.date !== today) {
      updates.push(setDoc(ipDocRef, { count: 1, date: today, lastSentAt: serverTimestamp() }));
    } else {
      const count = ipSnap.data()?.count || 0;
      updates.push(
        setDoc(ipDocRef, { count: count + 1, date: today, lastSentAt: serverTimestamp() }),
      );
    }

    // Increment Device
    if (!deviceSnap.exists() || deviceSnap.data()?.date !== today) {
      updates.push(setDoc(deviceDocRef, { count: 1, date: today, lastSentAt: serverTimestamp() }));
    } else {
      const count = deviceSnap.data()?.count || 0;
      updates.push(
        setDoc(deviceDocRef, { count: count + 1, date: today, lastSentAt: serverTimestamp() }),
      );
    }

    await Promise.all(updates);

    const currentCount =
      phoneSnap.exists() && phoneSnap.data()?.date === today ? phoneSnap.data()?.count || 0 : 0;

    return NextResponse.json({
      allowed: true,
      remaining: MAX_PHONE_OTP_PER_DAY - (currentCount + 1),
    });
  } catch (err: any) {
    return NextResponse.json(
      { allowed: false, error: err.message || "Failed to process rate limit." },
      { status: 500 },
    );
  }
}
