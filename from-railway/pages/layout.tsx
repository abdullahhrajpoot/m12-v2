import type { Metadata } from "next"
import { Inter } from "next/font/google"
import * as Sentry from '@sentry/nextjs'
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export function generateMetadata(): Metadata {
  return {
    title: "Bippity.boo - Let something else keep track for once",
    description: "Family communication assistant that processes emails from schools and extracurricular activities to automatically create calendar events and tasks.",
    icons: {
      icon: [
        { url: '/favicon.ico', media: '(prefers-color-scheme: light)' },
        { url: '/bippity-boo-favicon-32x32.png', media: '(prefers-color-scheme: dark)' },
      ],
      shortcut: '/favicon.ico',
      apple: '/bippity-boo-favicon-32x32.png',
    },
    other: {
      ...Sentry.getTraceData()
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}




