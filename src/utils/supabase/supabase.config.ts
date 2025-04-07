export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!SUPABASE_URL) {
  throw new Error("Supabase url is missing. Set NEXT_PUBLIC_SUPABASE_URL in your .env file.");
}

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!SUPABASE_ANON_KEY) {
  throw new Error("Supabase anon token is missing. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

export const USER_WALLET_TABLE = process.env.NEXT_PUBLIC_FD_USER_WALLET_TABLE;
if (!USER_WALLET_TABLE) {
  throw new Error("User wallet table is missing. Set NEXT_PUBLIC_FD_USER_WALLET_TABLE in your .env file.");
}
