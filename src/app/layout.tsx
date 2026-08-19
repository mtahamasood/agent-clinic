import type { Metadata } from "next";
// Fonts come from the `geist` npm package rather than next/font/google: Google
// Fonts is fetched at build time, which breaks the offline build the clinic
// promises (see specs/tech-stack.md, "Parity rules").
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClinicFooter } from "@/components/clinic-footer";
import { ClinicHeader } from "@/components/clinic-header";
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
        <ClinicHeader />
        {/* The `<main>` landmark and the page container width live here rather
            than in each page, so a new route only supplies its own content
            (plan.md 5.1). `flex-1` is what pins the footer to the bottom on
            short pages.

            Widths are fluid and the vertical rhythm is mobile-first, per the
            responsive-design convention in specs/tech-stack.md: `max-w-2xl`
            caps rather than fixes, and `py-12` is the phone spacing that
            `sm:py-16` grows from. A constant `py-16` spent about a fifth of a
            phone viewport before any content appeared. */}
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
          {children}
        </main>
        <ClinicFooter />
      </body>
    </html>
  );
}
