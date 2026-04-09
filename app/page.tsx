"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

interface UserData {
  books: Book[]
  players: Player[]
  bonusCoins: number
}

type UserId = "roei" | "yair"

// Store players available for purchase
interface StorePlayer {
  id: string
  name: string
  price: number
  rating: number
}

const storePlayers: StorePlayer[] = [
  { id: "young", name: "שחקן צעיר", price: 20, rating: 10 },
  { id: "fast", name: "שחקן מהיר", price: 40, rating: 20 },
  { id: "star", name: "כוכב", price: 60, rating: 30 },
]

// Starting bonus for new users
const STARTING_BONUS = 30

// Initial user data - start with no players but a welcome bonus
const initialUserData: Record<UserId, UserData> = {
  roei: {
    books: [],
    players: [],
    bonusCoins: STARTING_BONUS,
  },
  yair: {
    books: [],
    players: [],
    bonusCoins: STARTING_BONUS,
  },
}

const userNames: Record<UserId, string> = {
  roei: "רועי",
  yair: "יאיר",
}

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
  const [currentUser, setCurrentUser] = useState<UserId>("roei")
  const [userData, setUserData] = useState<Record<UserId, UserData>>(initialUserData)
  const [bookName, setBookName] = useState("")
  const [bookPages, setBookPages] = useState("")
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Get current user data
  const books = userData[currentUser].books
  const players = userData[currentUser].players

  // Calculate total coins (books + starting bonus)
  const totalCoins = books.reduce((sum, book) => sum + book.coins, 0) + userData[currentUser].bonusCoins

  // Calculate spent coins (based on players owned)
  const spentCoins = players.reduce((sum, player) => {
    const storePlayer = storePlayers.find((sp) => sp.name === player.name)
    return sum + (storePlayer?.price || 0)
  }, 0)

  // Available coins
  const availableCoins = totalCoins - spentCoins

  // Calculate team rating
  const teamRating = players.reduce((sum, player) => sum + player.rating, 0)

  // Calculate coins for a book (10 base + 1 per 10 pages)
  const calculateCoins = (pages: number) => {
    return 10 + Math.floor(pages / 10)
  }

  // Check if can play match (need at least 2 players)
  const canPlayMatch = players.length >= 2

  // Switch user
  const switchUser = (userId: UserId) => {
    setCurrentUser(userId)
    setMatchResult(null)
    setBookName("")
    setBookPages("")
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

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        books: [...prev[currentUser].books, newBook],
      },
    }))
    setBookName("")
    setBookPages("")
  }

  // Buy a player
  const buyPlayer = (storePlayer: StorePlayer) => {
    if (availableCoins < storePlayer.price) return

    const newPlayer: Player = {
      id: Date.now(),
      name: storePlayer.name,
      rating: storePlayer.rating,
    }

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        players: [...prev[currentUser].players, newPlayer],
      },
    }))
  }

  // Play a match
  const playMatch = () => {
    if (!canPlayMatch) return

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
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-3 flex items-center justify-center gap-4">
            <span className="text-5xl md:text-6xl">{"⚽"}</span>
            <span>קוראים ומנצחים!</span>
            <span className="text-5xl md:text-6xl">{"⚽"}</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            {"📚"} קראו ספרים, צברו מטבעות, ונצחו במשחקים! {"💰"}
          </p>
        </header>

        {/* User Switcher */}
        <Card className="mb-6 border-3 border-accent/50 shadow-xl">
          <CardContent className="py-5">
            <div className="flex items-center justify-center gap-4">
              <span className="text-2xl font-bold text-muted-foreground">{"👤"} שחקן:</span>
              <div className="flex gap-3">
                <Button
                  onClick={() => switchUser("roei")}
                  className={`h-16 px-8 text-2xl font-bold transition-all ${
                    currentUser === "roei"
                      ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-4 ring-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="text-3xl ml-2">{"👦"}</span>
                  רועי
                </Button>
                <Button
                  onClick={() => switchUser("yair")}
                  className={`h-16 px-8 text-2xl font-bold transition-all ${
                    currentUser === "yair"
                      ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-4 ring-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="text-3xl ml-2">{"👦"}</span>
                  יאיר
                </Button>
              </div>
            </div>
            <p className="text-center mt-4 text-xl font-semibold text-primary">
              {"🎮"} עכשיו משחק: <span className="text-2xl">{userNames[currentUser]}</span> {"🎮"}
            </p>
          </CardContent>
        </Card>

        {/* Coins Display - Prominent at the top */}
        <Card className="mb-6 border-3 border-gold/60 shadow-xl bg-gradient-to-br from-gold/20 to-gold/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-8">
              <span className="text-5xl animate-coin-bounce">{"💰"}</span>
              <div className="text-center">
                <div className={`text-7xl md:text-8xl font-black text-gold-foreground ${availableCoins > 0 ? 'animate-pulse-glow' : ''} rounded-3xl inline-block px-6 py-2`}>
                  {availableCoins}
                </div>
                <p className="text-2xl font-bold text-gold-foreground/80 mt-2">
                  מטבעות זהב
                </p>
              </div>
              <span className="text-5xl animate-coin-bounce">{"💰"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Add Book Section */}
          <Card className="border-3 border-primary/40 shadow-xl">
            <CardHeader className="bg-primary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-primary">
                <span className="text-4xl">{"📚"}</span>
                הוספת ספר חדש
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-lg font-semibold mb-2">{"📖"} שם הספר</label>
                  <Input
                    type="text"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder="הכניסו את שם הספר..."
                    className="text-xl h-14 border-2"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-2">{"📄"} מספר עמודים</label>
                  <Input
                    type="number"
                    value={bookPages}
                    onChange={(e) => setBookPages(e.target.value)}
                    placeholder="כמה עמודים בספר?"
                    min="1"
                    className="text-xl h-14 border-2"
                  />
                </div>
                {bookPages && !isNaN(parseInt(bookPages)) && parseInt(bookPages) > 0 && (
                  <div className="bg-gold/20 rounded-xl p-4 text-center border-2 border-gold/40">
                    <p className="text-xl font-bold text-gold-foreground">
                      {"💰"} תקבלו: <span className="text-3xl">{calculateCoins(parseInt(bookPages))}</span> מטבעות! {"💰"}
                    </p>
                  </div>
                )}
                <Button
                  onClick={addBook}
                  disabled={!bookName.trim() || !bookPages || isNaN(parseInt(bookPages)) || parseInt(bookPages) <= 0}
                  className="w-full h-16 text-2xl font-bold bg-primary hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="text-3xl ml-3">{"➕"}</span>
                  הוסף ספר
                </Button>
              </div>

              {/* Books List */}
              {books.length > 0 && (
                <div className="mt-6 pt-4 border-t-2">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">{"📚"}</span>
                    הספרים של {userNames[currentUser]} ({books.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between bg-primary/10 rounded-xl p-4 border border-primary/20"
                      >
                        <span className="font-bold text-lg">{book.name}</span>
                        <span className="text-base font-semibold text-muted-foreground">
                          {book.pages} עמודים {"•"} {book.coins} {"💰"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Store Section */}
          <Card className="border-3 border-secondary/40 shadow-xl">
            <CardHeader className="bg-secondary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-secondary">
                <span className="text-4xl">{"🏪"}</span>
                חנות שחקנים
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {storePlayers.map((storePlayer) => {
                  const canAfford = availableCoins >= storePlayer.price
                  return (
                    <div
                      key={storePlayer.id}
                      className={`flex items-center justify-between rounded-2xl p-5 border-2 ${
                        canAfford 
                          ? "bg-secondary/15 border-secondary/30" 
                          : "bg-muted/50 border-muted opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-secondary/30 flex items-center justify-center text-3xl shadow-lg">
                          {"⚽"}
                        </div>
                        <div>
                          <span className="font-bold text-xl block">{storePlayer.name}</span>
                          <span className="text-base text-muted-foreground flex items-center gap-2">
                            <span>{"⭐"}</span> דירוג: {storePlayer.rating}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => buyPlayer(storePlayer)}
                        disabled={!canAfford}
                        className={`h-14 px-6 text-xl font-bold transition-transform ${
                          canAfford 
                            ? "bg-secondary hover:bg-secondary/90 hover:scale-105 active:scale-95" 
                            : "bg-muted"
                        }`}
                      >
                        <span className="text-2xl ml-2">{"💰"}</span>
                        {storePlayer.price}
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 bg-muted/60 rounded-xl p-4 text-center border-2 border-muted">
                <p className="text-lg text-muted-foreground">
                  {"📚"} קראו ספרים כדי להרוויח מטבעות וקנו שחקנים! {"⚽"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="border-3 border-accent/40 shadow-xl">
            <CardHeader className="bg-accent/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-foreground">
                <span className="text-4xl">{"⚽"}</span>
                הקבוצה של {userNames[currentUser]}
                {players.length > 0 && (
                  <span className="text-lg font-normal text-muted-foreground">
                    ({players.length} שחקנים)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {players.length === 0 ? (
                <div className="text-center py-8 bg-muted/40 rounded-2xl border-2 border-dashed border-muted">
                  <span className="text-6xl block mb-4">{"😢"}</span>
                  <p className="text-xl font-bold text-muted-foreground mb-2">
                    אין שחקנים בקבוצה
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {"🏪"} קנו שחקנים מהחנות! {"💰"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-accent/15 rounded-2xl p-5 border-2 border-accent/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-3xl shadow-lg">
                          {"⚽"}
                        </div>
                        <span className="font-bold text-xl">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-card rounded-xl px-5 py-3 shadow-md border-2 border-secondary/30">
                        <span className="text-2xl">{"⭐"}</span>
                        <span className="font-black text-2xl">{player.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Team Rating */}
              {players.length > 0 && (
                <div className="mt-6 pt-4 border-t-2">
                  <div className="flex items-center justify-between bg-primary/15 rounded-2xl p-5 border-2 border-primary/30">
                    <span className="font-bold text-xl flex items-center gap-2">
                      <span className="text-2xl">{"🏆"}</span>
                      דירוג הקבוצה
                    </span>
                    <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl px-6 py-3 shadow-lg">
                      <span className="text-2xl">{"🏆"}</span>
                      <span className="font-black text-3xl">{teamRating}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Play Match Section */}
          <Card className="border-3 border-primary/40 shadow-xl">
            <CardHeader className="bg-primary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-primary">
                <span className="text-4xl">{"⚔️"}</span>
                משחק!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!canPlayMatch && (
                <div className="mb-6 bg-destructive/15 rounded-2xl p-5 text-center border-2 border-destructive/30">
                  <span className="text-5xl block mb-3">{"⚠️"}</span>
                  <p className="text-xl font-bold text-destructive mb-2">
                    אי אפשר לשחק עדיין!
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {"⚽"} צריך לפחות 2 שחקנים בקבוצה כדי לשחק משחק {"⚽"}
                  </p>
                </div>
              )}

              <Button
                onClick={playMatch}
                disabled={isPlaying || !canPlayMatch}
                className={`w-full h-24 text-3xl font-black mb-6 transition-transform shadow-xl ${
                  canPlayMatch 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 active:scale-95" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPlaying ? (
                  <span className="flex items-center gap-4">
                    <span className="text-4xl animate-football-spin">{"⚽"}</span>
                    <span className="animate-pulse">משחקים...</span>
                    <span className="text-4xl animate-football-spin">{"⚽"}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <span className="text-4xl">{"🏆"}</span>
                    שחקו משחק!
                    <span className="text-4xl">{"⚽"}</span>
                  </span>
                )}
              </Button>

              {/* Match Result */}
              {matchResult && (
                <div
                  className={`rounded-2xl p-8 text-center ${
                    matchResult.won
                      ? "bg-win/25 border-4 border-win animate-bounce-win"
                      : "bg-lose/25 border-4 border-lose animate-shake-lose"
                  }`}
                >
                  <div className="text-6xl mb-4">
                    {matchResult.won ? "🎉🏆🎉" : "😢💔😢"}
                  </div>
                  <h3
                    className={`text-5xl font-black mb-6 ${
                      matchResult.won ? "text-win" : "text-lose"
                    }`}
                  >
                    {matchResult.won ? "ניצחתם!" : "הפסדתם..."}
                  </h3>
                  <div className="space-y-3 text-xl bg-card/50 rounded-xl p-4">
                    <p className="font-bold">
                      {"⚽"} הקבוצה שלכם: <span className="text-2xl">{matchResult.myRating}</span> נקודות
                    </p>
                    <p className="font-bold">
                      {"🆚"} נגד {matchResult.opponentName}: <span className="text-2xl">{matchResult.opponentRating}</span> נקודות
                    </p>
                  </div>
                  {!matchResult.won && (
                    <p className="mt-6 text-lg font-semibold text-muted-foreground bg-card/80 rounded-xl p-4">
                      {"📚"} קראו עוד ספרים וקנו שחקנים חזקים יותר! {"💪"}
                    </p>
                  )}
                  {matchResult.won && (
                    <p className="mt-6 text-lg font-semibold text-win bg-card/80 rounded-xl p-4">
                      {"🌟"} כל הכבוד {userNames[currentUser]}! אתה אלוף! {"🌟"}
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              {!matchResult && !isPlaying && canPlayMatch && (
                <div className="bg-muted/60 rounded-xl p-5 text-center border-2 border-muted">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {"👆"} לחצו על הכפתור כדי לשחק נגד קבוצה אקראית!
                    <br />
                    {"⚡"} הקבוצה עם הדירוג הגבוה יותר מנצחת! {"⚡"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xl font-semibold text-muted-foreground bg-card/80 rounded-2xl py-4 px-6 inline-block shadow-lg border-2 border-muted">
            {"📚"} ככל שתקראו יותר, הקבוצה שלכם תהיה חזקה יותר! {"💪⚽"}
          </p>
        </footer>
      </div>
    </main>
  )
}
