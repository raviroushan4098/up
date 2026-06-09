import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const linkRef = doc(db, "dynamic_links", code);
    const linkSnap = await getDoc(linkRef);

    if (linkSnap.exists()) {
      const data = linkSnap.data();

      // Fire and forget the increment counter
      updateDoc(linkRef, {
        clicks: increment(1),
      }).catch((err) => console.error("Failed to increment clicks:", err));

      // Redirect to target URL
      return NextResponse.redirect(data.targetUrl, 302);
    }
  } catch (error) {
    console.error("Error processing dynamic link:", error);
  }

  // Fallback if code not found
  return NextResponse.redirect(new URL("/not-found", request.url));
}
