import type { ReactNode } from "react";
import type { Viewport } from "next";

import "./globals.css";

export const metadata = {
  title: "PET_Slay Admin",
  description: "Admin stage operations console for PET_Slay"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dusk">
      <body className="app-body">{children}</body>
    </html>
  );
}
