"use client"

import type React from "react"

import Image from "next/image"
import appLogo from "@/assets/app_logo.png"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, HelpCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDemoCredentials, setShowDemoCredentials] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Email and password don’t match")
      }
    } catch (err) {
      setError("Email and password don’t match")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-6 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8">
        <div className="text-center flex flex-col items-center">
          <Image
            src={appLogo}
            alt="TeleStock Logo"
            className="h-16 sm:h-24 w-auto object-contain"
            priority
          />
          <h2 className="font-brand mt-4 sm:mt-6 text-2xl sm:text-3xl md:text-4xl text-gray-900 leading-tight px-2 sm:px-0">
            TeleStock
          </h2>
          <div className="mt-3 flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-sm text-gray-600 text-center">Sign in to your account</span>
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                aria-label="Toggle demo accounts"
                className="inline-flex items-center justify-center rounded-full px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200 shadow-sm text-xs font-medium"
              >
                <HelpCircle className="mr-1.5 h-4 w-4" />
                {showDemoCredentials ? "Hide demo accounts" : "View demo accounts"}
              </button>
            </div>

            {showDemoCredentials && (
              <div className="mt-2 w-full max-w-sm mx-auto">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="p-4">
                    <p className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Demo accounts
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Use corporate emails like <span className="font-medium text-foreground">name@telecom.et</span>
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="font-medium">Admin:</span>
                        <span className="break-all">admin@telecom.et / admin123</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="font-medium">Manager:</span>
                        <span className="break-all">manager@telecom.et / manager123</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="font-medium">Clerk:</span>
                        <span className="break-all">clerk@telecom.et / clerk123</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl">Login</CardTitle>
            <CardDescription>Use your corporate email (e.g., name@telecom.et)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@telecom.et"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
