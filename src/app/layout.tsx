import type { Metadata } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import Script from "next/script";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/favicon.ico' },
  title: "WheelVision - AI Wheel Visualization",
  description: "See which wheels fit your car before you buy — AI visualization in 30 seconds.",
  keywords: ["jant görselleştirme", "jant simulasyon", "AI jant", "jant deneme", "araba jant değiştirme", "wheel visualization", "wheel fitting", "AI wheel", "try wheels on car", "wheelvision"],
  authors: [{ name: "WheelVision" }],
  robots: "index, follow",
  alternates: {
    canonical: 'https://wheelvision.io',
    languages: {
      'tr': 'https://wheelvision.io/tr',
      'en': 'https://wheelvision.io/en',
    },
  },
  openGraph: {
    type: "website",
    url: "https://wheelvision.io",
    title: "WheelVision — Will That Wheel Fit Your Car?",
    description: "See before you spend. AI wheel visualization in 30 seconds.",
    siteName: "WheelVision",
    images: [{ url: "https://wheelvision.io/og-image.jpg", width: 1200, height: 630, alt: "WheelVision AI Wheel Visualization" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WheelVision — Will That Wheel Fit Your Car?",
    description: "See before you spend. AI wheel visualization in 30 seconds.",
    images: ["https://wheelvision.io/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://fal.media" />
      </head>
      <body className={`min-h-full flex flex-col ${outfit.className}`}>
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-5TEZ5ZTLBW" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5TEZ5ZTLBW');
          `}
        </Script>
      </body>
    </html>
  );
}
