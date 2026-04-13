"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  calculateReadingCoins,
  defaultSettings,
  loadSettings,
  type Settings,
} from "@/lib/settings"

// Types
interface Book {
  id: number
  name: string
  pages: number
  coins: number
  /** מתי סומן כספר שהושלם (לרשימת הספרים שסיימתי) */
  finishedAt: string
}

interface Task {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

interface Player {
  id: number
  storeId: string
  name: string
  rating: number
  age: number
  role: string
  countryOfOrigin: string
  energy: number
  mentalHealth: number
  skills: number
  teamName?: string
}

type FormationType = "4-3-3" | "4-2-3-1" | "3-5-2" | "5-3-2" | "4-4-2"

interface MatchResult {
  opponentPower: number
  opponentName: string
  outcome: "win" | "lose" | "draw"
  myRating: number
  myGoals: number
  opponentGoals: number
}

interface OpponentTeam {
  name: string
  power: number
}

interface MatchEventLine {
  id: number
  text: string
  isGoal: boolean
}

interface StadiumData {
  level: number
  upgrades: string[]
}

interface StadiumUpgradeOption {
  id: string
  name: string
  cost: number
  powerBonus: number
}

interface UserData {
  books: Book[]
  tasks: Task[]
  players: Player[]
  stadium: StadiumData
  energy: number
  bonusCoins: number
  spentCoins: number
  /** מיקומי שחקנים על המפה (מפתח = id שחקן) באחוזים מתוך המגרש */
  pitchPositions: Record<string, { top: number; left: number }>
  currentFormation: FormationType
  lineupAssignments: Record<FormationType, Record<string, number>>
}

export type UserId = "roei" | "yair"

type PageType = "books" | "players" | "field" | "team" | "match" | "tasks"

// Store players available for purchase
interface StorePlayer {
  id: string
  name: string
  price: number
  rating: number
  age: number
  role: string
  countryOfOrigin: string
  teamName: string
}

const storePlayers: StorePlayer[] = [
  // Barcelona
  { id: "gavi", name: "גאבי", price: 20, rating: 12, age: 21, role: "קשר", countryOfOrigin: "ספרד", teamName: "ברצלונה" },
  { id: "lewandowski", name: "לבנדובסקי", price: 65, rating: 32, age: 36, role: "חלוץ", countryOfOrigin: "פולין", teamName: "ברצלונה" },
  { id: "raphinha", name: "ראפינהה", price: 45, rating: 24, age: 28, role: "כנף", countryOfOrigin: "ברזיל", teamName: "ברצלונה" },
  { id: "pedri", name: "פדרי", price: 35, rating: 18, age: 22, role: "קשר", countryOfOrigin: "ספרד", teamName: "ברצלונה" },
  { id: "frenkie", name: "פרנקי דה יונג", price: 50, rating: 26, age: 27, role: "קשר", countryOfOrigin: "הולנד", teamName: "ברצלונה" },
  { id: "ter_stegen", name: "טר סטגן", price: 40, rating: 22, age: 32, role: "שוער", countryOfOrigin: "גרמניה", teamName: "ברצלונה" },
  { id: "pique", name: "פיקה", price: 25, rating: 15, age: 36, role: "בחזית הגנה", countryOfOrigin: "ספרד", teamName: "ברצלונה" },

  // Real Madrid
  { id: "vinicius", name: "ויניסיוס ג'וניור", price: 60, rating: 30, age: 25, role: "כנף", countryOfOrigin: "ברזיל", teamName: "ריאל מדריד" },
  { id: "mbappe", name: "אמבפה", price: 80, rating: 40, age: 26, role: "חלוץ", countryOfOrigin: "צרפת", teamName: "ריאל מדריד" },
  { id: "rodrygo", name: "רודריגו", price: 40, rating: 21, age: 23, role: "כנף", countryOfOrigin: "ברזיל", teamName: "ריאל מדריד" },
  { id: "modric", name: "מודריץ'", price: 35, rating: 20, age: 39, role: "קשר", countryOfOrigin: "קרואטיה", teamName: "ריאל מדריד" },
  { id: "bellingham", name: "בלינגהאם", price: 55, rating: 28, age: 21, role: "קשר הגנתי", countryOfOrigin: "אנגליה", teamName: "ריאל מדריד" },
  { id: "tchouameni", name: "צ'ואמני", price: 45, rating: 23, age: 25, role: "קשר הגנתי", countryOfOrigin: "צרפת", teamName: "ריאל מדריד" },
  { id: "nacho", name: "นาโจ", price: 20, rating: 14, age: 34, role: "בחזית הגנה", countryOfOrigin: "ספרד", teamName: "ריאל מדריד" },
  { id: "courtois", name: "קורטואה", price: 50, rating: 27, age: 32, role: "שוער", countryOfOrigin: "בלגיה", teamName: "ריאל מדריד" },

  // Atletico Madrid
  { id: "griezmann", name: "גריזמן", price: 40, rating: 22, age: 34, role: "חלוץ משנה / כנף", countryOfOrigin: "צרפת", teamName: "אתלטיקו מדריד" },
  { id: "simeone_young", name: "סימאו", price: 35, rating: 20, age: 35, role: "כנף", countryOfOrigin: "פורטוגל", teamName: "אתלטיקו מדריד" },
  { id: "de_paul", name: "דה פאול", price: 38, rating: 21, age: 29, role: "קשר", countryOfOrigin: "ארגנטינה", teamName: "אתלטיקו מדריד" },
  { id: "savic", name: "סאוויץ'", price: 42, rating: 24, age: 34, role: "בחזית הגנה", countryOfOrigin: "מונטנגרו", teamName: "אתלטיקו מדריד" },
  { id: "hermoso", name: "הרמוסו", price: 30, rating: 17, age: 29, role: "בחזית הגנה", countryOfOrigin: "ספרד", teamName: "אתלטיקו מדריד" },

  // Other UCL Teams
  { id: "camavinga", name: "קמאבינגה", price: 25, rating: 14, age: 23, role: "קשר הגנתי", countryOfOrigin: "צרפת", teamName: "מנצ'סטר יונייטד" },
  { id: "dembele", name: "דמבלה", price: 45, rating: 24, age: 28, role: "כנף", countryOfOrigin: "צרפת", teamName: "פריז סן ז'רמן" },
  
  // Bayern Munich
  { id: "kane", name: "קיין", price: 70, rating: 35, age: 31, role: "חלוץ", countryOfOrigin: "אנגליה", teamName: "בייאר מינכן" },
  { id: "muller", name: "מילר", price: 30, rating: 18, age: 35, role: "חלוץ משנה / כנף", countryOfOrigin: "גרמניה", teamName: "בייאר מינכן" },
  { id: "serge_gnabry", name: "סרג' גנאברי", price: 35, rating: 19, age: 28, role: "כנף", countryOfOrigin: "גרמניה", teamName: "בייאר מינכן" },
  { id: "neuer", name: "נויאר", price: 45, rating: 25, age: 38, role: "שוער", countryOfOrigin: "גרמניה", teamName: "בייאר מינכן" },

  // Manchester City
  { id: "haaland", name: "האלאנד", price: 85, rating: 42, age: 24, role: "חלוץ", countryOfOrigin: "נורווגיה", teamName: "מנצ'סטר סיטי" },
  { id: "grealish", name: "גריליש", price: 48, rating: 25, age: 29, role: "כנף", countryOfOrigin: "אנגליה", teamName: "מנצ'סטר סיטי" },
  { id: "foden", name: "פודן", price: 55, rating: 28, age: 24, role: "כנף", countryOfOrigin: "אנגליה", teamName: "מנצ'סטר סיטי" },
  { id: "alvarez", name: "אלווארס", price: 42, rating: 22, age: 24, role: "חלוץ משנה / כנף", countryOfOrigin: "ארגנטינה", teamName: "מנצ'סטר סיטי" },
  { id: "ederson", name: "אדרסון", price: 48, rating: 26, age: 29, role: "שוער", countryOfOrigin: "ברזיל", teamName: "מנצ'סטר סיטי" },

  // Liverpool
  { id: "salah", name: "סלאח", price: 75, rating: 38, age: 32, role: "כנף", countryOfOrigin: "מצרים", teamName: "ליברפול" },
  { id: "diaz", name: "דיאס", price: 45, rating: 23, age: 28, role: "כנף", countryOfOrigin: "קולומביה", teamName: "ליברפול" },
  { id: "nunez", name: "נוניץ", price: 50, rating: 26, age: 25, role: "חלוץ", countryOfOrigin: "אורוגוואי", teamName: "ליברפול" },
  { id: "fabinho", name: "פביניו", price: 35, rating: 20, age: 30, role: "קשר הגנתי", countryOfOrigin: "ברזיל", teamName: "ליברפול" },
  { id: "alisson", name: "אליסון", price: 45, rating: 26, age: 32, role: "שוער", countryOfOrigin: "ברזיל", teamName: "ליברפול" },

  // Paris Saint-Germain
  { id: "neymar", name: "נימאר", price: 70, rating: 33, age: 32, role: "כנף", countryOfOrigin: "ברזיל", teamName: "פריז סן ז'רמן" },
  { id: "messi", name: "מסי", price: 72, rating: 34, age: 37, role: "כנף", countryOfOrigin: "ארגנטינה", teamName: "פריז סן ז'רמן" },
  { id: "veratti", name: "ורטי", price: 38, rating: 21, age: 30, role: "קשר", countryOfOrigin: "איטליה", teamName: "פריז סן ז'רמן" },
  { id: "gianluigi_donnarumma", name: "דונאומה", price: 42, rating: 25, age: 25, role: "שוער", countryOfOrigin: "איטליה", teamName: "פריז סן ז'רמן" },

  // Borussia Dortmund
  { id: "bellingham_bvb", name: "בלינגהאם (בוריסיה)", price: 48, rating: 26, age: 21, role: "קשר הגנתי", countryOfOrigin: "אנגליה", teamName: "בוריסיה דורטמונד" },
  { id: "sancho", name: "סנצ'ו", price: 38, rating: 20, age: 24, role: "כנף", countryOfOrigin: "אנגליה", teamName: "בוריסיה דורטמונד" },
  { id: "gundogan", name: "גונדוגן", price: 32, rating: 19, age: 33, role: "קשר", countryOfOrigin: "גרמניה", teamName: "בוריסיה דורטמונד" },

  // Inter Milan
  { id: "lautaro", name: "לאוטארו מרטינס", price: 52, rating: 27, age: 26, role: "חלוץ", countryOfOrigin: "ארגנטינה", teamName: "אינטר מילאן" },
  { id: "barella", name: "בארלה", price: 42, rating: 23, age: 27, role: "קשר", countryOfOrigin: "איטליה", teamName: "אינטר מילאן" },
  { id: "bastoni", name: "באסטוני", price: 36, rating: 20, age: 25, role: "בחזית הגנה", countryOfOrigin: "איטליה", teamName: "אינטר מילאן" },

  // AC Milan
  { id: "ibrahimovic", name: "אברהימוביץ'", price: 38, rating: 21, age: 42, role: "חלוץ", countryOfOrigin: "שוודיה", teamName: "אייסי מילאן" },
  { id: "leao", name: "ליאו", price: 50, rating: 26, age: 25, role: "כנף", countryOfOrigin: "פורטוגל", teamName: "אייסי מילאן" },
  { id: "calabria", name: "קלברייה", price: 25, rating: 14, age: 27, role: "בחזית הגנה", countryOfOrigin: "איטליה", teamName: "אייסי מילאן" },

  // Juventus
  { id: "vlahovic", name: "ולאהוביץ'", price: 58, rating: 29, age: 24, role: "חלוץ", countryOfOrigin: "סרביה", teamName: "יובנטוס" },
  { id: "pogba", name: "פוגבה", price: 45, rating: 24, age: 31, role: "קשר הגנתי", countryOfOrigin: "צרפת", teamName: "יובנטוס" },
  { id: "bremer", name: "ברמר", price: 38, rating: 21, age: 26, role: "בחזית הגנה", countryOfOrigin: "ברזיל", teamName: "יובנטוס" },

  // Ajax
  { id: "antony", name: "אנטוני", price: 40, rating: 20, age: 24, role: "כנף", countryOfOrigin: "ברזיל", teamName: "אייאקס" },

  // Chelsea
  { id: "mount", name: "מאונט", price: 35, rating: 18, age: 25, role: "כנף", countryOfOrigin: "אנגליה", teamName: "צ'לסי" },
]

// Starting bonus for new users
const STARTING_BONUS = 30

// Fresh start function - creates clean user data
const createFreshUserData = (): Record<UserId, UserData> => ({
  roei: {
    books: [],
    tasks: [],
    players: [],
    stadium: {
      level: 1,
      upgrades: ["יציעים בסיסיים"],
    },
    energy: 0,
    bonusCoins: STARTING_BONUS,
    spentCoins: 0,
    pitchPositions: {},
    currentFormation: "4-3-3",
    lineupAssignments: {
      "4-3-3": {},
      "4-2-3-1": {},
      "3-5-2": {},
      "5-3-2": {},
      "4-4-2": {},
    },
  },
  yair: {
    books: [],
    tasks: [],
    players: [],
    stadium: {
      level: 1,
      upgrades: ["יציעים בסיסיים"],
    },
    energy: 0,
    bonusCoins: STARTING_BONUS,
    spentCoins: 0,
    pitchPositions: {},
    currentFormation: "4-3-3",
    lineupAssignments: {
      "4-3-3": {},
      "4-2-3-1": {},
      "3-5-2": {},
      "5-3-2": {},
      "4-4-2": {},
    },
  },
})

const STORAGE_KEYS: Record<UserId, string> = {
  roei: "reading-game-roy",
  yair: "reading-game-yair",
}

const STAT_UPGRADE_COST = 5
const STAT_UPGRADE_STEP = 5
const PLAYER_MAX_ENERGY = 100
const MATCH_PLAYER_ENERGY_DRAIN = 12
const PLAYER_REFILL_AMOUNT = 25
const PLAYER_REFILL_USER_ENERGY_COST = 5
const DEFAULT_STADIUM: StadiumData = {
  level: 1,
  upgrades: ["יציעים בסיסיים"],
}
const STADIUM_UPGRADES: StadiumUpgradeOption[] = [
  { id: "grass_upgrade", name: "שדרוג דשא", cost: 30, powerBonus: 8 },
  { id: "seats_upgrade", name: "שדרוג מושבים", cost: 25, powerBonus: 6 },
]

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function normalizeBook(raw: Record<string, unknown>): Book {
  const id = typeof raw.id === "number" ? raw.id : Date.now()
  const name = typeof raw.name === "string" ? raw.name : ""
  const pages = typeof raw.pages === "number" ? raw.pages : 0
  const coins = typeof raw.coins === "number" ? raw.coins : 0
  const finishedAt =
    typeof raw.finishedAt === "string"
      ? raw.finishedAt
      : new Date(id).toISOString()
  return { id, name, pages, coins, finishedAt }
}

function normalizeTask(raw: Record<string, unknown>): Task {
  const id = typeof raw.id === "number" ? raw.id : Date.now()
  const title = typeof raw.title === "string" ? raw.title : ""
  const completed = typeof raw.completed === "boolean" ? raw.completed : false
  const createdAt =
    typeof raw.createdAt === "string"
      ? raw.createdAt
      : new Date(id).toISOString()
  return { id, title, completed, createdAt }
}

function normalizeStadium(raw: unknown): StadiumData {
  if (!raw || typeof raw !== "object") {
    return { level: 1, upgrades: ["יציעים בסיסיים"] }
  }

  const obj = raw as Record<string, unknown>
  const level = typeof obj.level === "number" ? Math.max(1, Math.floor(obj.level)) : 1
  const upgrades = Array.isArray(obj.upgrades)
    ? (obj.upgrades.filter((u): u is string => typeof u === "string" && u.trim().length > 0))
    : ["יציעים בסיסיים"]

  return {
    level,
    upgrades: upgrades.length > 0 ? upgrades : ["יציעים בסיסיים"],
  }
}

const getStadiumPowerBonus = (stadium: StadiumData) => {
  return STADIUM_UPGRADES.reduce((sum, upgrade) => {
    return sum + (stadium.upgrades.includes(upgrade.name) ? upgrade.powerBonus : 0)
  }, 0)
}

function normalizePitchPositions(raw: unknown): Record<string, { top: number; left: number }> {
  if (!raw || typeof raw !== "object") return {}
  const out: Record<string, { top: number; left: number }> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue
    const o = v as Record<string, unknown>
    if (typeof o.top === "number" && typeof o.left === "number") {
      out[k] = { top: clamp(o.top, 4, 96), left: clamp(o.left, 4, 96) }
    }
  }
  return out
}

