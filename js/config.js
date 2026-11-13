// --- TBCW CONFIG: Supabase ---

const SUPABASE_URL = 'https://ypfcadkzjxqqplrgbpqi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oZmst_dD6NzuIJVAWjoBuA_SnOkmrG-';

// Publishable-ключ публичен по дизайну — вся защита строк в RLS-политиках базы.
const AUTH_ON = typeof supabase !== 'undefined' && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const AUTH_EMAIL_DOMAIN = 'tbcw.db';
