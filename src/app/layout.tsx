import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "ALF — Research Notes",
  description: "Minimal markdown research console with agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: { rootBox: 'z-[10]' },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <Nav />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
            {process.env.NODE_ENV === 'development' && (
              <style>{`.cl-bannertoast, .cl-component-bannertoast { display: none !important; }`}</style>
            )}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
