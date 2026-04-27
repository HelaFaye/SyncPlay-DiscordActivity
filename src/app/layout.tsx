import { SiteFooter } from "@/components/layout/SiteFooter"
import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"
import { AppProviders } from "./providers"

export const metadata: Metadata = {
  title: "Web-SyncPlay",
  description: "Watch videos or play music in sync with your friends",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <div className="min-h-screen flex flex-col gap-2">
            <main className="grow flex flex-col gap-2">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  )
}
