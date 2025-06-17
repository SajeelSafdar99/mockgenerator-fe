import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import SiteHeader from "@/components/site-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VectorByte - Professional Mockup Generator",
  description: "Create professional mockups and designs with VectorByte",
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
      <body className={inter.className}>
      <AuthProvider>
        <SiteHeader />
        <main>{children}</main>
      </AuthProvider>
      </body>
      </html>
  )
}
