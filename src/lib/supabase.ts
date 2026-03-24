import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdagcprdtoxnzulraqql.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYWdjcHJkdG94bnp1bHJhcXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzI0MDEsImV4cCI6MjA4OTg0ODQwMX0.l2KFwYMMPHQUCjTCnqIM67vNapOrr-Dltf-0rvSZJ-M'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);