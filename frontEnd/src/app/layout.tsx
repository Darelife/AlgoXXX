import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Algomaniax",
  description: "The Official Competitive Programming Club of BITS Goa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="68577f98-65bc-460a-a02a-6675a211522e"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased vsc-initialized`}
      >
        <Analytics />
        {children}
      </body>
    </html>
  );
}
