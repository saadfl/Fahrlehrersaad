import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://plfslmvqkolpvyjlxjyk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZnNsbXZxa29scHZ5amx4anlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTMxNDEsImV4cCI6MjEwMjgyOTE0MX0.BTU9LbzzobMvxnqFZ6se2yeujMyEoOHZT2pXNRL-ovs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
