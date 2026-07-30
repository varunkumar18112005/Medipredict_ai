import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

import Providers from "./Providers";
import GlobalBackground from "@/components/GlobalBackground";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "MediPredict AI - Enterprise Diagnostic Support",
  description: "Advanced clinical risk assessment & predictive diagnostic platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className={`${geist.variable} ${jetbrainsMono.variable} bg-white text-slate-900`}>
        <GlobalBackground />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
