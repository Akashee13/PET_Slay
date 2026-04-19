import type { ReactNode } from "react";

export const metadata = {
  title: "PET_Slay Admin",
  description: "Admin app scaffold for PET_Slay"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
