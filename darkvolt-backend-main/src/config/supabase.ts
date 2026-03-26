import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvbhvjrkkqlkrthuazfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2Ymh2anJra3Fsa3J0aHVhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzMyOTgsImV4cCI6MjA5MDEwOTI5OH0.lEHk7Y6-ahdA9SNcPaiviCpeDrxEYOxVl7H66Q9GkM0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Pour les opérations admin (service role key à ajouter plus tard)
export const supabaseAdmin = createClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
