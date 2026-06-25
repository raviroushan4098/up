import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    // 1. Authorize Admin Token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing authentication token." },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const db = getAdminDb(); // Ensures Firebase Admin is initialized

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (authErr: any) {
      return NextResponse.json(
        { success: false, error: `Unauthorized: Invalid token. ${authErr.message}` },
        { status: 401 },
      );
    }

    // Verify caller has admin role
    const callerSnap = await db.collection("users").doc(decodedToken.uid).get();
    if (!callerSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Caller profile not found." },
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

    // 2. Fetch current config
    const mailConfigSnap = await db.collection("settings").doc("mailConfig").get();

    let recipientEmails = ["dherendrasingh112@gmail.com"];
    let senderEmail = "Uttar Pradesh Connect <onboarding@resend.dev>";

    if (mailConfigSnap.exists) {
      const data = mailConfigSnap.data();
      if (data?.recipientEmail?.trim()) {
        recipientEmails = data.recipientEmail
          .split(",")
          .map((email: string) => email.trim())
          .filter(Boolean);
      }
      if (data?.senderEmail?.trim()) {
        senderEmail = data.senderEmail.trim();
      }
    }

    // 3. Initialize Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Resend API Key is missing in server environment (.env config required).",
        },
        { status: 500 },
      );
    }

    const resend = new Resend(apiKey);

    // 4. Dispatch Test Email
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Resend API Configuration Test</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f3f4f6;
              color: #1f2937;
              margin: 0;
              padding: 20px;
            }
            .card {
              max-width: 500px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border-top: 5px solid #10b981;
            }
            .header {
              background-color: #111827;
              color: #ffffff;
              padding: 20px;
              text-align: center;
            }
            .header h2 {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
            }
            .content {
              padding: 24px;
              line-height: 1.6;
            }
            .status-badge {
              display: inline-block;
              background-color: #d1fae5;
              color: #065f46;
              font-size: 12px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 9999px;
              margin-bottom: 15px;
              text-transform: uppercase;
            }
            .meta-info {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px;
              font-size: 13px;
              font-family: monospace;
              margin-top: 15px;
            }
            .footer {
              background-color: #f9fafb;
              border-top: 1px solid #f3f4f6;
              text-align: center;
              padding: 16px;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>Resend Configuration Verified</h2>
            </div>
            <div class="content">
              <span class="status-badge">Integration Active</span>
              <p>Hello <strong>${callerData.fullName}</strong>,</p>
              <p>This is a test email confirming that your Resend API configuration is successfully connected to the <strong>Bhavishya E Uttar Pradesh Connect</strong> administration panel.</p>
              <p>The public inquiry form will now use these credentials to dispatch messages automatically to your configured inbox.</p>
              
              <div class="meta-info">
                <strong>Config Details:</strong><br>
                Recipient(s): ${recipientEmails.join(", ")}<br>
                Sender: ${senderEmail}<br>
                Triggered By: ${callerData.fullName} (${decodedToken.uid})<br>
                Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })} IST
              </div>
            </div>
            <div class="footer">
              Secure Admin System Notification &bull; Do not reply to this mail.
            </div>
          </div>
        </body>
      </html>
    `;

    const res = await resend.emails.send({
      from: senderEmail,
      to: recipientEmails,
      subject: "[UP Connect] Resend Integration test",
      html: testHtml,
    });

    return NextResponse.json({ success: true, res });
  } catch (error: any) {
    console.error("Test email sending failure:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch test email." },
      { status: 500 },
    );
  }
}
