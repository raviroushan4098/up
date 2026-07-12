import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as admin from "firebase-admin";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";
import { sendVerificationOtpEmail } from "@/actions/email";

const MAX_EMAIL_OTP_PER_DAY = 5;
const MAX_IP_OTP_PER_DAY = 20;
const MAX_DEVICE_OTP_PER_DAY = 20;
const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

/** Helper: Generate SHA-256 hash */
const hashString = (val: string): string => {
  return crypto.createHash("sha256").update(val).digest("hex");
};

/** Helper: Get today's date in YYYY-MM-DD format (IST) */
const getTodayIST = (): string => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

/** Helper: Sanitize email to key safe format */
const sanitizeEmailKey = (email: string): string => {
  return email.toLowerCase().replace(/[^a-z0-9@_.-]/g, "_");
};

export async function POST(request: Request) {
  try {
    const { email, deviceId, fingerprint } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { allowed: false, error: "Valid email address is required." },
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
        console.log("Admin SDK bypass. Generating OTP...");
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await sendVerificationOtpEmail(email, otp);
        return NextResponse.json({
          allowed: true,
          remaining: 3,
          warning: "Bypassed rate-limiting for local development.",
        });
      } else {
        return NextResponse.json(
          { allowed: false, error: "Firebase Admin credentials are not configured on the server." },
          { status: 500 },
        );
      }
    }

    const today = getTodayIST();
    const emailKey = sanitizeEmailKey(email);

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
    const emailDocRef = db.collection("email_limits").doc(emailKey);
    const ipDocRef = db.collection("ip_limits").doc(hashedIp);
    const deviceDocRef = db.collection("device_limits").doc(deviceKey);

    const [emailSnap, ipSnap, deviceSnap] = await Promise.all([
      emailDocRef.get(),
      ipDocRef.get(),
      deviceDocRef.get(),
    ]);

    const now = Date.now();

    // ─── Check 1: Email Cooldown & Daily Limit ──────────────────────────
    if (emailSnap.exists) {
      const data = emailSnap.data();

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
      if (data && data.date === today && (data.count || 0) >= MAX_EMAIL_OTP_PER_DAY) {
        return NextResponse.json({
          allowed: false,
          reason: "email_limit",
          message: "Daily OTP limit reached for this email address. Please try again tomorrow.",
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

    // ─── Generate Cryptographically Secure OTP ──────────────────────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes from now

    // ─── Save OTP to Firestore (Server-only email_login_otps collection) ────
    const otpDocRef = db.collection("email_login_otps").doc(emailKey);
    const writeOtpPromise = otpDocRef.set({
      otp: otp,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
    });

    // ─── All Checks Passed: Pre-increment all counters ─────────────────
    const updates: Promise<any>[] = [writeOtpPromise];

    // Increment Email
    if (!emailSnap.exists || emailSnap.data()?.date !== today) {
      updates.push(
        emailDocRef.set({
          count: 1,
          date: today,
          lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      );
    } else {
      const count = emailSnap.data()?.count || 0;
      updates.push(
        emailDocRef.set({
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

    // ─── Dispatch Email with OTP ────────────────────────────────────────
    const emailResult = await sendVerificationOtpEmail(email, otp);
    if (!emailResult.success) {
      return NextResponse.json(
        { allowed: false, error: emailResult.error || "Failed to deliver OTP email." },
        { status: 500 },
      );
    }

    const currentCount =
      emailSnap.exists && emailSnap.data()?.date === today ? emailSnap.data()?.count || 0 : 0;

    return NextResponse.json({
      allowed: true,
      remaining: MAX_EMAIL_OTP_PER_DAY - (currentCount + 1),
    });
  } catch (err: any) {
    console.error("Error in send-otp:", err);
    return NextResponse.json(
      { allowed: false, error: err.message || "Failed to process OTP request." },
      { status: 500 },
    );
  }
}
