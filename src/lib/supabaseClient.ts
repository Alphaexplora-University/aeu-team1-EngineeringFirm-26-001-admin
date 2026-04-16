import { createClient } from "@supabase/supabase-js"

export interface Inquiry {
  id: string
  full_name: string
  email: string
  project_type: string
  message: string
  date: string // Postgres 'date' comes back as 'YYYY-MM-DD'
  time: string
  status: "pending" | "confirmed" | "cancelled" // Based on your default
  created_at: string
}

// Matches your 'holidays' table
export interface Holiday {
  id: string
  date: string
  name: string | null
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
