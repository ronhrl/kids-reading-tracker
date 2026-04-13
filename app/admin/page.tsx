"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/settings"

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [savedMessage, setSavedMessage] = useState("")

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const updateSetting = (key: keyof Settings, value: string) => {
    const parsed = value === "" ? 0 : Number(value)
    setSettings((prev) => ({
      ...prev,
      [key]: Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0,
    }))
  }

  const handleSave = () => {
    saveSettings(settings)
    setSettings(loadSettings())
    setSavedMessage("ההגדרות נשמרו בהצלחה")
  }

  const handleReset = () => {
    saveSettings(defaultSettings)
    setSettings(defaultSettings)
    setSavedMessage("ההגדרות אופסו לברירת המחדל")
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl" dir="rtl">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-black text-primary md:text-6xl">🛠️ ניהול משחק</h1>
          <p className="mt-3 text-lg text-muted-foreground">כאן אפשר לשנות את חוקי המשחק ולשמור אותם במכשיר</p>
        </header>

        <Card className="border-3 border-primary/30 shadow-xl">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl font-black text-primary">הגדרות משחק</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <label className="text-lg font-bold">מטבעות לכל 10 עמודים</label>
              <Input
                type="number"
                min="0"
                value={settings.coinsPer10Pages}
                onChange={(e) => updateSetting("coinsPer10Pages", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-lg font-bold">בונוס סיום ספר</label>
              <Input
                type="number"
                min="0"
                value={settings.bookBonus}
                onChange={(e) => updateSetting("bookBonus", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-lg font-bold">אנרגיה לכל משימה</label>
              <Input
                type="number"
                min="0"
                value={settings.energyPerTask}
                onChange={(e) => updateSetting("energyPerTask", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-lg font-bold">עלות אנרגיה למשחק</label>
              <Input
                type="number"
                min="0"
                value={settings.matchCost}
                onChange={(e) => updateSetting("matchCost", e.target.value)}
              />
            </div>

            {savedMessage && (
              <p className="rounded-xl bg-primary/10 p-3 text-center font-bold text-primary">{savedMessage}</p>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <Button className="text-lg font-bold" onClick={handleSave}>
                שמירה
              </Button>
              <Button className="text-lg font-bold" variant="secondary" onClick={handleReset}>
                איפוס לברירת מחדל
              </Button>
              <Link href="/" className="block">
                <Button className="w-full text-lg font-bold" variant="outline">
                  חזרה לבית
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
