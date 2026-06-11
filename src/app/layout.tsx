import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Lora, Playfair_Display } from "next/font/google";
import { PageTransitionProvider } from "@/components/PageTransitionProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

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

const themeScript = `(function(){try{var t=localStorage.getItem("selekt-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;return}if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.dataset.theme="dark"}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${playfair.variable} ${lora.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <PageTransitionProvider>{children}</PageTransitionProvider>
      </body>
    </html>
  );
}
