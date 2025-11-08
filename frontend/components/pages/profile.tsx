"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, Bell, Shield, Save, LogOut, User } from "lucide-react"

interface UserSettings {
  name: string
  email: string
  bio: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    profilePublic: boolean
    showActivity: boolean
  }
}

export function ProfilePage() {
  const [settings, setSettings] = useState<UserSettings>({
    name: "Alex Johnson",
    email: "alex@example.com",
    bio: "Full-stack developer passionate about building beautiful web experiences",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profilePublic: true,
      showActivity: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = (field: keyof Omit<UserSettings, "notifications" | "privacy">, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: keyof UserSettings["notifications"]) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: !prev.notifications[field] },
    }))
  }

  const handlePrivacyChange = (field: keyof UserSettings["privacy"]) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: !prev.privacy[field] },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSaving(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <div className="min-h-screen bg-background mt-16">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Profile Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{settings.name}</h1>
              <p className="text-muted-foreground">{settings.email}</p>
            </div>
          </motion.div>

          {/* Account Settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <Input
                    value={settings.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    value={settings.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bio</label>
                  <Input
                    value={settings.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "email" as const,
                    icon: Mail,
                    label: "Email Notifications",
                    description: "Receive updates via email",
                  },
                  {
                    key: "push" as const,
                    icon: Bell,
                    label: "Push Notifications",
                    description: "Receive browser push notifications",
                  },
                  {
                    key: "sms" as const,
                    icon: User,
                    label: "SMS Notifications",
                    description: "Receive important updates via SMS",
                  },
                ].map((notif) => {
                  const Icon = notif.icon
                  return (
                    <div
                      key={notif.key}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{notif.label}</p>
                          <p className="text-sm text-muted-foreground">{notif.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(notif.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.notifications[notif.key] ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                            settings.notifications[notif.key] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Control your privacy and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "profilePublic" as const,
                    label: "Public Profile",
                    description: "Allow others to see your profile",
                  },
                  {
                    key: "showActivity" as const,
                    label: "Show Activity",
                    description: "Show your activity status to others",
                  },
                ].map((privacy) => (
                  <div
                    key={privacy.key}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{privacy.label}</p>
                      <p className="text-sm text-muted-foreground">{privacy.description}</p>
                    </div>
                    <button
                      onClick={() => handlePrivacyChange(privacy.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.privacy[privacy.key] ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                          settings.privacy[privacy.key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                  <Shield className="h-4 w-4" />
                  Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="flex gap-4 justify-end">
            <Button variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4">◌</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
