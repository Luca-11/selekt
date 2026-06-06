import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Selekt — curation de marques mode",
  description: "Une curation personnelle de marques mode indépendantes.",
  applicationName: "Selekt",
  openGraph: {
    title: "Selekt — curation de marques mode",
    description: "Une curation personnelle de marques mode indépendantes.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
