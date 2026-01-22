-- Sample Portal Credentials for Testing
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table

-- To get your user ID, run:
-- SELECT id, email FROM auth.users;

-- Example portal credentials (replace user_id with your actual ID)
INSERT INTO portal_credentials (user_id, portal_name, portal_url, login_username, login_password, notes)
VALUES 
  (
    'YOUR_USER_ID_HERE',
    'ParentSquare - Smith Family',
    'https://www.parentsquare.com/signin',
    'parent@smithfamily.com',
    'password123',
    'Elementary school portal for Johnny and Sarah'
  ),
  (
    'YOUR_USER_ID_HERE',
    'SchoolMessenger - Johnson Family',
    'https://go.schoolmessenger.com',
    'parent@johnsonfamily.com',
    'securepass456',
    'Middle school announcements'
  ),
  (
    'YOUR_USER_ID_HERE',
    'Canvas LMS - Davis Family',
    'https://canvas.instructure.com',
    'parent@davisfamily.com',
    'canvaspass789',
    'High school grades and assignments'
  );

-- To use this file:
-- 1. First, get your user ID: SELECT id, email FROM auth.users;
-- 2. Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- 3. Run: psql $DATABASE_URL -f scripts/sample-portal-credentials.sql
