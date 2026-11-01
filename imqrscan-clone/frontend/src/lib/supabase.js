import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL || 'https://tnqnbdratlkrfngkaemh.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VHXODQHT-4z3NEQdElbYmw_JLlp7hN6'

export const supabase = createClient(supabaseUrl, supabaseAnon)
