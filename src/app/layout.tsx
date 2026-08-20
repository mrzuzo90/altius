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
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: { default: "Altius", template: "%s · Altius" },
  description:
    "Observatorio de análisis fundamental construido sobre datos públicos de la SEC, la Reserva Federal y Gemini.",
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('altius-theme');
    var isDark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${interTight.variable} ${inter.variable} h-full antialiased dark`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-void-black text-frost flex min-h-full flex-col selection:bg-iris-blue/30 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CommandPalette />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
