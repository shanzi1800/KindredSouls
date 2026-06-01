import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_v4T_OvG7eZp48NJH4ALQzA_GVd0SsJv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
