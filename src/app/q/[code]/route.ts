import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import * as admin from "firebase-admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection("dynamic_links").doc(code.toLowerCase());
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();

      // Fire and forget the increment counter using Admin SDK FieldValue
      docRef
        .update({
          clicks: admin.firestore.FieldValue.increment(1),
        })
        .catch((err) => console.error("Failed to increment clicks:", err));

      // Redirect to target URL
      if (data && data.targetUrl) {
        return NextResponse.redirect(data.targetUrl, 302);
      }
    }
  } catch (error) {
    console.error("Error processing dynamic link:", error);
  }

  // Fallback if code not found - renders the native Next.js 404 page
  notFound();
}
