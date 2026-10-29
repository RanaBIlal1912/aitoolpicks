import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE, absUrl } from "@/lib/site";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE.url}/`),
  title: { default: `${SITE.name}: honest AI tool reviews, comparisons and guides`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: absUrl("/") },
  openGraph: { siteName: SITE.name, type: "website", locale: "en_US", url: absUrl("/") },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#05060f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
