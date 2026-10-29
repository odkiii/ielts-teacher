/* Облако: Supabase Auth + одна строка JSON на пользователя (RLS: только своя). Ключ anon — публичный по дизайну. */
window.Cloud = (function () {
  'use strict';
  const URL = 'https://imbodvcjursddpljmpsx.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltYm9kdmNqdXJzZGRwbGptcHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjU4NDEsImV4cCI6MjEwODg0MTg0MX0.7wgOu6NkrjKCmF9po6Rr6DUylbF7XclAdsa6XeJMTuI';
  let sb = null;
  function c() {
    if (!sb) sb = window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    return sb;
  }
  return {
    available: () => !!window.supabase,
    async session() { const r = await c().auth.getSession(); return r.data.session; },
    signIn: (email, password) => c().auth.signInWithPassword({ email, password }),
    signUp: (email, password) => c().auth.signUp({ email, password }),
    signOut: () => c().auth.signOut(),
    onAuth: (fn) => c().auth.onAuthStateChange((ev, s) => fn(ev, s)),
    async pull(uid) {
      const r = await c().from('ielts_user_data').select('data,updated_at').eq('user_id', uid).maybeSingle();
      if (r.error) throw r.error; return r.data;
    },
    async push(uid, obj) {
      const r = await c().from('ielts_user_data').upsert({ user_id: uid, data: obj, updated_at: new Date().toISOString() });
      if (r.error) throw r.error;
    },
  };
})();
