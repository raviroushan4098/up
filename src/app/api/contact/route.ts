import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { name, email, subject, phone, message, num1, num2, mathAnswer } = await request.json();

    // 1. Basic validation
    if (!name || !email || !subject || !phone || !message) {
      return NextResponse.json(
        { success: false, error: "All inquiry fields are required." },
        { status: 400 },
      );
    }

    // 2. Spam protection: verify math challenge
    const parsedNum1 = Number(num1);
    const parsedNum2 = Number(num2);
    const parsedAnswer = Number(mathAnswer);

    if (
      isNaN(parsedNum1) ||
      isNaN(parsedNum2) ||
      isNaN(parsedAnswer) ||
      parsedNum1 + parsedNum2 !== parsedAnswer
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification challenge failed. Please solve the math question correctly.",
        },
        { status: 400 },
      );
    }

    // 2. Fetch email configuration from Firestore
    const db = getAdminDb();
    const mailConfigSnap = await db.collection("settings").doc("mailConfig").get();

    let recipientEmails = ["dherendrasingh112@gmail.com"]; // Default fallback recipient
    let senderEmail = "Uttar Pradesh Connect <onboarding@resend.dev>"; // Default fallback sender

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

    // 3. Check for Resend API Key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not defined in environment variables.");
      return NextResponse.json(
        {
          success: false,
          error: "Mail service configuration error (RESEND_API_KEY is missing on the server).",
        },
        { status: 500 },
      );
    }

    // 4. Initialize Resend
    const resend = new Resend(apiKey);

    // 5. Send the email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Inquiry</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #faf7f5;
              color: #333333;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              border-top: 4px solid #C84B31;
            }
            .header {
              background-color: #632020;
              color: #ffffff;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 30px;
            }
            .field-row {
              margin-bottom: 20px;
              border-bottom: 1px solid #f0e6e0;
              padding-bottom: 15px;
            }
            .field-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
              margin-bottom: 0;
            }
            .field-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: #a08070;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .field-value {
              font-size: 15px;
              color: #1a1a1a;
              line-height: 1.5;
            }
            .message-box {
              background-color: #fcfbfa;
              border: 1px solid #f0e6e0;
              border-radius: 8px;
              padding: 16px;
              font-style: italic;
              white-space: pre-wrap;
              color: #4a4a4a;
            }
            .footer {
              padding: 20px 30px;
              background-color: #f7f3f0;
              text-align: center;
              font-size: 12px;
              color: #8c7c72;
              border-top: 1px solid #ede5df;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Visitor Inquiry Received</h1>
            </div>
            <div class="content">
              <div class="field-row">
                <div class="field-label">Subject</div>
                <div class="field-value" style="font-weight: 600; color: #C84B31;">${subject}</div>
              </div>
              
              <div class="field-row">
                <div class="field-label">Sender Name</div>
                <div class="field-value">${name}</div>
              </div>

              <div class="field-row">
                <div class="field-label">Email Address</div>
                <div class="field-value"><a href="mailto:${email}" style="color: #c2452b; text-decoration: none;">${email}</a></div>
              </div>

              <div class="field-row">
                <div class="field-label">Phone Number</div>
                <div class="field-value">${phone}</div>
              </div>

              <div class="field-row">
                <div class="field-label">Message Details</div>
                <div class="field-value message-box">${message}</div>
              </div>
            </div>
            <div class="footer">
              This inquiry was securely delivered from the <strong>Bhavishya E Uttar Pradesh Connect</strong> contact portal.
            </div>
          </div>
        </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: senderEmail,
      to: recipientEmails,
      subject: `[UP Connect Inquiry] ${subject}`,
      html: emailHtml,
      replyTo: email,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error processing contact inquiry email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch email." },
      { status: 500 },
    );
  }
}
