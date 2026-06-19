import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export function createSupabaseClient({ SUPABASE_URL, SUPABASE_ANON_KEY }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration manquante. Voir assets/js/config.supabase.example.js');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  return {
    client: supabase,
    auth: {
      signIn: async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
      },
      signOut: async () => supabase.auth.signOut(),
      getUser: async () => supabase.auth.getUser(),
      onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
    },
    documents: {
      list: async () => {
        const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      get: async (id) => {
        const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
      },
      upsert: async (doc) => {
        const { data, error } = await supabase.from('documents').upsert(doc).select();
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { data, error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
        return data;
      }
    },
    storage: supabase.storage,
  };
}