function normalizePlayer(raw: Record<string, unknown>): Player {
  const id = typeof raw.id === "number" ? raw.id : Date.now()
  const name = typeof raw.name === "string" ? raw.name : "?"
  const rating = typeof raw.rating === "number" ? raw.rating : 10
  const storeId =
    typeof raw.storeId === "string"
      ? raw.storeId
      : (storePlayers.find((s) => s.name === name)?.id ?? "gavi")
  const def = storePlayers.find((s) => s.id === storeId) ?? storePlayers[0]

  return {
    id,
    storeId,
    name,
    rating,
    age: typeof raw.age === "number" ? raw.age : def.age,
    role: typeof raw.role === "string" ? raw.role : def.role,
    countryOfOrigin:
      typeof raw.countryOfOrigin === "string" ? raw.countryOfOrigin : def.countryOfOrigin,
    energy: clamp(typeof raw.energy === "number" ? raw.energy : PLAYER_MAX_ENERGY, 0, PLAYER_MAX_ENERGY),
    mentalHealth: clamp(typeof raw.mentalHealth === "number" ? raw.mentalHealth : 70, 0, 100),
    skills: clamp(typeof raw.skills === "number" ? raw.skills : 65, 0, 100),
    teamName: typeof raw.teamName === "string" ? raw.teamName : def.teamName,
  }
}

function normalizeLineupAssignments(raw: unknown): Record<FormationType, Record<string, number>> {
  const empty: Record<FormationType, Record<string, number>> = {
    "4-3-3": {},
    "4-2-3-1": {},
    "3-5-2": {},
    "5-3-2": {},
    "4-4-2": {},
  }
  if (!raw || typeof raw !== "object") return empty
  const out = { ...empty }

  for (const key of Object.keys(empty) as FormationType[]) {
    const block = (raw as Record<string, unknown>)[key]
    if (!block || typeof block !== "object") continue
    const next: Record<string, number> = {}
    for (const [slotId, playerId] of Object.entries(block as Record<string, unknown>)) {
      if (typeof playerId === "number") next[slotId] = playerId
    }
    out[key] = next
  }

  return out
}

function loadUserData(userId: UserId): UserData | null {
  if (typeof window === "undefined") return null
  try {
    const settings = loadSettings()
    const raw = localStorage.getItem(STORAGE_KEYS[userId])
    if (!raw) return null
    const u = JSON.parse(raw) as Record<string, unknown>
    const normalizedTasks = Array.isArray(u.tasks)
      ? (u.tasks as Record<string, unknown>[]).map((t) => normalizeTask(t))
      : []
    return {
      books: Array.isArray(u.books)
        ? (u.books as Record<string, unknown>[]).map((b) => normalizeBook(b))
        : [],
      tasks: normalizedTasks,
      players: Array.isArray(u.players)
        ? (u.players as Record<string, unknown>[]).map((p) => normalizePlayer(p))
        : [],
      stadium: normalizeStadium(u.stadium),
      energy:
        typeof u.energy === "number"
          ? u.energy
          : normalizedTasks.filter((t) => t.completed).length * settings.energyPerTask,
      bonusCoins: typeof u.bonusCoins === "number" ? u.bonusCoins : STARTING_BONUS,
      spentCoins: typeof u.spentCoins === "number" ? u.spentCoins : 0,
      pitchPositions: normalizePitchPositions(u.pitchPositions),
      currentFormation:
        typeof u.currentFormation === "string" && ["4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-4-2"].includes(u.currentFormation)
          ? (u.currentFormation as FormationType)
          : "4-3-3",
      lineupAssignments: normalizeLineupAssignments(u.lineupAssignments),
    }
  } catch {
    return null
  }
}

function saveUserData(userId: UserId, data: UserData) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS[userId], JSON.stringify(data))
  } catch {
    /* ignore quota / private mode */
  }
}

const userNames: Record<UserId, string> = {
  roei: "רועי",
  yair: "יאיר",
}

const OPPONENT_TEAMS: OpponentTeam[] = [
  { name: "קבוצה חלשה", power: 40 },
  { name: "קבוצה בינונית", power: 70 },
  { name: "קבוצה חזקה", power: 100 },
  { name: "הברקים", power: 55 },
  { name: "הנמרים", power: 75 },
  { name: "הכוכבים", power: 90 },
]

const pickRandomOpponent = () =>
  OPPONENT_TEAMS[Math.floor(Math.random() * OPPONENT_TEAMS.length)]

const matchPowerFromPlayer = (p: Player) => {
  const basePower = p.rating + Math.floor(p.mentalHealth / 10) + Math.floor(p.skills / 10)
  const energyMultiplier = 0.5 + p.energy / 200
  return Math.round(basePower * energyMultiplier)
}

/** Formations configuration - מיקומים לכל תבנית משחק */
interface FormationConfig {
  name: string
  description: string
}

