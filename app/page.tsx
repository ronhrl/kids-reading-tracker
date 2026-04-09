"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Coins, Users, Trophy, Swords, Star, Plus } from "lucide-react"

// Types
interface Book {
  id: number
  name: string
  pages: number
  coins: number
}

interface Player {
  id: number
  name: string
  rating: number
}

interface MatchResult {
  opponentRating: number
  opponentName: string
  won: boolean
  myRating: number
}

// Initial mock data for players
const initialPlayers: Player[] = [
  { id: 1, name: "רונאלדו", rating: 92 },
  { id: 2, name: "מסי", rating: 91 },
  { id: 3, name: "אמבפה", rating: 89 },
]

// Random opponent names
const opponentNames = [
  "הברקים",
  "הנמרים",
  "האריות",
  "הנשרים",
  "הכוכבים",
  "הגיבורים",
  "האלופים",
  "המנצחים",
]

export default function ReadingTrackerPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [bookName, setBookName] = useState("")
  const [bookPages, setBookPages] = useState("")
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Calculate total coins
  const totalCoins = books.reduce((sum, book) => sum + book.coins, 0)

  // Calculate team rating
  const teamRating = players.reduce((sum, player) => sum + player.rating, 0)

  // Calculate coins for a book (10 base + 1 per 10 pages)
  const calculateCoins = (pages: number) => {
    return 10 + Math.floor(pages / 10)
  }

  // Add a new book
  const addBook = () => {
    if (!bookName.trim() || !bookPages) return
    
    const pages = parseInt(bookPages)
    if (isNaN(pages) || pages <= 0) return

    const newBook: Book = {
      id: Date.now(),
      name: bookName.trim(),
      pages,
      coins: calculateCoins(pages),
    }

    setBooks([...books, newBook])
    setBookName("")
    setBookPages("")
  }

  // Play a match
  const playMatch = () => {
    setIsPlaying(true)
    setMatchResult(null)

    // Generate random opponent
    const opponentRating = Math.floor(Math.random() * 200) + 150 // Rating between 150-350
    const opponentName = opponentNames[Math.floor(Math.random() * opponentNames.length)]

    // Simulate match after delay
    setTimeout(() => {
      const won = teamRating > opponentRating
      setMatchResult({
        opponentRating,
        opponentName,
        won,
        myRating: teamRating,
      })
      setIsPlaying(false)
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            ⚽ קוראים ומנצחים! ⚽
          </h1>
          <p className="text-lg text-muted-foreground">
            קראו ספרים, צברו מטבעות, ונצחו במשחקים!
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Add Book Section */}
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader className="bg-primary/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl text-primary">
                <BookOpen className="h-7 w-7" />
                הוספת ספר חדש
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">שם הספר</label>
                  <Input
                    type="text"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder="הכניסו את שם הספר..."
                    className="text-lg h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">מספר עמודים</label>
                  <Input
                    type="number"
                    value={bookPages}
                    onChange={(e) => setBookPages(e.target.value)}
                    placeholder="כמה עמודים בספר?"
                    min="1"
                    className="text-lg h-12"
                  />
                </div>
                {bookPages && parseInt(bookPages) > 0 && (
                  <p className="text-sm text-secondary font-semibold">
                    🪙 תקבלו: {calculateCoins(parseInt(bookPages))} מטבעות!
                  </p>
                )}
                <Button
                  onClick={addBook}
                  disabled={!bookName.trim() || !bookPages || parseInt(bookPages) <= 0}
                  className="w-full h-14 text-xl font-bold bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-6 w-6 ml-2" />
                  הוסף ספר
                </Button>
              </div>

              {/* Books List */}
              {books.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    הספרים שלי ({books.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                      >
                        <span className="font-medium">{book.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {book.pages} עמודים • {book.coins} 🪙
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coins Display */}
          <Card className="border-2 border-gold/50 shadow-lg bg-gold/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-gold-foreground">
                <Coins className="h-7 w-7 text-gold" />
                המטבעות שלי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-7xl md:text-8xl font-bold text-gold-foreground mb-2">
                  {totalCoins}
                </div>
                <p className="text-lg text-gold-foreground/70">🪙 מטבעות זהב 🪙</p>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  כל ספר נותן 10 מטבעות + מטבע נוסף על כל 10 עמודים!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="border-2 border-accent/30 shadow-lg">
            <CardHeader className="bg-accent/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl text-accent-foreground">
                <Users className="h-7 w-7 text-accent" />
                הקבוצה שלי
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-accent/10 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xl font-bold">
                        ⚽
                      </div>
                      <span className="font-bold text-lg">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2">
                      <Star className="h-5 w-5 text-secondary fill-secondary" />
                      <span className="font-bold text-xl">{player.rating}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team Rating */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between bg-primary/10 rounded-xl p-4">
                  <span className="font-bold text-lg">דירוג הקבוצה</span>
                  <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2">
                    <Trophy className="h-6 w-6" />
                    <span className="font-bold text-2xl">{teamRating}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Play Match Section */}
          <Card className="border-2 border-secondary/30 shadow-lg">
            <CardHeader className="bg-secondary/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl text-secondary">
                <Swords className="h-7 w-7" />
                משחק!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                onClick={playMatch}
                disabled={isPlaying}
                className="w-full h-20 text-2xl font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground mb-6"
              >
                {isPlaying ? (
                  <span className="animate-pulse">⚽ משחקים... ⚽</span>
                ) : (
                  <>
                    <Trophy className="h-8 w-8 ml-3" />
                    שחקו משחק!
                  </>
                )}
              </Button>

              {/* Match Result */}
              {matchResult && (
                <div
                  className={`rounded-xl p-6 text-center ${
                    matchResult.won
                      ? "bg-win/20 border-2 border-win"
                      : "bg-lose/20 border-2 border-lose"
                  }`}
                >
                  <div className="text-4xl mb-4">
                    {matchResult.won ? "🎉🏆🎉" : "😢"}
                  </div>
                  <h3
                    className={`text-3xl font-bold mb-4 ${
                      matchResult.won ? "text-win" : "text-lose"
                    }`}
                  >
                    {matchResult.won ? "ניצחתם!" : "הפסדתם..."}
                  </h3>
                  <div className="space-y-2 text-lg">
                    <p>
                      <span className="font-semibold">הקבוצה שלכם:</span>{" "}
                      {matchResult.myRating} נקודות
                    </p>
                    <p>
                      <span className="font-semibold">נגד {matchResult.opponentName}:</span>{" "}
                      {matchResult.opponentRating} נקודות
                    </p>
                  </div>
                  {!matchResult.won && (
                    <p className="mt-4 text-muted-foreground">
                      קראו עוד ספרים כדי לחזק את הקבוצה! 📚
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              {!matchResult && !isPlaying && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground">
                    לחצו על הכפתור כדי לשחק נגד קבוצה אקראית!
                    <br />
                    הקבוצה עם הדירוג הגבוה יותר מנצחת ⚡
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>📚 ככל שתקראו יותר, הקבוצה שלכם תהיה חזקה יותר! 💪</p>
        </footer>
      </div>
    </main>
  )
}
