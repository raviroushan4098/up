import "@/styles.css";
import { Providers } from "./providers";
import { NetworkStatusBanner } from "@/components/layout/NetworkStatusBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhavishya E Uttar Pradesh | भविष्य ए उत्तर प्रदेश",
  description:
    "Official Registration Portal for Bhavishya E Uttar Pradesh. भविष्य ए उत्तर प्रदेश। विकसित भारत की सीढ़ी आज की युवा पीढ़ी.",
  authors: [{ name: "Bhavishya E Uttar Pradesh" }],
  icons: {
    icon: "/brandlogo2.svg",
  },
  openGraph: {
    title: "Bhavishya E Uttar Pradesh | भविष्य ए उत्तर प्रदेश",
    description: "Official Registration Portal for Bhavishya E Uttar Pradesh.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bhavishya E Uttar Pradesh | भविष्य ए उत्तर प्रदेश",
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
