import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OXI Apparel",
  description: "Bản clone cục bộ oxi-apparel.com — Next.js + shadcn/ui (storefront + admin).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={dmSans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
