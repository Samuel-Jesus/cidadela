import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url?.trim() && anonKey?.trim());
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env da raiz do monorepo.",
    );
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export async function ensureAnonSession(): Promise<string> {
  const sb = getSupabase();
  const { data: existing } = await sb.auth.getSession();
  if (existing.session?.user?.id) {
    return existing.session.user.id;
  }
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      error?.message ??
      "Falha no login anônimo. Habilite Anonymous Sign-Ins no Supabase.",
    );
  }
  return data.user.id;
}

export async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session?.user?.id ?? null;
}
