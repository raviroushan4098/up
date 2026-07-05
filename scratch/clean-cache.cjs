const fs = require("fs");
const path = require("path");

const nextDir = path.resolve(__dirname, "../.next");
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("Successfully cleared Next.js .next cache directory.");
  } catch (error) {
    console.error("Failed to clear cache directory:", error);
  }
} else {
  console.log(".next cache directory does not exist. Skipping.");
}
