"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/settings"
import { supabase, type GameUser } from "@/lib/supabase"

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [savedMessage, setSavedMessage] = useState("")
  const [selectedUser, setSelectedUser] = useState<GameUser>("roei")
  const [supabaseStatus, setSupabaseStatus] = useState<string>("בדיקה...")
  const [bookMultiplier, setBookMultiplier] = useState(1)

  useEffect(() => {
    setSettings(loadSettings())
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from("game_state").select("user").limit(1)
      if (error) throw error
      setSupabaseStatus("✅ מחובר ל-Supabase")
    } catch (err) {
      setSupabaseStatus("❌ בעיה בחיבור ל-Supabase")
      console.error(err)
    }
  }

  const removeAllBooks = async () => {
    if (!confirm(`הסר את כל הספרים של ${selectedUser}?`)) return
    try {
      const { data, error } = await supabase
        .from("game_state")
        .select("data")
        .eq("user", selectedUser)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setSavedMessage("לא נמצאו נתונים עבור משתמש זה")
        return
      }

      const userData = data.data
      userData.books = []

      const { error: updateError } = await supabase
        .from("game_state")
        .update({ data: userData, updated_at: new Date().toISOString() })
        .eq("user", selectedUser)

      if (updateError) throw updateError
      setSavedMessage(`✅ הוסרו כל הספרים של ${selectedUser}`)
    } catch (err) {
      setSavedMessage("❌ שגיאה בהסרת ספרים")
      console.error(err)
    }
  }

  const removeAllTasks = async () => {
    if (!confirm(`הסר את כל המשימות של ${selectedUser}?`)) return
    try {
      const { data, error } = await supabase
        .from("game_state")
        .select("data")
        .eq("user", selectedUser)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setSavedMessage("לא נמצאו נתונים עבור משתמש זה")
        return
      }

      const userData = data.data
      userData.tasks = []

      const { error: updateError } = await supabase
        .from("game_state")
        .update({ data: userData, updated_at: new Date().toISOString() })
        .eq("user", selectedUser)

      if (updateError) throw updateError
      setSavedMessage(`✅ הוסרו כל המשימות של ${selectedUser}`)
    } catch (err) {
      setSavedMessage("❌ שגיאה בהסרת משימות")
      console.error(err)
    }
  }

  const applyBookSale = async () => {
    if (bookMultiplier < 1) {
      setSavedMessage("מכפיל חייב להיות 1 ומעלה")
      return
    }
    if (!confirm(`החל x${bookMultiplier} מכפיל ספרים על ${selectedUser}?`)) return
    try {
      const { data, error } = await supabase
        .from("game_state")
        .select("data")
        .eq("user", selectedUser)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setSavedMessage("לא נמצאו נתונים עבור משתמש זה")
        return
      }

      const userData = data.data
      if (userData.books && Array.isArray(userData.books)) {
        userData.books = userData.books.map((book: any) => ({
          ...book,
          coins: Math.floor((book.coins || 0) * bookMultiplier),
        }))
      }

      const { error: updateError } = await supabase
        .from("game_state")
        .update({ data: userData, updated_at: new Date().toISOString() })
        .eq("user", selectedUser)

      if (updateError) throw updateError
      setSavedMessage(`✅ הוחל מכפיל x${bookMultiplier} על כל הספרים של ${selectedUser}`)
    } catch (err) {
      setSavedMessage("❌ שגיאה בהחלת מכפיל")
      console.error(err)
    }
  }

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

        <Card className="mb-6 border-3 border-blue-500/30 shadow-xl">
          <CardHeader className="bg-blue-500/10">
            <CardTitle className="text-2xl font-black text-blue-600">🌐 חיבור Supabase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-xl bg-blue-50 p-4 text-center text-lg font-bold text-blue-700">
              {supabaseStatus}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-3 border-orange-500/30 shadow-xl">
          <CardHeader className="bg-orange-500/10">
            <CardTitle className="text-2xl font-black text-orange-600">👥 ניהול משתמשים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <label className="mb-3 block text-lg font-bold">בחר משתמש:</label>
              <div className="flex gap-3">
                <Button
                  variant={selectedUser === "roei" ? "default" : "outline"}
                  onClick={() => setSelectedUser("roei")}
                  className="text-lg font-bold"
                >
                  רועי
                </Button>
                <Button
                  variant={selectedUser === "yair" ? "default" : "outline"}
                  onClick={() => setSelectedUser("yair")}
                  className="text-lg font-bold"
                >
                  יאיר
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-bold">פעולות על ספרים:</label>
              <Button
                variant="destructive"
                onClick={removeAllBooks}
                className="w-full text-lg font-bold"
              >
                🗑️ הסר את כל הספרים
              </Button>
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-bold">פעולות על משימות:</label>
              <Button
                variant="destructive"
                onClick={removeAllTasks}
                className="w-full text-lg font-bold"
              >
                🗑️ הסר את כל המשימות
              </Button>
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-bold">מכפיל הנחה על ספרים:</label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  value={bookMultiplier}
                  onChange={(e) => setBookMultiplier(Number(e.target.value))}
                  className="text-lg"
                />
                <Button
                  onClick={applyBookSale}
                  className="text-lg font-bold"
                >
                  💰 החל מכפיל
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