interface FormationSlot {
  id: string
  role: string
  top: number
  left: number
}

const FORMATIONS: Record<FormationType, FormationConfig> = {
  "4-3-3": { 
    name: "4-3-3", 
    description: "4 הגנה, 3 קישור, 3 התקפה (מאוזן)" 
  },
  "4-2-3-1": { 
    name: "4-2-3-1", 
    description: "4 הגנה, 2 הגנתיים, 3 קישור, 1 חלוץ (הגנתי)" 
  },
  "3-5-2": { 
    name: "3-5-2", 
    description: "3 הגנה, 5 קישור, 2 חלוצים (התקפי)" 
  },
  "5-3-2": { 
    name: "5-3-2", 
    description: "5 הגנה, 3 קישור, 2 חלוצים (הגנתי מאוד)" 
  },
  "4-4-2": { 
    name: "4-4-2", 
    description: "4 הגנה, 4 קישור, 2 חלוצים (קלאסי)" 
  },
}

const FORMATION_LAYOUTS: Record<FormationType, FormationSlot[]> = {
  "4-3-3": [
    { id: "gk", role: "שוער", top: 92, left: 50 },
    { id: "rb", role: "בחזית הגנה", top: 78, left: 78 },
    { id: "rcb", role: "בחזית הגנה", top: 80, left: 58 },
    { id: "lcb", role: "בחזית הגנה", top: 80, left: 42 },
    { id: "lb", role: "בחזית הגנה", top: 78, left: 22 },
    { id: "rcm", role: "קשר", top: 56, left: 62 },
    { id: "cdm", role: "קשר הגנתי", top: 62, left: 50 },
    { id: "lcm", role: "קשר", top: 56, left: 38 },
    { id: "rw", role: "כנף", top: 24, left: 80 },
    { id: "st", role: "חלוץ", top: 14, left: 50 },
    { id: "lw", role: "כנף", top: 24, left: 20 },
  ],
  "4-2-3-1": [
    { id: "gk", role: "שוער", top: 92, left: 50 },
    { id: "rb", role: "בחזית הגנה", top: 78, left: 78 },
    { id: "rcb", role: "בחזית הגנה", top: 80, left: 58 },
    { id: "lcb", role: "בחזית הגנה", top: 80, left: 42 },
    { id: "lb", role: "בחזית הגנה", top: 78, left: 22 },
    { id: "rdm", role: "קשר הגנתי", top: 62, left: 60 },
    { id: "ldm", role: "קשר הגנתי", top: 62, left: 40 },
    { id: "ram", role: "חלוץ משנה / כנף", top: 40, left: 78 },
    { id: "cam", role: "קשר", top: 38, left: 50 },
    { id: "lam", role: "חלוץ משנה / כנף", top: 40, left: 22 },
    { id: "st", role: "חלוץ", top: 14, left: 50 },
  ],
  "3-5-2": [
    { id: "gk", role: "שוער", top: 92, left: 50 },
    { id: "rcb", role: "בחזית הגנה", top: 80, left: 68 },
    { id: "cb", role: "בחזית הגנה", top: 82, left: 50 },
    { id: "lcb", role: "בחזית הגנה", top: 80, left: 32 },
    { id: "rwb", role: "כנף", top: 58, left: 84 },
    { id: "lwb", role: "כנף", top: 58, left: 16 },
    { id: "rcm", role: "קשר", top: 50, left: 64 },
    { id: "cm", role: "קשר הגנתי", top: 56, left: 50 },
    { id: "lcm", role: "קשר", top: 50, left: 36 },
    { id: "rst", role: "חלוץ", top: 18, left: 58 },
    { id: "lst", role: "חלוץ", top: 18, left: 42 },
  ],
  "5-3-2": [
    { id: "gk", role: "שוער", top: 92, left: 50 },
    { id: "rwb", role: "בחזית הגנה", top: 74, left: 86 },
    { id: "rcb", role: "בחזית הגנה", top: 80, left: 68 },
    { id: "cb", role: "בחזית הגנה", top: 82, left: 50 },
    { id: "lcb", role: "בחזית הגנה", top: 80, left: 32 },
    { id: "lwb", role: "בחזית הגנה", top: 74, left: 14 },
    { id: "rcm", role: "קשר", top: 56, left: 62 },
    { id: "cdm", role: "קשר הגנתי", top: 62, left: 50 },
    { id: "lcm", role: "קשר", top: 56, left: 38 },
    { id: "rst", role: "חלוץ", top: 20, left: 58 },
    { id: "lst", role: "חלוץ", top: 20, left: 42 },
  ],
  "4-4-2": [
    { id: "gk", role: "שוער", top: 92, left: 50 },
    { id: "rb", role: "בחזית הגנה", top: 78, left: 78 },
    { id: "rcb", role: "בחזית הגנה", top: 80, left: 58 },
    { id: "lcb", role: "בחזית הגנה", top: 80, left: 42 },
    { id: "lb", role: "בחזית הגנה", top: 78, left: 22 },
    { id: "rm", role: "כנף", top: 52, left: 80 },
    { id: "rcm", role: "קשר", top: 56, left: 60 },
    { id: "lcm", role: "קשר הגנתי", top: 60, left: 40 },
    { id: "lm", role: "כנף", top: 52, left: 20 },
    { id: "rst", role: "חלוץ", top: 18, left: 58 },
    { id: "lst", role: "חלוץ", top: 18, left: 42 },
  ],
}

const ROLE_FALLBACKS: Record<string, string[]> = {
  "שוער": ["שוער"],
  "בחזית הגנה": ["בחזית הגנה", "קשר הגנתי"],
  "קשר הגנתי": ["קשר הגנתי", "קשר"],
  "קשר": ["קשר", "קשר הגנתי", "חלוץ משנה / כנף"],
  "חלוץ משנה / כנף": ["חלוץ משנה / כנף", "כנף", "קשר", "חלוץ"],
  "כנף": ["כנף", "חלוץ משנה / כנף", "קשר"],
  "חלוץ": ["חלוץ", "חלוץ משנה / כנף", "כנף"],
}

const roleMatchIndex = (slotRole: string, playerRole: string) => {
  const pref = ROLE_FALLBACKS[slotRole] ?? [slotRole]
  const idx = pref.indexOf(playerRole)
  return idx === -1 ? 999 : idx
}

