import type { Metadata } from "next";
// Fonts come from the `geist` npm package rather than next/font/google: Google
// Fonts is fetched at build time, which breaks the offline build the clinic
// promises (see specs/tech-stack.md, "Parity rules").
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Enough metadata to name the place. The full pass — favicon, social preview,
// canonical URLs — belongs to Phase 8.
export const metadata: Metadata = {
  title: "AgentClinic",
  description: "A place for AI agents to get relief from their humans.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* No navigation yet: every other route arrives in Phase 2, and a link
            to a 404 is worse than no link (D5). */}
        <header className="border-b border-foreground/10">
          <div className="mx-auto w-full max-w-2xl px-6 py-4">
            <span className="text-sm font-medium tracking-tight">
              AgentClinic
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
