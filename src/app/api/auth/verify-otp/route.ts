import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase-admin";

/** Helper: Sanitize email to key safe format */
const sanitizeEmailKey = (email: string): string => {
  return email.toLowerCase().replace(/[^a-z0-9@_.-]/g, "_");
};

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP code are required." },
        { status: 400 },
      );
    }

    if (!isAdminConfigured()) {
      return NextResponse.json(
        { success: false, error: "Firebase Admin credentials are not configured." },
        { status: 500 },
      );
    }

    const db = getAdminDb();
    const emailKey = sanitizeEmailKey(email);
    const otpDocRef = db.collection("email_login_otps").doc(emailKey);
    const otpSnap = await otpDocRef.get();

    if (!otpSnap.exists) {
      return NextResponse.json(
        { success: false, error: "No active verification code found for this email." },
        { status: 400 },
      );
    }

    const data = otpSnap.data();
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Failed to read verification details." },
        { status: 500 },
      );
    }

    // Check expiration
    const expiresAtMs = data.expiresAt.toMillis();
    if (Date.now() > expiresAtMs) {
      await otpDocRef.delete();
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Verify OTP
    if (data.otp !== otp.trim()) {
      const attempts = (data.attempts || 0) + 1;
      if (attempts >= 3) {
        await otpDocRef.delete();
        return NextResponse.json(
          {
            success: false,
            error: "Too many incorrect attempts. This code has been invalidated.",
          },
          { status: 400 },
        );
      } else {
        await otpDocRef.update({ attempts });
        return NextResponse.json(
          {
            success: false,
            error: `Invalid verification code. ${3 - attempts} attempt(s) remaining.`,
          },
          { status: 400 },
        );
      }
    }

    // OTP is correct! Clear it immediately (single-use constraint)
    await otpDocRef.delete();

    let uid = "";

    // ─── Query Existing User Profile by Email ────────────────────────────
    const usersCollection = db.collection("users");
    const userQuerySnap = await usersCollection
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (!userQuerySnap.empty) {
      // User already exists! Resolve their exact existing UID to keep all data intact
      uid = userQuerySnap.docs[0].id;
    } else {
      // User is not registered or onboarded. Let's check Firebase Auth by email
      try {
        const authUser = await admin.auth().getUserByEmail(email.toLowerCase());
        uid = authUser.uid;
      } catch (authError: any) {
        if (authError.code === "auth/user-not-found") {
          // Create new user in Firebase Auth
          const newAuthUser = await admin.auth().createUser({
            email: email.toLowerCase(),
            emailVerified: true,
          });
          uid = newAuthUser.uid;
        } else {
          throw authError;
        }
      }

      // Initialize their default profile skeleton in Firestore
      const userRef = usersCollection.doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        const newProfile = {
          uid: uid,
          email: email.toLowerCase(),
          fullName: email.split("@")[0],
          role: "user",
          createdAt: new Date().toISOString(),
          onboarded: false,
        };
        await userRef.set(newProfile);

        // Increment user counter
        await db
          .collection("counters")
          .doc("users")
          .set({ count: admin.firestore.FieldValue.increment(1) }, { merge: true });
      }
    }

    // ─── Generate Custom Firebase Auth Token ─────────────────────────────
    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({
      success: true,
      customToken,
    });
  } catch (error: any) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify code." },
      { status: 500 },
    );
  }
}
