import { Cormorant_Garamond, Manrope, Sora } from "next/font/google";
import "@/styles/globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display"
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const accent = Sora({
  subsets: ["latin"],
  variable: "--font-accent"
});

export const metadata = {
  title: "INVITIA",
  description: "Premium AI invitation studio for elegant event pages."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${display.variable} ${body.variable} ${accent.variable}`}>
        {children}
      </body>
    </html>
  );
}
