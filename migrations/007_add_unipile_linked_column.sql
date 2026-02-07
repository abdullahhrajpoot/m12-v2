-- Add unipile_linked column to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "unipile_linked" BOOLEAN DEFAULT false;

-- Enhance security: Ensure this column is only modified by server-side logic if possible, 
-- but primarily we rely on the application logic using the Service Role for the update.
