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
import { Building2, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center mb-4">
          
        </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center flex flex-col items-center">
          <Image
            src={ethioLogo}
            alt="Ethio Telecom Logo"
            className="h-16 w-auto object-contain"
            priority
          /> 
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Tele Warehouse Management System</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
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
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            {/* <div className="mt-6 border-t pt-6">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Test Credentials:</p>
                <div className="space-y-1 text-xs">
                  <p>
                    <strong>Admin:</strong> admin@ethiotelecom.et / admin123
                  </p>
                  <p>
                    <strong>Manager:</strong> manager@ethiotelecom.et / manager123
                  </p>
                  <p>
                    <strong>Clerk:</strong> clerk@ethiotelecom.et / clerk123
                  </p>
                  <p>
                    <strong>Technician:</strong> technician@ethiotelecom.et / tech123
                  </p>
                  <p>
                    <strong>Auditor:</strong> auditor@ethiotelecom.et / audit123
                  </p>
                </div>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
