
import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

// Supabase client initialization
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);
