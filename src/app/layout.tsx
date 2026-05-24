import "@/styles.css";
import { Providers } from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhavishya Uttar Pradesh — Official Registration Portal",
  description:
    "नए उत्तर प्रदेश का नया भविष्य. Register for Government of Uttar Pradesh events, schemes and initiatives for the youth of UP.",
  authors: [{ name: "Government of Uttar Pradesh" }],
  openGraph: {
    title: "Bhavishya Uttar Pradesh — Official Portal",
    description: "Register for Government of UP events, scholarships and skill programmes.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@UPGovt",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
