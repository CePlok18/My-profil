import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Loker Penyimpanan",
  description: "Dashboard smart loker penyimpanan berbasis IoT"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
