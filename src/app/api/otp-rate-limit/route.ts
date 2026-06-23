import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as admin from "firebase-admin";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";

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

    const headersList = await headers();

    // ─── App Check Token Verification (Production Only) ─────────────────
    if (process.env.NODE_ENV !== "development") {
      const appCheckToken = headersList.get("x-firebase-appcheck");
      if (!appCheckToken) {
        return NextResponse.json(
          { allowed: false, error: "Unauthorized: Missing App Check token." },
          { status: 401 },
        );
      }

      try {
        const JWKS = createRemoteJWKSet(new URL("https://firebaseappcheck.googleapis.com/v1/jwks"));
        const projectNumber = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!projectNumber || !projectId) {
          throw new Error("Missing Firebase environment variables configuration.");
        }

        await jwtVerify(appCheckToken, JWKS, {
          issuer: `https://firebaseappcheck.googleapis.com/${projectNumber}`,
          audience: [`projects/${projectNumber}`, `projects/${projectId}`],
        });
      } catch (error: any) {
        return NextResponse.json(
          { allowed: false, error: `Unauthorized: Invalid App Check token. ${error.message}` },
          { status: 401 },
        );
      }
    }

    // ─── Check Firebase Admin Configuration ──────────────────────────────
    if (!isAdminConfigured()) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          allowed: true,
          remaining: 3,
          warning:
            "Firebase Admin SDK is not configured. Rate limiting is bypassed in development mode.",
        });
      } else {
        return NextResponse.json(
          { allowed: false, error: "Firebase Admin credentials are not configured on the server." },
          { status: 500 },
        );
      }
    }

    const today = getTodayIST();
    const phoneKey = sanitizePhone(phone);

    // ─── Get Client IP ──────────────────────────────────────────────────
    const rawIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
    const ip = rawIp.split(",")[0].trim();
    const hashedIp = hashString(ip);

    // ─── Generate Device Key ────────────────────────────────────────────
    const deviceKey = deviceId
      ? deviceId.replace(/[^a-zA-Z0-9-_]/g, "")
      : hashString(fingerprint || "unknown");

    // ─── Fetch Documents Concurrently ───────────────────────────────────
    const db = getAdminDb();
    const phoneDocRef = db.collection("otp_limits").doc(phoneKey);
    const ipDocRef = db.collection("ip_limits").doc(hashedIp);
    const deviceDocRef = db.collection("device_limits").doc(deviceKey);

    const [phoneSnap, ipSnap, deviceSnap] = await Promise.all([
      phoneDocRef.get(),
      ipDocRef.get(),
      deviceDocRef.get(),
    ]);

    const now = Date.now();

    // ─── Check 1: Phone Cooldown & Daily Limit ──────────────────────────
    if (phoneSnap.exists) {
      const data = phoneSnap.data();

      // Check Cooldown first (always check 2-minute gap)
      if (data && data.lastSentAt && data.lastSentAt.toMillis) {
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
      if (data && data.date === today && (data.count || 0) >= MAX_PHONE_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "phone_limit",
          message: "Daily OTP limit reached for this phone number. Please try again tomorrow.",
        });
      }
    }

    // ─── Check 2: IP Daily Limit ────────────────────────────────────────
    if (ipSnap.exists) {
      const data = ipSnap.data();
      if (data && data.date === today && (data.count || 0) >= MAX_IP_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "ip_limit",
          message: "Too many requests from this network. Please try again tomorrow.",
        });
      }
    }

    // ─── Check 3: Device Daily Limit ────────────────────────────────────
    if (deviceSnap.exists) {
      const data = deviceSnap.data();
      if (data && data.date === today && (data.count || 0) >= MAX_DEVICE_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "device_limit",
          message: "Too many requests from this device. Please try again tomorrow.",
        });
      }
    }

    // ─── All Checks Passed: Pre-increment all counters ─────────────────
    const updates: Promise<any>[] = [];

    // Increment Phone
    if (!phoneSnap.exists || phoneSnap.data()?.date !== today) {
      updates.push(
        phoneDocRef.set({
          count: 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    } else {
      const count = phoneSnap.data()?.count || 0;
      updates.push(
        phoneDocRef.set({
          count: count + 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    }

    // Increment IP
    if (!ipSnap.exists || ipSnap.data()?.date !== today) {
      updates.push(
        ipDocRef.set({
          count: 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    } else {
      const count = ipSnap.data()?.count || 0;
      updates.push(
        ipDocRef.set({
          count: count + 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    }

    // Increment Device
    if (!deviceSnap.exists || deviceSnap.data()?.date !== today) {
      updates.push(
        deviceDocRef.set({
          count: 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    } else {
      const count = deviceSnap.data()?.count || 0;
      updates.push(
        deviceDocRef.set({
          count: count + 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    }

    await Promise.all(updates);

    const currentCount =
      phoneSnap.exists && phoneSnap.data()?.date === today ? phoneSnap.data()?.count || 0 : 0;

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
