import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl =
  typeof url === 'string' &&
  (url.startsWith('http://') || url.startsWith('https://'));

const isValidConfig =
  isValidUrl &&
  typeof anonKey === 'string' &&
  anonKey.length > 20;

if (!isValidConfig) {
  console.warn('⚠️ Supabase not configured. Using mock auth.');
}

let supabaseClient;

if (isValidConfig) {
  supabaseClient = createClient(url, anonKey);
} else {
  supabaseClient = {
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: null
      }),

      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }),

      signInWithOAuth: async () => ({
        error: {
          message: 'Supabase not configured. Check .env'
        }
      }),

      signOut: async () => ({ error: null })
    }
  };
}

export const supabase = supabaseClient;