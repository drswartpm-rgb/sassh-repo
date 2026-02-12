import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SASSH — South Africa Society for Surgery of the Hand",
  description:
    "Curated articles and resources for hand surgery professionals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sassh-theme');if(t&&['dark','light','scrub-green'].includes(t)){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-[family-name:var(--font-body)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
