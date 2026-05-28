import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { MixpanelProvider } from "@/lib/analytics/mixpanel-provider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prepex — Plan · Execute · Survive · Win",
  description:
    "The execution app for JEE aspirants. Real prep that shows up — even on bad days.",
  applicationName: "Prepex",
  authors: [{ name: "Prepex" }],
  keywords: ["JEE", "JEE Main", "JEE Advanced", "study planner", "revision", "Prepex"],
  // Open Graph fields stay sparse for v1; revisit before launch.
  openGraph: {
    title: "Prepex",
    description: "The execution app for JEE aspirants.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050010",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${sourceSerif.variable}`}>
      <body className="aurora-bg min-h-screen text-text-primary">
        <MixpanelProvider>{children}</MixpanelProvider>
      </body>
    </html>
  );
}
