import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Transit Infrastructure Intelligence",
  description: "Real-time predictive maintenance and failure monitoring for public transit infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://unpkg.com/maplibre-gl@4.1.1/dist/maplibre-gl.css" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
