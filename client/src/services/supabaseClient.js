import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wybporrmnlwtoxrxksuf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YnBvcnJtbmx3dG94cnhrc3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzEyMTQsImV4cCI6MjA4NzUwNzIxNH0.jGmI8v4qKzoJ3eTUh1mUteFiBqRYRt0pxfE-1igWvmM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)