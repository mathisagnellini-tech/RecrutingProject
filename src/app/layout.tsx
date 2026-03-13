import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fast & Curious - Recrutement Vidéo",
  description: "Présente-toi en vidéo façon Fast & Curious",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
