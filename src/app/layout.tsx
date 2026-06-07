import "@/styles.css";
import { Providers } from "./providers";
import { NetworkStatusBanner } from "@/components/layout/NetworkStatusBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhavishya Uttar Pradesh — Official Registration Portal",
  description:
    "नए उत्तर प्रदेश का नया भविष्य. Register for   Uttar Pradesh events, schemes and initiatives for the youth of UP.",
  authors: [{ name: "  Uttar Pradesh" }],
  icons: {
    icon: "/brandlogo2.svg",
  },
  openGraph: {
    title: "Bhavishya Uttar Pradesh — Official Portal",
    description: "Register for   UP events, scholarships and skill programmes.",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@UP ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <NetworkStatusBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
