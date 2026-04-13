export type Settings = {
  coinsPer10Pages: number
  bookBonus: number
  energyPerTask: number
  matchCost: number
}

const SETTINGS_STORAGE_KEY = "reading-game-admin-settings"

export const defaultSettings: Settings = {
  coinsPer10Pages: 5,
  bookBonus: 10,
  energyPerTask: 5,
  matchCost: 10,
}

const clampSetting = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.max(0, Math.floor(value))
}

const normalizeSettings = (raw: unknown): Settings => {
  if (!raw || typeof raw !== "object") {
    return defaultSettings
  }

  const settings = raw as Partial<Settings>

  return {
    coinsPer10Pages: clampSetting(settings.coinsPer10Pages, defaultSettings.coinsPer10Pages),
    bookBonus: clampSetting(settings.bookBonus, defaultSettings.bookBonus),
    energyPerTask: clampSetting(settings.energyPerTask, defaultSettings.energyPerTask),
    matchCost: clampSetting(settings.matchCost, defaultSettings.matchCost),
  }
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultSettings
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return defaultSettings
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizeSettings(settings)))
  } catch {
    /* ignore storage errors */
  }
}

export function calculateReadingCoins(pages: number, settings: Settings) {
  return (pages / 10) * settings.coinsPer10Pages + settings.bookBonus
}
