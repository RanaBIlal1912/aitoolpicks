import "./globals.css";

export const metadata = { title: { default: "AI Tool Picks team", template: "%s | AI Tool Picks team" }, robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
