const fs = require("fs");
const file = "./src/actions/email.ts";
let code = fs.readFileSync(file, "utf8");

const newHtmlBlock = `
    const html = \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #B91C1C;">🎟️ Your Official Pass</h2>
        <p>Dear <strong>\${name}</strong>,</p>
        <p>Please find attached your official VIP Entry Pass for <strong>\${eventTitle}</strong>.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Pass ID:</strong> \${passId}</p>
          <p style="margin: 0 0 8px 0; color: #1f2937;"><strong>Category:</strong> \${role === "STUDENT" ? "Student" : "Participant"}</p>
          <p style="margin: 0; color: #1f2937;"><strong>Status:</strong> <span style="color: #15803D;">✔ Verified</span></p>
        </div>    
        <p>Please <strong>download and print the attached PDF</strong> or present it on your mobile device at the venue.</p>
        <p style="color: #6b7280; font-size: 13px;"><em>Important: You must carry a valid physical   ID (Aadhaar/PAN) that matches your profile name for entry.</em></p>
        <br/>
        <p>We look forward to welcoming you!</p>
        <p style="margin-bottom: 0;">Best regards,</p>
        <p style="margin-top: 5px;"><strong>Bhavishya E Uttar Pradesh Team</strong></p>
      </div>
    \`;
`;

// we want to replace from `const verifyUrl = ...` all the way down to the end of the `html` string
const startTag = "const verifyUrl = ";
const endTag = "const mailOptions: any = {";

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  const codeBefore = code.slice(0, startIndex);
  const codeAfter = code.slice(endIndex);
  const finalCode = codeBefore + newHtmlBlock + "    " + codeAfter;
  fs.writeFileSync(file, finalCode);
  console.log("Replaced email template successfully.");
} else {
  console.error("Could not find boundaries.");
}
