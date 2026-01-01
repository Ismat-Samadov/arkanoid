import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arkanoid Game",
  description: "Classic Arkanoid breakout game built with Next.js and TypeScript",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
