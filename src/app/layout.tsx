import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "Coy — Discover",
  description: "Find your match on Coy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",   // ← enables env(safe-area-inset-*) on iOS Safari
  themeColor: "#0f0f0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Warm up the TCP/TLS connection to picsum.photos before images load */}
        <link rel="preconnect" href="https://picsum.photos" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://picsum.photos" />
        {/* Fastly CDN that picsum.photos actually serves from */}
        <link rel="preconnect" href="https://fastly.picsum.photos" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fastly.picsum.photos" />
      </head>
      <body>
        <div className="app-shell">
          <main className="app-main">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
