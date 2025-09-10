import type React from "react"
import type { Metadata } from "next"
import { Inter, Carter_One } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import SplashScreen from "@/components/layout/splash-screen"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const carterOne = Carter_One({ weight: "400", subsets: ["latin"], variable: "--font-carter-one" })

export const metadata: Metadata = {
  title: "TeleStock",
  description: "TeleStock —  Telecom Warehouse Management System",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${carterOne.variable}`}>
      <body className={inter.className}>
        <AuthProvider>
          <SplashScreen />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
