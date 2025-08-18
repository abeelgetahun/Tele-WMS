"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ name: "", email: "", role: "", warehouse: "" })

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        setLoading(true)
        const p = await apiClient.getProfile()
        setProfile(p)
        setForm({
          name: p.name || "",
          email: p.email,
          role: p.role,
          warehouse: p.warehouse?.name || "",
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const onSave = async () => {
    try {
      const updated = await apiClient.updateProfile({ name: form.name })
      setProfile(updated)
      toast({ title: "Profile updated" })
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">Loading...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>View and update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={form.email} disabled />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={form.role} disabled />
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Input value={form.warehouse} disabled />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
