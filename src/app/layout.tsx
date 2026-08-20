import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/command-palette";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

/**
 * PolySans no se distribuye públicamente. Inter Tight es el sustituto que
 * indica el sistema: neo-grotesca de tracking apretado que aguanta el peso 400
 * en tamaños de display sin perder autoridad.
 */
const polysans = Inter_Tight({
  variable: "--font-polysans",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Altius", template: "%s · Altius" },
  description:
    "Observatorio de análisis fundamental construido sobre datos públicos de la SEC, la Reserva Federal y Gemini.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${polysans.variable} ${inter.variable} h-full antialiased`}>
      <body className="bg-canvas-white text-graphite flex min-h-full flex-col">
        <TooltipProvider delayDuration={200}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  );
}
