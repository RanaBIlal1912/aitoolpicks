import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";
import { SITE, absUrl, withBase } from "@/lib/site";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ScrollProgress from "@/components/ScrollProgress";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", axes: ["opsz"] });
const editorial = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE.url}/`),
  title: { default: `${SITE.name}: discover AI tools, real prices and honest comparisons`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: absUrl("/") },
  // Static files in public/brand (made by `npm run brand` from one mark). Paths include the GitHub Pages base path.
  icons: {
    icon: [
      { url: withBase("/brand/mark.svg"), type: "image/svg+xml" },
      { url: withBase("/brand/favicon-32.png"), sizes: "32x32", type: "image/png" },
      { url: withBase("/brand/icon-192.png"), sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: withBase("/brand/apple-touch-icon.png"), sizes: "180x180", type: "image/png" }],
  },
  manifest: withBase("/manifest.webmanifest"),
  openGraph: {
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
    url: absUrl("/"),
    images: [{ url: absUrl("/brand/og.png"), width: 1200, height: 630, alt: "AI Tool Picks: find the AI tool that fits, and what it really costs" }],
  },
  twitter: { card: "summary_large_image", images: [absUrl("/brand/og.png")] },
};

export const viewport: Viewport = {
  themeColor: "#090B18",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${editorial.variable}`}>
      <head>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <ScrollProgress />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": absUrl("/#org"),
                name: SITE.name,
                url: absUrl("/"),
                sameAs: [SITE.repo],
              },
              {
                "@type": "WebSite",
                "@id": absUrl("/#website"),
                url: absUrl("/"),
                name: SITE.name,
                description: SITE.description,
                publisher: { "@id": absUrl("/#org") },
                inLanguage: "en",
              },
            ],
          }}
        />
      </body>
    </html>
  );
}
