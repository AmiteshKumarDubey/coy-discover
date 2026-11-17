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
      <body>
        <div className="app-shell">
          <main className="app-main">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
