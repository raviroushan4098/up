"use server";

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// A helper to safely send emails even if SMTP is not fully configured (for local dev)
async function sendEmailSafely(options: nodemailer.SendMailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Mock Email Sent (SMTP not configured):", options);
    return { success: true, mock: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || `"Bhavishya UP" <${process.env.SMTP_USER}>`,
      ...options,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendVerificationOtpEmail(email: string, otp: string) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #F97316;">Bhavishya UP</h2>
        <p>Your email verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 2px; color: #333;">${otp}</h1>
        <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    return await sendEmailSafely({
      to: email,
      subject: "Your Verification Code - Bhavishya UP",
      html,
    });
  } catch (error) {
    console.error("Failed to generate OTP email:", error);
    return { success: false, error: "Failed to generate OTP email" };
  }
}

export async function sendApplicationSubmittedEmail(
  email: string,
  name: string,
  eventTitle: string,
  applicationNo: string,
) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #F97316;">Application Submitted Successfully</h2>
        <p>Dear ${name},</p>
        <p>Thank you for submitting your application for <strong>${eventTitle}</strong>.</p>
        <p>Your application reference number is: <strong>${applicationNo}</strong></p>
        <p>We are currently reviewing your application. You can check the status of your application anytime by logging into your Bhavishya UP dashboard.</p>
        <p>We wish you the best of luck!</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply.</p>
      </div>
    `;

    return await sendEmailSafely({
      to: email,
      subject: "Application Submitted - Bhavishya UP",
      html,
    });
  } catch (error) {
    console.error("Failed to send application submitted email:", error);
    return { success: false, error: "Failed to send application submitted email" };
  }
}

export async function sendOnboardingCompleteEmail(email: string, name: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #F97316;">Profile Submitted Successfully</h2>
      <p>Dear ${name},</p>
      <p>Your profile has been successfully submitted to <strong>Bhavishya UP</strong>.</p>
      <p>Our verification team will review your details shortly. You can check the status of your verification in your dashboard.</p>
      <p>Thank you for joining us!</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Bhavishya UP Team</strong></p>
    </div>
  `;
  return await sendEmailSafely({
    to: email,
    subject: "Welcome to Bhavishya UP - Profile Submitted",
    html,
  });
}

export async function sendProfileApprovedEmail(email: string, name: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #10B981;">Profile Verified</h2>
      <p>Dear ${name},</p>
      <p>Great news! Your profile on <strong>Bhavishya UP</strong> has been verified by our administration team.</p>
      <p>You now have full access to apply for events and programs.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Bhavishya UP Team</strong></p>
    </div>
  `;
  return await sendEmailSafely({
    to: email,
    subject: "Profile Verified - Bhavishya UP",
    html,
  });
}

export async function sendProfileRejectedEmail(email: string, name: string, reason: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #EF4444;">Action Required on Your Profile</h2>
      <p>Dear ${name},</p>
      <p>Our verification team has reviewed your profile on <strong>Bhavishya UP</strong>, but it could not be verified at this time.</p>
      <p><strong>Reason / Required Changes:</strong></p>
      <blockquote style="border-left: 4px solid #EF4444; padding-left: 10px; margin-left: 0; color: #555;">
        ${reason}
      </blockquote>
      <p>Please log in to your dashboard to update your details and resubmit your profile for verification.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Bhavishya UP Team</strong></p>
    </div>
  `;
  return await sendEmailSafely({
    to: email,
    subject: "Action Required: Profile Verification - Bhavishya UP",
    html,
  });
}

export async function sendApplicationAcceptedEmail(
  email: string,
  name: string,
  eventTitle: string,
) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #3B82F6;">Application Under Review</h2>
        <p>Dear ${name},</p>
        <p>Good news! Your application for <strong>${eventTitle}</strong> has passed our initial screening and is now <strong>under review</strong> by our panel.</p>
        <p>Kindly wait for the final selection results. We appreciate your patience!</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Bhavishya UP Team</strong></p>
      </div>
    `;
    return await sendEmailSafely({
      to: email,
      subject: "Application Under Review - Bhavishya UP",
      html,
    });
  } catch (error) {
    console.error("Failed to send accepted email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendApplicationSelectedEmail(
  email: string,
  name: string,
  eventTitle: string,
) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #10B981;">🎉 Congratulations! You have been selected!</h2>
        <p>Dear ${name},</p>
        <p>We are thrilled to inform you that your application for <strong>${eventTitle}</strong> has been officially <strong>selected</strong>!</p>
        <p>You will be informed soon with your physical location details, timing, and your official Entry ID.</p>
        <p>Get ready for an amazing experience. We look forward to seeing you!</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Bhavishya UP Team</strong></p>
      </div>
    `;
    return await sendEmailSafely({
      to: email,
      subject: "🎉 Congratulations! Application Selected - Bhavishya UP",
      html,
    });
  } catch (error) {
    console.error("Failed to send selected email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendApplicationRejectedEmail(
  email: string,
  name: string,
  eventTitle: string,
) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #EF4444;">Application Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for applying to <strong>${eventTitle}</strong>.</p>
        <p>We regret to inform you that your application was not selected at this time. We receive many excellent applications, and the selection process is highly competitive.</p>
        <p>We encourage you to apply for future events on Bhavishya UP. Keep up the great work!</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Bhavishya UP Team</strong></p>
      </div>
    `;
    return await sendEmailSafely({
      to: email,
      subject: "Application Update - Bhavishya UP",
      html,
    });
  } catch (error) {
    console.error("Failed to send rejected email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendDigitalPassEmail(
  email: string,
  name: string,
  eventTitle: string,
  passId: string,
  location: string = "Lucknow Event Center (Check Portal for details)",
  dateStr: string = "TBA",
  role: string = "PARTICIPANT",
  district: string = "Uttar Pradesh",
  phone: string = "Verified",
  pdfBase64?: string,
) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #B91C1C;">🎟️ Your Official Pass</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Please find attached your official VIP Entry Pass for <strong>${eventTitle}</strong>.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Pass ID:</strong> ${passId}</p>
          <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Category:</strong> ${role === "STUDENT" ? "Student" : "Participant"}</p>
          <p style="margin: 0; color: #1f2937;"><strong>Status:</strong> <span style="color: #15803D;">✔ Verified</span></p>
        </div>
        <p>Please <strong>download and print the attached PDF</strong> or present it on your mobile device at the venue.</p>
        <p style="color: #6b7280; font-size: 13px;"><em>Important: You must carry a valid physical   ID (Aadhaar/PAN) that matches your profile name for entry.</em></p>
        <br/>
        <p>We look forward to welcoming you!</p>
        <p style="margin-bottom: 0;">Best regards,</p>
        <p style="margin-top: 5px;"><strong>Bhavishya UP Team</strong></p>
      </div>
    `;
    const mailOptions: any = {
      to: email,
      subject: `🎟️ Your VIP Entry Pass: ${eventTitle}`,
      html,
    };

    if (pdfBase64) {
      const base64Data = pdfBase64.split(",")[1] || pdfBase64;
      mailOptions.attachments = [
        {
          filename: `${passId}_VIP_Pass.pdf`,
          content: base64Data,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ];
    }

    return await sendEmailSafely(mailOptions);
  } catch (error) {
    console.error("Failed to send digital pass email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
