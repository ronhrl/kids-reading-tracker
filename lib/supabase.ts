import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ──────────────────────────────────────────────────────────────────

export type GameUser = "roei" | "yair"

/** Shape of a single row in the `game_state` table */
export interface GameStateRow {
  id: string
  user: GameUser
  data: Record<string, unknown>
  updated_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Load the latest game state for a given user.
 * Returns null when no row exists yet.
 */
export async function loadGameState(user: GameUser): Promise<GameStateRow | null> {
  const { data, error } = await supabase
    .from("game_state")
    .select("*")
    .eq("user", user)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("loadGameState error:", error.message)
    return null
  }

  return data
}

/**
 * Upsert (insert or update) the full game state for a user.
 * Matches on the `user` column so there is always exactly one row per user.
 */
export async function saveGameState(
  user: GameUser,
  gameData: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("game_state").upsert(
    {
      user,
      data: gameData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user" }
  )

  if (error) {
    console.error("saveGameState error:", error.message)
  }
}
