import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

/** Helper: Generate SHA-256 hash */
const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

export async function POST(request: Request) {
  try {
    const { targetUid, action, masterPassword } = await request.json();

    if (!targetUid || !action || !masterPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    if (action !== "delete" && action !== "revert") {
      return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
    }

    // ─── Verify Authorization (Admin Token) ──────────────────────────────
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing token." },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Ensure Admin SDK is initialized by fetching database instance first
    const db = getAdminDb();

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authErr: any) {
      return NextResponse.json(
        { success: false, error: `Unauthorized: Invalid token. ${authErr.message}` },
        { status: 401 },
      );
    }

    // Verify caller is an active admin in Firestore
    const callerSnap = await db.collection("users").doc(decodedToken.uid).get();
    if (!callerSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Forbidden: User profile not found." },
        { status: 403 },
      );
    }

    const callerData = callerSnap.data();
    if (callerData?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admins only." },
        { status: 403 },
      );
    }

    // ─── Verify Master Password ──────────────────────────────────────────
    const hashedInput = hashPassword(masterPassword);

    const securityRef = db.collection("settings").doc("security");
    const securitySnap = await securityRef.get();

    let expectedHash = "";
    if (securitySnap.exists) {
      expectedHash = securitySnap.data()?.masterPasswordHash;
    }

    // If no password is set in database yet, initialize with default: "RaviMaster#@2002#@"
    if (!expectedHash) {
      const defaultPassword = "RaviMaster#@2002#@";
      expectedHash = hashPassword(defaultPassword);
      await securityRef.set({ masterPasswordHash: expectedHash });
    }

    if (hashedInput !== expectedHash) {
      return NextResponse.json(
        { success: false, error: "Invalid admin master password." },
        { status: 400 },
      );
    }

    // ─── Perform Action on User Document ─────────────────────────────────
    const userRef = db.collection("users").doc(targetUid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Target user not found." },
        { status: 404 },
      );
    }

    const userData = userSnap.data();
    const now = new Date();

    if (action === "delete") {
      const cooldownEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

      await userRef.update({
        deleted: "pending",
        deletionInitiatedAt: now.toISOString(),
        deletionScheduledAt: cooldownEnd.toISOString(),
        deletedBy: callerData.fullName,
        deletedByUid: decodedToken.uid,
      });

      // Write to audit logs
      await db.collection("audit_logs").add({
        actionType: "USER_DELETION_INITIATED",
        entityId: targetUid,
        entityName: userData?.fullName || "Unknown User",
        entityPhone: userData?.phoneNumber || "",
        previousValue: userData?.deleted || "no",
        newValue: "pending",
        performedByUid: decodedToken.uid,
        performedByName: callerData.fullName,
        performedByRole: callerData.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        description: `User ${userData?.fullName} (${targetUid}) deletion scheduled by Admin ${callerData.fullName}`,
      });
    } else if (action === "revert") {
      await userRef.update({
        deleted: "no",
        deletionInitiatedAt: admin.firestore.FieldValue.delete(),
        deletionScheduledAt: admin.firestore.FieldValue.delete(),
        deletedBy: admin.firestore.FieldValue.delete(),
        deletedByUid: admin.firestore.FieldValue.delete(),
        appealPending: admin.firestore.FieldValue.delete(),
      });

      // Write to audit logs
      await db.collection("audit_logs").add({
        actionType: "USER_DELETION_REVERTED",
        entityId: targetUid,
        entityName: userData?.fullName || "Unknown User",
        entityPhone: userData?.phoneNumber || "",
        previousValue: userData?.deleted || "pending",
        newValue: "no",
        performedByUid: decodedToken.uid,
        performedByName: callerData.fullName,
        performedByRole: callerData.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        description: `User ${userData?.fullName} (${targetUid}) deletion reverted by Admin ${callerData.fullName}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute administrative action." },
      { status: 500 },
    );
  }
}
