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
  // Check if Clerk is configured
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Nav />
          <main>{children}</main>
          {process.env.NODE_ENV === 'development' && (
            <style>{`.cl-bannertoast, .cl-component-bannertoast { display: none !important; }`}</style>
          )}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if key exists
  if (hasClerkKey) {
    return (
      <ClerkProvider
        appearance={{
          elements: { rootBox: 'z-[10]' },
        }}
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
