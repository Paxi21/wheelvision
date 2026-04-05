import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "WheelVision - AI Jant Görselleştirme",
  description: "Arabanıza hangi jant yakışır? Yapay zeka ile 30 saniyede görün — satın almadan önce deneyin.",
  keywords: "jant görselleştirme, AI jant, araba jant deneme, jant simülasyon, wheel visualization",
  authors: [{ name: "WheelVision" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://wheelvision.io",
    title: "WheelVision — O Jant Arabana Yakışıyor mu?",
    description: "Binlerce lira harcamadan önce gör. AI ile 30 saniyede jantı arabana yerleştir.",
    siteName: "WheelVision",
    images: [{ url: "https://wheelvision.io/og-image.jpg", width: 1200, height: 630, alt: "WheelVision AI Jant Görselleştirme" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WheelVision — O Jant Arabana Yakışıyor mu?",
    description: "Binlerce lira harcamadan önce gör. AI ile 30 saniyede jantı arabana yerleştir.",
    images: ["https://wheelvision.io/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`h-full antialiased ${outfit.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://fal.media" />
      </head>
      <body className={`min-h-full flex flex-col ${outfit.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
