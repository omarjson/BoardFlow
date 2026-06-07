// ============================================
// BoardFlow Configuration
// ============================================
// The Supabase publishable key is SAFE to commit (even in public
// repos) — it is RLS-protected and can only access data permitted
// by the policies in supabase-schema.sql. This is the new key
// model (sb_publishable_*) that replaced the legacy anon JWT.
//
// NEVER commit the service_role / sb_secret_* key — that's the only
// one that bypasses RLS and must stay server-side only.
// ============================================
const CONFIG = {
  SUPABASE_URL: 'https://bqbxigifkazkqehmdyhn.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_w5kTvu8D-OPpjl0oHQAu4Q_2gOALakS',
  IMGBB_API_KEY: '',
  PUTER_ENABLED: true,
  APP_NAME: 'BoardFlow',
  DEFAULT_LANGUAGE: 'en',
  AUTO_SAVE_INTERVAL: 30000
};