function formatFinishedHe(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

// Organize players by role
interface PlayersByRole {
  [key: string]: StorePlayer[]
}

function organizePlayersByRole(players: StorePlayer[]): PlayersByRole {
  const organized: PlayersByRole = {
    "שוער": [],
    "בחזית הגנה": [],
    "קשר הגנתי": [],
    "קשר": [],
    "חלוץ משנה / כנף": [],
    "כנף": [],
    "חלוץ": [],
  }

  players.forEach((player) => {
    if (organized[player.role]) {
      organized[player.role].push(player)
    } else {
      organized["חלוץ"] = organized["חלוץ"] || []
      organized["חלוץ"].push(player)
    }
  })

  return organized
}

const ROLE_EMOJIS: Record<string, string> = {
  "שוער": "🧤",
  "בחזית הגנה": "🛡️",
  "קשר הגנתי": "⚔️",
  "קשר": "🎯",
  "חלוץ משנה / כנף": "⚡",
  "כנף": "🏃",
  "חלוץ": "⚽",
}

const SLOT_LABELS_HE: Record<string, string> = {
  gk: "שוער",
  rb: "מגן ימין",
  rcb: "בלם ימין",
  cb: "בלם",
  lcb: "בלם שמאל",
  lb: "מגן שמאל",
  rdm: "קשר אחורי ימין",
  ldm: "קשר אחורי שמאל",
  cdm: "קשר אחורי",
  rcm: "קשר מרכז ימין",
  cm: "קשר מרכז",
  lcm: "קשר מרכז שמאל",
  ram: "קשר התקפי ימין",
  cam: "קשר התקפי מרכז",
  lam: "קשר התקפי שמאל",
  rw: "כנף ימין",
  lw: "כנף שמאל",
  rm: "קשר צד ימין",
  lm: "קשר צד שמאל",
  rwb: "ווינגבק ימין",
  lwb: "ווינגבק שמאל",
  st: "חלוץ",
  rst: "חלוץ ימין",
  lst: "חלוץ שמאל",
}

export function ReadingGamePage({ userId }: { userId: UserId }) {
  const currentUser = userId
  const [currentPage, setCurrentPage] = useState<PageType>("books")
  const [userData, setUserData] = useState<Record<UserId, UserData>>(createFreshUserData)
  const [gameSettings, setGameSettings] = useState<Settings>(defaultSettings)
  const [storageReady, setStorageReady] = useState(false)
  const [bookName, setBookName] = useState("")
  const [bookPages, setBookPages] = useState("")
  const [lastBookCoinsReward, setLastBookCoinsReward] = useState<number | null>(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [matchEvents, setMatchEvents] = useState<MatchEventLine[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [nextOpponent, setNextOpponent] = useState<OpponentTeam>(pickRandomOpponent)
  const [activeOpponent, setActiveOpponent] = useState<OpponentTeam | null>(null)
  const [dragPreview, setDragPreview] = useState<{
    playerId: number
    top: number
    left: number
  } | null>(null)

  const pitchRef = useRef<HTMLDivElement>(null)
  const userDataRef = useRef(userData)
  const currentUserRef = useRef<UserId>(userId)
  const dragSessionRef = useRef<{
    playerId: number
    userId: UserId
    pointerId: number
  } | null>(null)
  const dragListenersRef = useRef<{
    move: (e: PointerEvent) => void
    up: (e: PointerEvent) => void
  } | null>(null)
  const dragLastPctRef = useRef<{ top: number; left: number } | null>(null)
  const matchTimersRef = useRef<number[]>([])

  userDataRef.current = userData
  currentUserRef.current = userId

  const clientToPitchPct = useCallback((clientX: number, clientY: number) => {
    const el = pitchRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return null
    return {
      left: clamp(((clientX - r.left) / r.width) * 100, 4, 96),
      top: clamp(((clientY - r.top) / r.height) * 100, 4, 96),
    }
  }, [])

  const clearPitchPosition = useCallback((playerId: number) => {
    const uid = currentUserRef.current
    setUserData((prev) => {
      const nextPos = { ...prev[uid].pitchPositions }
      delete nextPos[String(playerId)]
      return {
        ...prev,
        [uid]: { ...prev[uid], pitchPositions: nextPos },
      }
    })
  }, [])

  const startPlayerDrag = useCallback(
    (e: React.PointerEvent, owned: Player, defaultPos: { top: number; left: number }) => {
      e.preventDefault()
      e.stopPropagation()
      const uid = currentUserRef.current
      const saved = userDataRef.current[uid].pitchPositions[String(owned.id)]
      const base = saved ?? defaultPos
      const p = clientToPitchPct(e.clientX, e.clientY) ?? base

      if (dragListenersRef.current) {
        window.removeEventListener("pointermove", dragListenersRef.current.move)
        window.removeEventListener("pointerup", dragListenersRef.current.up)
        dragListenersRef.current = null
      }

      dragSessionRef.current = { playerId: owned.id, userId: uid, pointerId: e.pointerId }
      dragLastPctRef.current = { top: p.top, left: p.left }
      setDragPreview({ playerId: owned.id, top: p.top, left: p.left })

      const onMove = (ev: PointerEvent) => {
        const sess = dragSessionRef.current
        if (!sess || ev.pointerId !== sess.pointerId) return
        const next = clientToPitchPct(ev.clientX, ev.clientY)
        if (!next) return
        dragLastPctRef.current = next
        setDragPreview({ playerId: sess.playerId, top: next.top, left: next.left })
      }

      const onUp = (ev: PointerEvent) => {
        const sess = dragSessionRef.current
        if (!sess || ev.pointerId !== sess.pointerId) return
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        dragListenersRef.current = null
        dragSessionRef.current = null
        const final =
          clientToPitchPct(ev.clientX, ev.clientY) ?? dragLastPctRef.current
        dragLastPctRef.current = null
        setDragPreview(null)
        if (!sess || !final) return
        setUserData((prev) => ({
          ...prev,
          [sess.userId]: {
            ...prev[sess.userId],
            pitchPositions: {
              ...prev[sess.userId].pitchPositions,
              [String(sess.playerId)]: { top: final.top, left: final.left },
            },
          },
        }))
      }

      dragListenersRef.current = { move: onMove, up: onUp }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [clientToPitchPct]
  )

  useEffect(() => {
    return () => {
      const l = dragListenersRef.current
      if (l) {
        window.removeEventListener("pointermove", l.move)
        window.removeEventListener("pointerup", l.up)
        dragListenersRef.current = null
      }
      dragSessionRef.current = null

      matchTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      matchTimersRef.current = []
    }
  }, [])

  useEffect(() => {
    setGameSettings(loadSettings())
    const loaded = loadUserData(userId)
    if (loaded) {
      setUserData((prev) => ({
        ...prev,
        [userId]: loaded,
      }))
    }
    setStorageReady(true)
  }, [userId])

  useEffect(() => {
    if (!storageReady) return
    saveUserData(userId, userData[userId])
  }, [userData, storageReady, userId])

  useEffect(() => {
    setUserData((prev) => {
      let changed = false
      const next: Record<UserId, UserData> = { ...prev }
      for (const uid of ["roei", "yair"] as UserId[]) {
        const block = prev[uid]
        if (!block?.stadium) {
          changed = true
          next[uid] = {
            ...block,
            stadium: { ...DEFAULT_STADIUM },
          }
        }
      }
      return changed ? next : prev
    })
  }, [])

  // Get current user data
  const books = userData[currentUser].books
  const tasks = userData[currentUser].tasks
  const players = userData[currentUser].players
  const stadium = userData[currentUser].stadium ?? DEFAULT_STADIUM
  const energy = userData[currentUser].energy ?? 0
  const pitchPositions = userData[currentUser].pitchPositions ?? {}
  const currentFormation = userData[currentUser].currentFormation ?? "4-3-3"
  const currentFormationSlots = FORMATION_LAYOUTS[currentFormation] ?? []
  const formationAssignments = userData[currentUser].lineupAssignments[currentFormation] ?? {}

  const assignedPlayersBySlot: Record<string, Player | undefined> = {}
  const usedPlayerIds = new Set<number>()
  const playersById = new Map(players.map((p) => [p.id, p]))

  for (const slot of currentFormationSlots) {
    const assignedId = formationAssignments[slot.id]
    if (!assignedId) continue
    const assigned = playersById.get(assignedId)
    if (!assigned || usedPlayerIds.has(assigned.id)) continue
    if (roleMatchIndex(slot.role, assigned.role) >= 999) continue
    assignedPlayersBySlot[slot.id] = assigned
    usedPlayerIds.add(assigned.id)
  }

  for (const slot of currentFormationSlots) {
    if (assignedPlayersBySlot[slot.id]) continue
    const candidate = players
      .filter((p) => !usedPlayerIds.has(p.id))
      .map((p) => ({
        player: p,
        roleScore: roleMatchIndex(slot.role, p.role),
        powerScore: matchPowerFromPlayer(p),
      }))
      .filter((x) => x.roleScore < 999)
      .sort((a, b) => {
        if (a.roleScore !== b.roleScore) return a.roleScore - b.roleScore
        return b.powerScore - a.powerScore
      })[0]

    if (candidate) {
      assignedPlayersBySlot[slot.id] = candidate.player
      usedPlayerIds.add(candidate.player.id)
    }
  }

  const assignedPlayerIds = new Set(
    Object.values(assignedPlayersBySlot)
      .filter((p): p is Player => Boolean(p))
      .map((p) => p.id)
  )
  const lineupPlayers = Object.values(assignedPlayersBySlot).filter(
    (p): p is Player => Boolean(p)
  )
  const lineupPlayersNeedingEnergy = lineupPlayers.filter((p) => p.energy < PLAYER_MAX_ENERGY)
  const lineupRefillCost = lineupPlayersNeedingEnergy.length * PLAYER_REFILL_USER_ENERGY_COST
  const canRefillLineupEnergy = lineupPlayersNeedingEnergy.length > 0 && energy >= lineupRefillCost
  const stadiumPowerBonus = getStadiumPowerBonus(stadium)

  // Calculate total coins (books + starting bonus)
  const bonusCoins = userData[currentUser].bonusCoins ?? STARTING_BONUS
  const booksCoinsEarned = books.reduce((sum, book) => sum + book.coins, 0)
  const totalCoins = booksCoinsEarned + bonusCoins

  // Get spent coins from state (tracked when buying players)
  const spentCoins = userData[currentUser].spentCoins ?? 0

  // Available coins
  const availableCoins = totalCoins - spentCoins

  const completedTasksCount = tasks.filter((t) => t.completed).length
  const tasksEnergyEarned = completedTasksCount * gameSettings.energyPerTask
  const playersPower = players.reduce((sum, player) => sum + matchPowerFromPlayer(player), 0)
  const averagePlayerEnergy =
    players.length > 0
      ? Math.round(players.reduce((sum, player) => sum + player.energy, 0) / players.length)
      : 0

  // Team power = players power + stadium power
  const teamRating = playersPower + stadiumPowerBonus

  const calculateCoins = (pages: number) => {
    return calculateReadingCoins(pages, gameSettings)
  }

  // Check if can play match (need at least 2 players + enough user energy)
  const canPlayMatchByPlayers = players.length >= 2
  const hasEnoughEnergyForMatch = energy >= gameSettings.matchCost
  const canPlayMatch = canPlayMatchByPlayers && hasEnoughEnergyForMatch

  // Switch user
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
      finishedAt: new Date().toISOString(),
    }

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        books: [...prev[currentUser].books, newBook],
      },
    }))
    setLastBookCoinsReward(newBook.coins)
    setBookName("")
    setBookPages("")
  }

  const addTask = () => {
    if (!taskTitle.trim()) return

    const newTask: Task = {
      id: Date.now(),
      title: taskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        tasks: [newTask, ...prev[currentUser].tasks],
      },
    }))
    setTaskTitle("")
  }

  const completeTask = (taskId: number) => {
    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        energy:
          (prev[currentUser].energy ?? 0) +
          (prev[currentUser].tasks.some((task) => task.id === taskId && !task.completed)
            ? gameSettings.energyPerTask
            : 0),
        tasks: prev[currentUser].tasks.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        ),
      },
    }))
  }

  // Buy a player
  const buyPlayer = (storePlayer: StorePlayer) => {
    if (availableCoins < storePlayer.price) return

    const newPlayer: Player = {
      id: Date.now(),
      storeId: storePlayer.id,
      name: storePlayer.name,
      rating: storePlayer.rating,
      age: storePlayer.age,
      role: storePlayer.role,
      countryOfOrigin: storePlayer.countryOfOrigin,
      energy: PLAYER_MAX_ENERGY,
      mentalHealth: 70,
      skills: 65,
      teamName: storePlayer.teamName,
    }

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        players: [...prev[currentUser].players, newPlayer],
        spentCoins: (prev[currentUser].spentCoins ?? 0) + storePlayer.price,
      },
    }))
  }

  const setLineupAssignment = (slotId: string, playerIdRaw: string) => {
    const playerId = playerIdRaw ? Number(playerIdRaw) : 0
    setUserData((prev) => {
      const currentAssignments = prev[currentUser].lineupAssignments[currentFormation] ?? {}
      const nextAssignments = { ...currentAssignments }
      if (!playerId || Number.isNaN(playerId)) {
        delete nextAssignments[slotId]
      } else {
        nextAssignments[slotId] = playerId
      }

      return {
        ...prev,
        [currentUser]: {
          ...prev[currentUser],
          lineupAssignments: {
            ...prev[currentUser].lineupAssignments,
            [currentFormation]: nextAssignments,
          },
        },
      }
    })
  }

  const upgradeMentalHealth = (playerId: number) => {
    const p = players.find((x) => x.id === playerId)
    if (!p || p.mentalHealth >= 100) return
    if (availableCoins < STAT_UPGRADE_COST) return

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        spentCoins: (prev[currentUser].spentCoins ?? 0) + STAT_UPGRADE_COST,
        players: prev[currentUser].players.map((pl) =>
          pl.id === playerId
            ? { ...pl, mentalHealth: Math.min(100, pl.mentalHealth + STAT_UPGRADE_STEP) }
            : pl
        ),
      },
    }))
  }

  const upgradeSkills = (playerId: number) => {
    const p = players.find((x) => x.id === playerId)
    if (!p || p.skills >= 100) return
    if (availableCoins < STAT_UPGRADE_COST) return

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        spentCoins: (prev[currentUser].spentCoins ?? 0) + STAT_UPGRADE_COST,
        players: prev[currentUser].players.map((pl) =>
          pl.id === playerId
            ? { ...pl, skills: Math.min(100, pl.skills + STAT_UPGRADE_STEP) }
            : pl
        ),
      },
    }))
  }

  const refillPlayerEnergy = (playerId: number) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.energy >= PLAYER_MAX_ENERGY) return
    if (energy < PLAYER_REFILL_USER_ENERGY_COST) return

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        energy: Math.max(0, (prev[currentUser].energy ?? 0) - PLAYER_REFILL_USER_ENERGY_COST),
        players: prev[currentUser].players.map((pl) =>
          pl.id === playerId
            ? { ...pl, energy: Math.min(PLAYER_MAX_ENERGY, pl.energy + PLAYER_REFILL_AMOUNT) }
            : pl
        ),
      },
    }))
  }

  const refillCurrentLineupEnergy = () => {
    if (!canRefillLineupEnergy) return
    const lineupIds = new Set(lineupPlayersNeedingEnergy.map((p) => p.id))

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        energy: Math.max(0, (prev[currentUser].energy ?? 0) - lineupRefillCost),
        players: prev[currentUser].players.map((pl) =>
          lineupIds.has(pl.id)
            ? { ...pl, energy: Math.min(PLAYER_MAX_ENERGY, pl.energy + PLAYER_REFILL_AMOUNT) }
            : pl
        ),
      },
    }))
  }

  const clearMatchTimers = () => {
    matchTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    matchTimersRef.current = []
  }

  const randomPlayerName = () => {
    if (players.length === 0) return "השחקן שלנו"
    const picked = players[Math.floor(Math.random() * players.length)]
    return picked.name
  }

  const pickScoreByPowers = (myPower: number, opponentPower: number) => {
    const myEffectivePower = myPower + (Math.random() * 16 - 8)
    const opponentEffectivePower = opponentPower + (Math.random() * 16 - 8)
    const diff = myEffectivePower - opponentEffectivePower

    if (diff >= 18) {
      return Math.random() < 0.5
        ? { outcome: "win" as const, myGoals: 2, opponentGoals: 0 }
        : { outcome: "win" as const, myGoals: 2, opponentGoals: 1 }
    }

    if (diff >= 6) {
      return Math.random() < 0.5
        ? { outcome: "win" as const, myGoals: 1, opponentGoals: 0 }
        : { outcome: "win" as const, myGoals: 2, opponentGoals: 1 }
    }

    if (diff <= -18) {
      return Math.random() < 0.5
        ? { outcome: "lose" as const, myGoals: 0, opponentGoals: 2 }
        : { outcome: "lose" as const, myGoals: 1, opponentGoals: 2 }
    }

    if (diff <= -6) {
      return Math.random() < 0.5
        ? { outcome: "lose" as const, myGoals: 0, opponentGoals: 1 }
        : { outcome: "lose" as const, myGoals: 1, opponentGoals: 2 }
    }

    const drawOptions = [
      { outcome: "draw" as const, myGoals: 0, opponentGoals: 0 },
      { outcome: "draw" as const, myGoals: 1, opponentGoals: 1 },
      { outcome: "draw" as const, myGoals: 2, opponentGoals: 2 },
    ]

    return drawOptions[Math.floor(Math.random() * drawOptions.length)]
  }

  const buildMatchEvents = ({
    opponent,
    myGoals,
    opponentGoals,
  }: {
    opponent: OpponentTeam
    myGoals: number
    opponentGoals: number
  }) => {
    const eventsCount = 4 + Math.floor(Math.random() * 3)
    const userStarts = Math.random() < 0.5
    const userTurnIndexes: number[] = []
    const opponentTurnIndexes: number[] = []

    for (let index = 0; index < eventsCount; index++) {
      const isUserTurn = userStarts ? index % 2 === 0 : index % 2 === 1
      if (isUserTurn) {
        userTurnIndexes.push(index)
      } else {
        opponentTurnIndexes.push(index)
      }
    }

    const shuffleIndexes = (indexes: number[]) => [...indexes].sort(() => Math.random() - 0.5)

    const userGoalIndexes = new Set(shuffleIndexes(userTurnIndexes).slice(0, myGoals))
    const opponentGoalIndexes = new Set(shuffleIndexes(opponentTurnIndexes).slice(0, opponentGoals))

    return Array.from({ length: eventsCount }, (_, index) => {
      const isUserTurn = userStarts ? index % 2 === 0 : index % 2 === 1
      const playerName = randomPlayerName()

      if (isUserTurn) {
        if (userGoalIndexes.has(index)) {
          return {
            id: Date.now() + index,
            text: `🥅⚽ גול! ${playerName} כובש מול ${opponent.name}!`,
            isGoal: true,
          }
        }

        const userMoments = [
          `🏃⚽ ${playerName} פורץ קדימה מול ${opponent.name}!`,
          `💥 ${playerName} בועט, אבל ${opponent.name} ניצלת בקושי!`,
          `👏 מהלך יפה של ${playerName}, הלחץ על ${opponent.name} נמשך!`,
        ]

        return {
          id: Date.now() + index,
          text: userMoments[Math.floor(Math.random() * userMoments.length)],
          isGoal: false,
        }
      }

      if (opponentGoalIndexes.has(index)) {
        return {
          id: Date.now() + index,
          text: `😮🥅 ${opponent.name} כובשת! צריך להגיב מהר!`,
          isGoal: true,
        }
      }

      const opponentMoments = [
        `⚠️ ${opponent.name} תוקפת עכשיו!`,
        `🛡️ הגנה מצוינת! עצרנו התקפה של ${opponent.name}!`,
        `😅 ${opponent.name} מנסה לאיים, אבל הכדור יוצא החוצה.`,
      ]

      return {
        id: Date.now() + index,
        text: opponentMoments[Math.floor(Math.random() * opponentMoments.length)],
        isGoal: false,
      }
    })
  }

  const buyStadiumUpgrade = (upgrade: StadiumUpgradeOption) => {
    if (availableCoins < upgrade.cost) return
    if (stadium.upgrades.includes(upgrade.name)) return

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        spentCoins: (prev[currentUser].spentCoins ?? 0) + upgrade.cost,
        stadium: {
          level: (prev[currentUser].stadium?.level ?? 1) + 1,
          upgrades: [...(prev[currentUser].stadium?.upgrades ?? ["יציעים בסיסיים"]), upgrade.name],
        },
      },
    }))
  }

  // Play a match
  const playMatch = () => {
    if (players.length === 0) {
      setMatchResult(null)
      setMatchEvents([{ id: Date.now(), text: "אין מספיק שחקנים", isGoal: false }])
      return
    }
    if (!canPlayMatch) return

    const selectedOpponent = nextOpponent
    const scoreResult = pickScoreByPowers(teamRating, selectedOpponent.power)
    const generatedEvents = buildMatchEvents({
      opponent: selectedOpponent,
      myGoals: scoreResult.myGoals,
      opponentGoals: scoreResult.opponentGoals,
    })

    clearMatchTimers()
    setIsPlaying(true)
    setMatchResult(null)
    setMatchEvents([])
    setActiveOpponent(selectedOpponent)

    setUserData((prev) => ({
      ...prev,
      [currentUser]: {
        ...prev[currentUser],
        energy: Math.max(0, (prev[currentUser].energy ?? 0) - gameSettings.matchCost),
        players: prev[currentUser].players.map((pl) => ({
          ...pl,
          energy: Math.max(0, pl.energy - MATCH_PLAYER_ENERGY_DRAIN),
        })),
      },
    }))

    generatedEvents.forEach((eventLine, idx) => {
      const timerId = window.setTimeout(() => {
        setMatchEvents((prev) => [...prev, eventLine])
      }, (idx + 1) * 1000)
      matchTimersRef.current.push(timerId)
    })

    const finalizeTimerId = window.setTimeout(() => {
      setMatchResult({
        opponentPower: selectedOpponent.power,
        opponentName: selectedOpponent.name,
        outcome: scoreResult.outcome,
        myRating: teamRating,
        myGoals: scoreResult.myGoals,
        opponentGoals: scoreResult.opponentGoals,
      })
      setIsPlaying(false)
      setActiveOpponent(null)
      setNextOpponent(pickRandomOpponent())
      clearMatchTimers()
    }, (generatedEvents.length + 1) * 1000)
    matchTimersRef.current.push(finalizeTimerId)
  }

  const shownOpponent = activeOpponent ?? nextOpponent
  const liveOpponentName = activeOpponent?.name ?? matchResult?.opponentName ?? nextOpponent.name
  const isMatchWin = matchResult?.outcome === "win"
  const isMatchDraw = matchResult?.outcome === "draw"

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

        {/* Current User */}
        <Card className="mb-6 border-3 border-accent/50 shadow-xl">
          <CardContent className="py-5">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-center text-2xl font-bold text-muted-foreground sm:text-right">
                {"👤"} שחקן: <span className="text-primary">{userNames[currentUser]}</span>
              </p>
              <Link href="/" className="inline-flex">
                <Button variant="secondary" className="text-lg font-bold">
                  {"🏠"} חזרה לבית
                </Button>
              </Link>
            </div>
            <p className="text-center mt-4 text-xl font-semibold text-primary">
              {"🎮"} עכשיו משחק: <span className="text-2xl">{userNames[currentUser]}</span> {"🎮"}
            </p>
          </CardContent>
        </Card>

        {/* Main Dashboard */}
        <Card className="mb-6 border-3 border-primary/30 shadow-xl">
          <CardHeader className="py-4">
            <CardTitle className="text-center text-2xl text-primary" dir="rtl">
              {"📊"} לוח בקרה ראשי
            </CardTitle>
          </CardHeader>
          <CardContent dir="rtl" className="pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-gold/50 bg-gold/15 p-4 text-center">
                <p className="text-base font-bold">{"💰"} מטבעות</p>
                <p className="text-4xl font-black text-gold-foreground mt-1">{availableCoins}</p>
                <p className="text-xs text-muted-foreground mt-1">מספר המטבעות לקניות ושדרוגים</p>
              </div>
              <div className="rounded-2xl border-2 border-secondary/40 bg-secondary/15 p-4 text-center">
                <p className="text-base font-bold">{"⚡"} אנרגיה</p>
                <p className="text-4xl font-black text-secondary mt-1">{energy}</p>
                <p className="text-xs text-muted-foreground mt-1">משמשת למילוי אנרגיית שחקנים</p>
              </div>
              <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 text-center">
                <p className="text-base font-bold">{"⚽"} כוח קבוצה</p>
                <p className="text-4xl font-black text-primary mt-1">{teamRating}</p>
                <p className="text-xs text-muted-foreground mt-1">כולל בונוס אצטדיון</p>
              </div>
              <div className="rounded-2xl border-2 border-emerald-600/40 bg-emerald-600/10 p-4 text-center">
                <p className="text-base font-bold">{"🏟️"} רמת אצטדיון</p>
                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stadium.level}</p>
                <p className="text-xs text-muted-foreground mt-1">שדרוגים מעלים כוח קבוצה</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-2 border-muted/60 shadow-lg">
          <CardContent className="py-4" dir="rtl">
            <p className="text-center text-lg font-black text-foreground">{"🔗"} חיבור המערכות</p>
            <div className="mt-3 space-y-2 text-center">
              <p className="rounded-lg bg-primary/10 p-2 text-sm font-bold">
                {"🏟️⚽"} שחקנים / אצטדיון {"⬅️"} {"💰"} מטבעות {"⬅️"} {"📚"} קריאה
              </p>
              <p className="rounded-lg bg-secondary/10 p-2 text-sm font-bold">
                {"⚔️"} משחקים {"⬅️"} {"⚡"} אנרגיה {"⬅️"} {"✅"} משימות
              </p>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-lg bg-muted/40 p-2"><span className="font-bold">ספרים → מטבעות:</span> {booksCoinsEarned}</p>
              <p className="rounded-lg bg-muted/40 p-2"><span className="font-bold">משימות שהושלמו → אנרגיה:</span> {completedTasksCount} ({tasksEnergyEarned} אנרגיה)</p>
              <p className="rounded-lg bg-muted/40 p-2"><span className="font-bold">אנרגיית שחקנים ממוצעת:</span> {averagePlayerEnergy}/100</p>
              <p className="rounded-lg bg-muted/40 p-2"><span className="font-bold">בונוס אצטדיון:</span> +{stadiumPowerBonus}</p>
            </div>
          </CardContent>
        </Card>

        {/* Page Navigation */}
        <Card className="mb-6 border-3 border-secondary/40 shadow-xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              <Button
                onClick={() => setCurrentPage("books")}
                className={`text-sm md:text-base font-bold h-auto py-3 transition-all ${
                  currentPage === "books"
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {"📚"} ספרים
              </Button>
              <Button
                onClick={() => setCurrentPage("players")}
                className={`text-sm md:text-base font-bold h-auto py-3 transition-all ${
                  currentPage === "players"
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {"🏪"} חנות
              </Button>
              <Button
                onClick={() => setCurrentPage("team")}
                className={`text-sm md:text-base font-bold h-auto py-3 transition-all ${
                  currentPage === "team"
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {"⚽"} קבוצה
              </Button>
              <Button
                onClick={() => setCurrentPage("field")}
                className={`text-sm md:text-base font-bold h-auto py-3 transition-all ${
                  currentPage === "field"
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {"🗺️"} שדה
              </Button>
              <Button
                onClick={() => setCurrentPage("match")}
                className={`text-sm md:text-base font-bold h-auto py-3 transition-all ${
                  currentPage === "match"
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {"⚔️"} משחק
              </Button>
              <Button
                onClick={() => setCurrentPage("tasks")}
                className={`text-sm md:text-base font-bold h-auto py-3 transition-all ${
                  currentPage === "tasks"
                    ? "bg-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/50"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {"✅"} משימות
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pages Content */}
        <div>
          {/* Books Page */}
          {currentPage === "books" && (
          <Card className="border-3 border-primary/40 shadow-xl">
            <CardHeader className="bg-primary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-primary">
                <span className="text-4xl">{"📚"}</span>
                הספרים שלי
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6" dir="rtl">
              <Tabs defaultValue="add" dir="rtl" className="w-full gap-4">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1.5 text-base sm:text-lg">
                  <TabsTrigger value="add" className="py-3 font-bold">
                    {"➕"} ספר חדש
                  </TabsTrigger>
                  <TabsTrigger value="finished" className="py-3 font-bold">
                    {"✅"} ספרים שסיימתי ({books.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="mt-4 space-y-5 text-right">
                  <div>
                    <label className="block text-lg font-semibold mb-2">{"📖"} שם הספר</label>
                    <Input
                      type="text"
                      dir="rtl"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="הכניסו את שם הספר..."
                      className="text-xl h-14 border-2 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold mb-2">{"📄"} מספר עמודים</label>
                    <Input
                      type="number"
                      dir="rtl"
                      value={bookPages}
                      onChange={(e) => setBookPages(e.target.value)}
                      placeholder="כמה עמודים בספר?"
                      min="1"
                      inputMode="numeric"
                      className="text-xl h-14 border-2 text-right"
                    />
                  </div>
                  {bookPages && !isNaN(parseInt(bookPages)) && parseInt(bookPages) > 0 && (
                    <div className="rounded-xl border-2 border-gold/40 bg-gold/20 p-4 text-right">
                      <p className="text-xl font-bold text-gold-foreground">
                        {"💰"} תקבלו: <span className="text-3xl">{calculateCoins(parseInt(bookPages))}</span>{" "}
                        מטבעות! {"💰"}
                      </p>
                      <p className="text-sm font-semibold text-gold-foreground/80 mt-1">
                        חישוב מטבעות: (עמודים / 10) × {gameSettings.coinsPer10Pages} + בונוס {gameSettings.bookBonus}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={addBook}
                    disabled={
                      !bookName.trim() ||
                      !bookPages ||
                      isNaN(parseInt(bookPages)) ||
                      parseInt(bookPages) <= 0
                    }
                    className="w-full h-16 text-2xl font-bold bg-primary hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                  >
                    <span className="text-3xl me-3">{"➕"}</span>
                    סימנתי ספר שהסתיים
                  </Button>
                  {lastBookCoinsReward !== null && (
                    <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/15 p-3 text-right">
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                        {"🎉"} כל הכבוד! הרווחתם {lastBookCoinsReward} מטבעות מהספר האחרון
                      </p>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {"📌"} אחרי שמוסיפים ספר, הוא נשמר בלשונית ספרים שסיימתי לצפייה בכל עת.
                  </p>
                </TabsContent>

                <TabsContent value="finished" className="mt-4">
                  {books.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-muted bg-muted/30 py-10 text-center">
                      <span className="text-5xl">{"📖"}</span>
                      <p className="mt-3 text-lg font-bold text-muted-foreground">עדיין אין ספרים ברשימה</p>
                      <p className="mt-1 text-muted-foreground">הוסיפו ספר בלשונית ספר חדש</p>
                    </div>
                  ) : (
                    <div className="max-h-[min(28rem,70vh)] space-y-3 overflow-y-auto ps-1">
                      {[...books]
                        .sort(
                          (a, b) =>
                            new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
                        )
                        .map((book) => (
                          <div
                            key={book.id}
                            className="rounded-2xl border-2 border-primary/25 bg-primary/5 p-4 text-right shadow-sm"
                          >
                            <h3 className="text-xl font-black leading-snug text-foreground">{book.name}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {book.pages} עמודים {"•"} {book.coins} מטבעות {"💰"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-primary/90">
                              {"🗓️"} סיום: {formatFinishedHe(book.finishedAt)}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          )}

          {/* Store Section */}
          {currentPage === "players" && (
          <Card className="border-3 border-secondary/40 shadow-xl">
            <CardHeader className="bg-secondary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-secondary">
                <span className="text-4xl">{"🏪"}</span>
                חנות שחקנים
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div dir="rtl" className="rounded-xl border-2 border-gold/40 bg-gold/15 p-3 text-center">
                <p className="text-sm font-black text-gold-foreground">
                  {"💰"} כל הקניות בחנות נעשות רק עם מטבעות (בלי אנרגיה {"⚡"})
                </p>
              </div>
              {Object.entries(organizePlayersByRole(storePlayers)).map(([role, playersInRole]) =>
                playersInRole.length === 0 ? null : (
                  <div key={role} className="space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b-2 border-secondary/20">
                      <span className="text-3xl">{ROLE_EMOJIS[role]}</span>
                      <h3 className="text-2xl font-bold text-secondary">{role}</h3>
                      <span className="text-sm font-semibold text-muted-foreground ms-auto">
                        {playersInRole.length} שחקנים
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {playersInRole.map((storePlayer) => {
                        const canAfford = availableCoins >= storePlayer.price
                        const alreadyOwned = players.some((p) => p.storeId === storePlayer.id)
                        return (
                          <div
                            key={storePlayer.id}
                            className={`relative flex flex-col items-center rounded-2xl p-4 border-4 transition-all ${
                              alreadyOwned
                                ? "bg-primary/20 border-primary/50 opacity-70"
                                : canAfford 
                                  ? "bg-gradient-to-b from-secondary/20 to-secondary/5 border-secondary/40 hover:scale-105 hover:shadow-xl" 
                                  : "bg-muted/50 border-muted/60 opacity-50"
                            }`}
                          >
                            <div className="absolute -top-2 -end-2 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-black text-lg shadow-lg border-2 border-card">
                              {storePlayer.rating}
                            </div>
                            
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center text-4xl shadow-inner border-2 border-secondary/30 mb-3">
                              {"⚽"}
                            </div>
                            
                            <h3 className="font-black text-lg text-center mb-2 text-foreground">
                              {storePlayer.name}
                            </h3>

                            <div className="w-full text-center text-sm text-muted-foreground space-y-1 mb-2 leading-snug">
                              <p>
                                <span className="font-semibold text-foreground">גיל:</span> {storePlayer.age}
                              </p>
                              <p>
                                <span className="font-semibold text-foreground">מוצא:</span>{" "}
                                {storePlayer.countryOfOrigin}
                              </p>
                              <p>
                                <span className="font-semibold text-foreground">{"🏟️"}:</span>{" "}
                                {storePlayer.teamName}
                              </p>
                            </div>
                            
                            {/* Price */}
                            <div className="flex items-center gap-1 bg-gold/30 rounded-full px-4 py-1 mb-3 border border-gold/50">
                              <span className="text-lg">{"💰"}</span>
                              <span className="font-bold text-gold-foreground">{storePlayer.price}</span>
                            </div>
                            
                            {/* Buy Button */}
                            {alreadyOwned ? (
                              <div className="w-full h-12 flex items-center justify-center bg-primary/30 rounded-xl text-primary font-bold text-lg">
                                {"✓"} בקבוצה
                              </div>
                            ) : (
                              <Button
                                onClick={() => buyPlayer(storePlayer)}
                                disabled={!canAfford}
                                className={`w-full h-12 text-lg font-bold transition-transform ${
                                  canAfford 
                                    ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground hover:scale-105 active:scale-95" 
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {"🛒"} קנה ב־{"💰"}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
              <div className="mt-6 bg-muted/60 rounded-xl p-4 text-center border-2 border-muted">
                <p className="text-lg text-muted-foreground">
                  {"📚"} קראו ספרים כדי להרוויח מטבעות וקנו שחקנים! {"⚽"}
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Field Page */}
          {currentPage === "field" && (
          <Card className="border-3 border-emerald-600/35 shadow-xl overflow-hidden">
            <CardHeader className="rounded-t-lg bg-emerald-600/15 py-5">
              <CardTitle className="flex flex-wrap items-center gap-3 text-2xl text-emerald-900 dark:text-emerald-100">
                <span className="text-4xl">{"🗺️"}</span>
                מפת תפקידים על המגרש
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-center text-base text-muted-foreground leading-relaxed">
                {"🧭"} למעלה שער היריב, למטה השער שלכם — כך רואים איפה כל תפקיד. שחקנים שקניתם מופיעים על המפה לפי
                התפקיד שלהם.
              </p>
              <p dir="rtl" className="text-center text-sm font-semibold text-emerald-900 dark:text-emerald-100/90">
                {"✋"} גררו שחקן כדי להזיז אותו על המגרש. לחיצה כפולה על השחקן מחזירה למיקום ברירת המחדל.
              </p>

              {/* Formation Switcher */}
              <div className="bg-emerald-600/10 rounded-xl p-4 border-2 border-emerald-600/30">
                <p className="text-center font-bold text-lg mb-3 text-emerald-900 dark:text-emerald-100">
                  {"⚔️"} בחרו תבנית משחק
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(FORMATIONS) as Array<[FormationType, FormationConfig]>).map(([formKey, formConfig]) => (
                    <Button
                      key={formKey}
                      onClick={() => {
                        setUserData((prev) => ({
                          ...prev,
                          [currentUser]: {
                            ...prev[currentUser],
                            currentFormation: formKey,
                            pitchPositions: {}, // Reset positions when changing formation
                          },
                        }))
                      }}
                      className={`text-sm font-bold h-auto py-2 transition-all ${
                        userData[currentUser].currentFormation === formKey
                          ? "bg-emerald-600 text-white scale-105 shadow-lg ring-2 ring-emerald-400"
                          : "bg-emerald-600/20 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-600/40"
                      }`}
                    >
                      {formConfig.name}
                    </Button>
                  ))}
                </div>
                <p dir="rtl" className="text-xs text-muted-foreground mt-3 text-center">
                  {FORMATIONS[userData[currentUser].currentFormation].description}
                </p>
              </div>

              <div dir="rtl" className="rounded-xl border-2 border-emerald-700/30 bg-emerald-700/10 p-4">
                <p className="mb-3 text-center text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {"🎛️"} בחירת שחקנים לתבנית ({currentFormation})
                </p>
                <div className="mb-3 rounded-lg border border-emerald-700/30 bg-card/70 p-3 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {"⚡"} שחקני הרכב שצריכים אנרגיה: {lineupPlayersNeedingEnergy.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    עלות מילוי להרכב: {lineupRefillCost} אנרגיה
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!canRefillLineupEnergy}
                    onClick={refillCurrentLineupEnergy}
                    className="mt-2 text-sm font-bold"
                  >
                    {"🔋"} מלא אנרגיה להרכב הפותח (+{PLAYER_REFILL_AMOUNT} לכל שחקן)
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentFormationSlots.map((slot) => {
                    const selectedPlayer = assignedPlayersBySlot[slot.id]
                    const options = players
                      .filter((p) => roleMatchIndex(slot.role, p.role) < 999 || p.id === selectedPlayer?.id)
                      .sort((a, b) => b.rating - a.rating)
                    return (
                      <label key={slot.id} className="flex items-center gap-2 rounded-lg bg-card/80 p-2">
                        <span className="min-w-24 text-xs font-semibold text-foreground">
                          {SLOT_LABELS_HE[slot.id] ?? slot.id.toUpperCase()} ({slot.role})
                        </span>
                        <select
                          value={formationAssignments[slot.id] ?? ""}
                          onChange={(e) => setLineupAssignment(slot.id, e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="">אוטומטי</option>
                          {options.map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.name} ({player.role})
                            </option>
                          ))}
                        </select>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div
                ref={pitchRef}
                dir="ltr"
                className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border-4 border-white/40 bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900 shadow-inner"
              >
                <div className="pointer-events-none absolute inset-[4%] rounded-xl border-2 border-white/35" />
                <div className="pointer-events-none absolute inset-x-[4%] top-1/2 border-t-2 border-dashed border-white/30" />
                <div className="pointer-events-none absolute left-1/2 top-[4%] h-[18%] w-[44%] -translate-x-1/2 rounded-b-md border-2 border-white/25 border-t-0" />
                <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-[18%] w-[44%] -translate-x-1/2 rounded-t-md border-2 border-white/25 border-b-0" />
                <div className="pointer-events-none absolute left-1/2 top-[4%] h-3 w-3 -translate-x-1/2 rounded-full bg-white/40 ring-2 ring-white/50" />
                <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white/40 ring-2 ring-white/50" />

                {currentFormationSlots.map((slot) => {
                  const owned = assignedPlayersBySlot[slot.id]
                  const defaultPos = { top: slot.top, left: slot.left }
                  const saved = owned ? pitchPositions[String(owned.id)] : undefined
                  const draggingHere =
                    owned && dragPreview && dragPreview.playerId === owned.id
                  const pos = draggingHere
                    ? dragPreview
                    : owned && saved
                      ? saved
                      : defaultPos
                  return (
                    <div
                      key={slot.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                    >
                      <div
                        className={`flex min-w-[5.5rem] max-w-[8.5rem] flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 text-center shadow-lg ${
                          owned
                            ? "border-primary bg-card text-foreground ring-2 ring-primary/40 cursor-grab touch-none active:cursor-grabbing"
                            : "border-white/30 bg-black/20 text-white/90 backdrop-blur-sm"
                        }`}
                        onPointerDown={
                          owned
                            ? (e) => startPlayerDrag(e, owned, defaultPos)
                            : undefined
                        }
                        onDoubleClick={
                          owned
                            ? (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                clearPitchPosition(owned.id)
                              }
                            : undefined
                        }
                      >
                        <span
                          className={`text-[0.65rem] font-bold leading-tight ${
                            owned ? "text-muted-foreground" : "text-white/90"
                          }`}
                        >
                          {slot.role}
                        </span>
                        {owned ? (
                          <>
                            <span className="text-lg font-black leading-tight">{owned.name}</span>
                            <span className="text-xs font-semibold text-primary">{"⭐"} {owned.rating}</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold opacity-80">פנוי ({SLOT_LABELS_HE[slot.id] ?? slot.id.toUpperCase()})</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {players.some((p) => !assignedPlayerIds.has(p.id)) && (
                <p dir="rtl" className="rounded-xl bg-amber-500/15 p-3 text-center text-sm font-semibold text-amber-950 dark:text-amber-100">
                  {"⚠️"} יש שחקנים שלא מוצגים בתבנית הנוכחית — הם עדיין מופיעים ברשימת הקבוצה.
                </p>
              )}

              <div
                dir="rtl"
                className="grid gap-2 rounded-xl border-2 border-muted bg-muted/40 p-4 text-sm sm:grid-cols-2"
              >
                <p className="font-bold text-foreground sm:col-span-2">{"📋"} מה כל תפקיד אומר?</p>
                <p>
                  <span className="font-semibold">שוער:</span> השחקן האחרון לפני השער — עוצר בעיטות.
                </p>
                <p>
                  <span className="font-semibold">בחזית הגנה:</span> שומרים על הרחבה ומונעים מצבים מסוכנים.
                </p>
                <p>
                  <span className="font-semibold">חלוץ:</span> קרוב לשער היריב — כובשים שערים.
                </p>
                <p>
                  <span className="font-semibold">כנף:</span> מהצדדים — מריצים ומסייעים בהתקפה.
                </p>
                <p>
                  <span className="font-semibold">חלוץ משנה / כנף:</span> בין הקישור להתקפה — יוצרים מצבים.
                </p>
                <p>
                  <span className="font-semibold">קשר:</span> במרכז המגרש — מחברים בין הגנה להתקפה.
                </p>
                <p>
                  <span className="font-semibold">קשר הגנתי:</span> גבוה יותר מההגנה — מגנים על הקישור.
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Team Page */}
          {currentPage === "team" && (
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
              <div dir="rtl" className="mb-6 rounded-2xl border-2 border-primary/30 bg-primary/10 p-4">
                <p className="text-lg font-black text-primary">{"🏟️"} האצטדיון של {userNames[currentUser]}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  רמה: <span className="font-black">{stadium.level}</span>
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  בונוס כוח אצטדיון: <span className="font-black text-primary">+{stadiumPowerBonus}</span>
                </p>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-muted-foreground">שדרוגים:</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-foreground">
                    {stadium.upgrades.map((upgrade, idx) => (
                      <li key={`${upgrade}-${idx}`}>{upgrade}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">קניית שדרוגים:</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {STADIUM_UPGRADES.map((upgrade) => {
                      const alreadyOwned = stadium.upgrades.includes(upgrade.name)
                      const canBuy = !alreadyOwned && availableCoins >= upgrade.cost
                      return (
                        <div key={upgrade.id} className="rounded-xl border border-primary/20 bg-card/70 p-3">
                          <p className="font-bold text-foreground">{upgrade.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            עלות: {upgrade.cost} מטבעות {"•"} בונוס כוח: +{upgrade.powerBonus}
                          </p>
                          {alreadyOwned ? (
                            <div className="mt-2 rounded-md bg-primary/20 px-2 py-1 text-center text-xs font-bold text-primary">
                              נרכש
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canBuy}
                              onClick={() => buyStadiumUpgrade(upgrade)}
                              className="mt-2 w-full text-sm font-bold"
                            >
                              קנה שדרוג
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

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
                  {players.map((player) => {
                    const canUpgradeMental =
                      availableCoins >= STAT_UPGRADE_COST && player.mentalHealth < 100
                    const canUpgradeSkills =
                      availableCoins >= STAT_UPGRADE_COST && player.skills < 100
                    const canRefillEnergy =
                      energy >= PLAYER_REFILL_USER_ENERGY_COST && player.energy < PLAYER_MAX_ENERGY
                    const power = matchPowerFromPlayer(player)
                    return (
                      <div
                        key={player.id}
                        className="bg-accent/15 rounded-2xl p-5 border-2 border-accent/30 space-y-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 shrink-0 rounded-full bg-accent flex items-center justify-center text-3xl shadow-lg">
                              {"⚽"}
                            </div>
                            <div>
                              <span className="font-bold text-xl block">{player.name}</span>
                              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                גיל {player.age} {"•"} {player.role} {"•"} מוצא: {player.countryOfOrigin}
                              </p>
                              {player.teamName && (
                                <p className="text-xs font-semibold text-primary/80 mt-1">
                                  {"🏟️"} {player.teamName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-card rounded-xl px-5 py-3 shadow-md border-2 border-secondary/30 self-start">
                            <span className="text-2xl">{"⭐"}</span>
                            <div className="text-start">
                              <span className="font-black text-2xl leading-none">{player.rating}</span>
                              <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                                כוח במשחק: {power}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl bg-card/80 border border-muted p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-sm">{"🧠"} בריאות נפשית</span>
                              <span className="font-black text-lg">{player.mentalHealth}</span>
                            </div>
                            <div
                              className="h-2 rounded-full bg-muted overflow-hidden mb-2"
                              role="progressbar"
                              aria-valuenow={player.mentalHealth}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${player.mentalHealth}%` }}
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canUpgradeMental}
                              onClick={() => upgradeMentalHealth(player.id)}
                              className="w-full text-sm font-bold"
                            >
                              {"⬆️"} +{STAT_UPGRADE_STEP} ({STAT_UPGRADE_COST} {"💰"})
                            </Button>
                          </div>
                          <div className="rounded-xl bg-card/80 border border-muted p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-sm">{"⚡"} כישורים</span>
                              <span className="font-black text-lg">{player.skills}</span>
                            </div>
                            <div
                              className="h-2 rounded-full bg-muted overflow-hidden mb-2"
                              role="progressbar"
                              aria-valuenow={player.skills}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full bg-secondary transition-all duration-300"
                                style={{ width: `${player.skills}%` }}
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canUpgradeSkills}
                              onClick={() => upgradeSkills(player.id)}
                              className="w-full text-sm font-bold"
                            >
                              {"⬆️"} +{STAT_UPGRADE_STEP} ({STAT_UPGRADE_COST} {"💰"})
                            </Button>
                          </div>
                          <div className="rounded-xl bg-card/80 border border-muted p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-sm">{"🔋"} אנרגיית שחקן</span>
                              <span className="font-black text-lg">{player.energy}</span>
                            </div>
                            <div
                              className="h-2 rounded-full bg-muted overflow-hidden mb-2"
                              role="progressbar"
                              aria-valuenow={player.energy}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${player.energy}%` }}
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canRefillEnergy}
                              onClick={() => refillPlayerEnergy(player.id)}
                              className="w-full text-sm font-bold"
                            >
                              {"⚡"} +{PLAYER_REFILL_AMOUNT} ({PLAYER_REFILL_USER_ENERGY_COST} אנרגיית משתמש)
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                  <p dir="rtl" className="mt-2 text-sm font-semibold text-muted-foreground text-center">
                    כוח שחקנים: {playersPower} {"•"} בונוס אצטדיון: +{stadiumPowerBonus}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Tasks Page */}
          {currentPage === "tasks" && (
          <Card className="border-3 border-primary/40 shadow-xl">
            <CardHeader className="bg-primary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-primary">
                <span className="text-4xl">{"✅"}</span>
                המשימות של {userNames[currentUser]}
                <span className="text-lg font-normal text-muted-foreground">
                  ({tasks.filter((t) => t.completed).length}/{tasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6" dir="rtl">
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-secondary/30 bg-secondary/10 p-4 text-center">
                  <p className="text-lg font-bold text-secondary">{"⚡"} כל משימה שהושלמה = +{gameSettings.energyPerTask} אנרגיה</p>
                  <p className="text-sm text-muted-foreground mt-1">סה"כ אנרגיה נוכחית: {energy}</p>
                  <p className="text-sm font-semibold text-muted-foreground mt-1">משימות נותנות אנרגיה בלבד (לא מטבעות {"💰"})</p>
                </div>

                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                  <label className="mb-2 block text-lg font-semibold">{"📝"} משימה חדשה</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      dir="rtl"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask()
                      }}
                      placeholder="כתבו כותרת למשימה..."
                      className="h-12 text-right"
                    />
                    <Button
                      onClick={addTask}
                      disabled={!taskTitle.trim()}
                      className="h-12 px-6 text-lg font-bold"
                    >
                      {"➕"} הוסף
                    </Button>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-muted bg-muted/30 py-10 text-center">
                    <span className="text-5xl">{"📋"}</span>
                    <p className="mt-3 text-lg font-bold text-muted-foreground">עדיין אין משימות</p>
                    <p className="mt-1 text-muted-foreground">הוסיפו משימה חדשה כדי להתחיל</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border-2 p-4 ${
                          task.completed
                            ? "border-primary/30 bg-primary/10"
                            : "border-muted bg-card"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant={task.completed ? "default" : "secondary"}
                            onClick={() => completeTask(task.id)}
                            disabled={task.completed}
                            className="h-9 px-3 text-base font-bold"
                          >
                            {task.completed ? "✅" : "סמן הושלם"}
                          </Button>
                          <p
                            className={`text-lg font-semibold ${
                              task.completed ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {task.completed ? `בוצע (+${gameSettings.energyPerTask} אנרגיה ⚡)` : "פתוח"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Match Page */}
          {currentPage === "match" && (
          <Card className="border-3 border-primary/40 shadow-xl">
            <CardHeader className="bg-primary/15 rounded-t-lg py-5">
              <CardTitle className="flex items-center gap-4 text-2xl text-primary">
                <span className="text-4xl">{"⚔️"}</span>
                משחק!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p dir="rtl" className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                {"⚡"} עלות משחק: {gameSettings.matchCost} אנרגיה מהמשתמש.
              </p>
              <p dir="rtl" className="mb-4 text-center text-sm font-semibold text-muted-foreground">
                {"🔋"} בנוסף, כל משחק מוריד {MATCH_PLAYER_ENERGY_DRAIN} אנרגיה מכל שחקן בקבוצה.
              </p>
              <div className="mb-6 rounded-2xl border-2 border-primary/25 bg-primary/10 p-5 text-center">
                <p className="mb-2 text-sm font-bold text-muted-foreground">היריבה הבאה</p>
                <p className="text-3xl font-black text-primary">{shownOpponent.name}</p>
                <p className="mt-2 text-lg font-bold text-foreground">
                  כוח היריבה: {shownOpponent.power}
                </p>
              </div>
              {!canPlayMatchByPlayers && (
                <div className="mb-6 bg-destructive/15 rounded-2xl p-5 text-center border-2 border-destructive/30">
                  <span className="text-5xl block mb-3">{"⚠️"}</span>
                  <p className="text-xl font-bold text-destructive mb-2">
                    אי אפשר לשחק עדיין!
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {players.length === 0 ? "אין מספיק שחקנים" : "⚽ צריך לפחות 2 שחקנים בקבוצה כדי לשחק משחק ⚽"}
                  </p>
                </div>
              )}
              {canPlayMatchByPlayers && !hasEnoughEnergyForMatch && (
                <div className="mb-6 bg-destructive/15 rounded-2xl p-5 text-center border-2 border-destructive/30">
                  <span className="text-5xl block mb-3">{"⚡"}</span>
                  <p className="text-xl font-bold text-destructive mb-2">
                    אין מספיק אנרגיה למשחק
                  </p>
                  <p className="text-lg text-muted-foreground">
                    צריך {gameSettings.matchCost} אנרגיה, כרגע יש לכם {energy}
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

              {(isPlaying || matchEvents.length > 0) && (
                <div dir="rtl" className="mb-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                  <p className="mb-3 text-center text-lg font-black text-primary">
                    {"📺"} סימולציית משחק חיה מול {liveOpponentName}
                  </p>
                  <div className="space-y-2">
                    {matchEvents.map((eventLine) => (
                      <p
                        key={eventLine.id}
                        className={`animate-match-event rounded-lg px-3 py-2 text-right font-bold ${
                          eventLine.isGoal
                            ? "bg-gold/30 text-lg text-gold-foreground"
                            : "bg-card/80 text-base text-foreground"
                        }`}
                      >
                        {eventLine.text}
                      </p>
                    ))}
                    {isPlaying && (
                      <p className="text-center text-sm font-semibold text-muted-foreground">
                        ממשיך לשחק... ⏱️
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Match Result */}
              {matchResult && (
                <div
                  className={`rounded-2xl p-8 text-center ${
                    isMatchWin
                      ? "bg-win/25 border-4 border-win animate-bounce-win"
                      : isMatchDraw
                        ? "bg-primary/15 border-4 border-primary"
                      : "bg-lose/25 border-4 border-lose animate-shake-lose"
                  }`}
                >
                  <div className="text-6xl mb-4">
                    {isMatchWin ? "🎉🏆🎉" : isMatchDraw ? "🤝⚽🤝" : "😢💔😢"}
                  </div>
                  <h3
                    className={`text-5xl font-black mb-6 ${
                      isMatchWin ? "text-win" : isMatchDraw ? "text-primary" : "text-lose"
                    }`}
                  >
                    {isMatchWin ? "ניצחתם!" : isMatchDraw ? "תיקו!" : "הפסדתם..."}
                  </h3>
                  <p className="mb-4 text-3xl font-black">
                    תוצאה: {matchResult.myGoals} - {matchResult.opponentGoals}
                  </p>
                  <div className="space-y-3 text-xl bg-card/50 rounded-xl p-4">
                    <p className="font-bold">
                      {"⚽"} הקבוצה שלכם: <span className="text-2xl">{matchResult.myRating}</span> נקודות
                    </p>
                    <p className="font-bold">
                      {"🆚"} נגד {matchResult.opponentName}: <span className="text-2xl">{matchResult.opponentPower}</span> נקודות
                    </p>
                  </div>
                  {matchResult.outcome === "lose" && (
                    <p className="mt-6 text-lg font-semibold text-muted-foreground bg-card/80 rounded-xl p-4">
                      {"📚"} קראו עוד ספרים וקנו שחקנים חזקים יותר! {"💪"}
                    </p>
                  )}
                  {matchResult.outcome === "win" && (
                    <p className="mt-6 text-lg font-semibold text-win bg-card/80 rounded-xl p-4">
                      {"🌟"} כל הכבוד {userNames[currentUser]}! אתה אלוף! {"🌟"}
                    </p>
                  )}
                  {matchResult.outcome === "draw" && (
                    <p className="mt-6 text-lg font-semibold text-primary bg-card/80 rounded-xl p-4">
                      {"👏"} משחק צמוד! עוד קצת כוח ותנצחו בפעם הבאה. {"⚽"}
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              {!matchResult && !isPlaying && canPlayMatch && (
                <div className="bg-muted/60 rounded-xl p-5 text-center border-2 border-muted">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {"👆"} לחצו על הכפתור כדי לשחק נגד {nextOpponent.name}!
                    <br />
                    {"⚡"} משווים בין כוח הקבוצה שלכם לכוח היריבה, עם קצת מזל וכיף בדרך! {"⚡"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          )}
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center" dir="rtl">
          <h1 className="text-5xl font-black text-primary md:text-6xl">{"⚽"} קוראים ומנצחים! {"⚽"}</h1>
          <p className="mt-3 text-xl text-muted-foreground">בחרו שחקן כדי להתחיל לשחק</p>
        </header>

        <Card className="border-3 border-primary/30 shadow-xl">
          <CardContent className="grid gap-4 p-6 md:grid-cols-2" dir="rtl">
            <Link href="/roei" className="block">
              <Button className="h-28 w-full text-4xl font-black">{"👦"} רועי</Button>
            </Link>
            <Link href="/yair" className="block">
              <Button className="h-28 w-full text-4xl font-black" variant="secondary">{"👦"} יאיר</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="mt-4 text-center" dir="rtl">
          <Link href="/admin" className="inline-block">
            <Button variant="outline" className="text-lg font-bold">{"🛠️"} דף ניהול</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
