import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://wvcmkpwancdsbljsutjx.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_ASoow2xe9Yh-b4YeyJagYg_plz4jzrw';

export const supabase = createClient(url, key);
