"use client"

import type React from "react"

import Image from "next/image"
import ethioLogo from "@/assets/ethio-telecom-logo.png"

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
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 sm:py-6 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8">
        <div className="text-center flex flex-col items-center">
          <Image
            src={ethioLogo}
            alt="Ethio Telecom Logo"
            className="h-12 sm:h-16 w-auto object-contain"
            priority
          /> 
          <h2 className="mt-4 sm:mt-6 text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight px-2 sm:px-0">
            Tele Warehouse Management System
          </h2>
          <div className="mt-3 flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-sm text-gray-600 text-center">Sign in to your account</span>
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                aria-label="Toggle demo credentials"
                className="inline-flex items-center justify-center rounded-full p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
            
            {showDemoCredentials && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left w-full max-w-sm mx-auto shadow-sm">
                <p className="font-medium text-blue-900 text-sm mb-3">Demo Credentials</p>
                <div className="space-y-2 text-xs text-blue-800">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Admin:</span>
                    <span className="break-all">admin@ethiotelecom.et / admin123</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Manager:</span>
                    <span className="break-all">manager@ethiotelecom.et / manager123</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Clerk:</span>
                    <span className="break-all">clerk@ethiotelecom.et / clerk123</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl sm:text-2xl">Login</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
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
                  placeholder="Enter your email"
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
                <Alert variant="destructive">
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
