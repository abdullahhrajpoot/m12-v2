# Task Feature MVP - Testing Guide

This guide helps you test the complete Task Feature implementation from database setup to user interactions.

## Prerequisites

1. **Database Migration Applied**: Run the migration file on your Supabase database
2. **Environment Variables Set**: Ensure all required variables are configured in Railway
3. **Unipile OAuth Working**: User authentication flow should be functional

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (SQL Editor)

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `migrations/006_create_task_tables.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('families', 'family_members', 'tasks');
   ```

### Option B: Via Supabase CLI

```bash
supabase db push migrations/006_create_task_tables.sql
```

## Step 2: Test Authentication & Family Creation

### 2.1 Create Test User

1. Visit your app's landing page (e.g., `https://bippity.boo`)
2. Click "Sign Up With Google"
3. Complete Unipile OAuth flow
4. After redirect to `/whatwefound`, check console logs for:
   ```
   ✅ Created new family for user: <user_id> family: <family_id>
   ```

### 2.2 Verify Database Records

Run these queries in Supabase SQL Editor:

```sql
-- Check family was created
SELECT * FROM families ORDER BY created_at DESC LIMIT 1;

-- Check family member was created
SELECT * FROM family_members ORDER BY created_at DESC LIMIT 1;

-- Verify the link between user and family
SELECT 
  fm.email,
  fm.unipile_account_id,
  f.name AS family_name
FROM family_members fm
JOIN families f ON fm.family_id = f.id
ORDER BY fm.created_at DESC LIMIT 1;
```

Expected: You should see your test user's email with a family name like "test Family".

## Step 3: Insert Test Tasks

Use this SQL to create test tasks covering all sections:

```sql
-- Get your family_id first
DO $$
DECLARE
  test_family_id UUID;
BEGIN
  -- Get the most recent family (your test family)
  SELECT id INTO test_family_id FROM families ORDER BY created_at DESC LIMIT 1;
  
  -- Insert test tasks
  INSERT INTO tasks (family_id, title, description, due_date, status, source_type, source_snippet)
  VALUES
    -- OVERDUE tasks
    (test_family_id, 'Sign permission slip for field trip', 'Field trip to science museum on Feb 10. Need signed permission slip and $15.', CURRENT_DATE - INTERVAL '3 days', 'not_done', 'email', 'From: Nesbit Elementary School...'),
    (test_family_id, 'RSVP for birthday party', 'Jake''s 8th birthday party at Jump Zone. Reply by Jan 18.', CURRENT_DATE - INTERVAL '2 days', 'not_done', 'email', 'From: Sarah Miller (Jake''s mom)...'),
    
    -- DUE TODAY
    (test_family_id, 'Pack soccer cleats', 'Soccer practice today at 4pm. Don''t forget shin guards.', CURRENT_DATE, 'not_done', 'email', 'From: Westside Soccer League...'),
    
    -- DUE THIS WEEK
    (test_family_id, 'Buy science fair supplies', 'Poster board, markers, glue for volcano project. Due Friday.', CURRENT_DATE + INTERVAL '3 days', 'not_done', 'email', 'From: Mrs. Johnson...'),
    (test_family_id, 'Submit lunch order form', 'Hot lunch orders for February due Jan 25.', CURRENT_DATE + INTERVAL '5 days', 'not_done', 'email', 'From: School Cafeteria...'),
    
    -- UPCOMING (no due date)
    (test_family_id, 'Review parent-teacher conference notes', 'Follow up on reading goals discussed at conference.', NULL, 'not_done', 'email', 'From: Ms. Anderson...'),
    (test_family_id, 'Update emergency contact info', 'School needs updated contact information.', CURRENT_DATE + INTERVAL '14 days', 'not_done', 'email', 'From: Main Office...'),
    
    -- SKIPPED (recent)
    (test_family_id, 'Volunteer for field day', 'Help needed on March 15 for field day activities.', CURRENT_DATE + INTERVAL '30 days', 'skipped', 'email', 'From: PTA...'),
    
    -- COMPLETED (recent)
    (test_family_id, 'Submit immunization records', 'Required for school enrollment.', CURRENT_DATE - INTERVAL '5 days', 'done', 'email', 'From: School Nurse...');
    
  RAISE NOTICE 'Test tasks inserted successfully for family_id: %', test_family_id;
END $$;
```

### Verify Tasks Were Created

```sql
SELECT 
  title,
  status,
  due_date,
  CASE 
    WHEN due_date < CURRENT_DATE AND status = 'not_done' THEN 'overdue'
    WHEN due_date = CURRENT_DATE AND status = 'not_done' THEN 'today'
    WHEN due_date > CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '7 days' AND status = 'not_done' THEN 'this_week'
    WHEN (due_date > CURRENT_DATE + INTERVAL '7 days' OR due_date IS NULL) AND status = 'not_done' THEN 'upcoming'
    WHEN status = 'skipped' THEN 'skipped'
    WHEN status IN ('done', 'dismissed') THEN 'completed'
    ELSE 'unknown'
  END AS section
FROM tasks
WHERE family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1)
ORDER BY 
  CASE section
    WHEN 'overdue' THEN 1
    WHEN 'today' THEN 2
    WHEN 'this_week' THEN 3
    WHEN 'upcoming' THEN 4
    WHEN 'skipped' THEN 5
    WHEN 'completed' THEN 6
    ELSE 7
  END,
  due_date ASC;
```

## Step 4: Test Tasks Page

### 4.1 Navigate to Tasks

1. Go to `/dashboard`
2. Click on "Tasks" quick action card
3. Verify redirect to `/tasks`

### 4.2 Verify Task Display

Check that tasks appear in correct sections:

- **⚠️ Overdue (2)**: Should show 2 overdue tasks
- **📅 Due Today (1)**: Should show today's task
- **📆 Due This Week (2)**: Should show tasks due within 7 days
- **🗓️ Upcoming (2)**: Should show future/no-date tasks
- **⏭️ Skipped - Last 30 Days**: Should be collapsed, expandable
- **✅ Completed - Last 30 Days**: Should be collapsed, expandable

### 4.3 Test Task Cards

For each task, verify:
- ✅ Title displays correctly
- ✅ Description shows (with "Show more" if long)
- ✅ Due date displays with proper formatting
- ✅ Source snippet shows
- ✅ Action buttons are visible (Done, Skip, Dismiss, Date)

## Step 5: Test Action Buttons

### 5.1 Test "Done" Button

1. Click "Done" on any task
2. Expected behavior:
   - Task moves to "Completed" section
   - Toast notification: "Task updated"
   - Other sections re-render without that task

### 5.2 Test "Skip" Button

1. Click "Skip" on any task
2. Expected behavior:
   - Task moves to "Skipped" section
   - Toast notification: "Task updated"

### 5.3 Test "Dismiss" Button

1. Click "Dismiss" on any task
2. Expected behavior:
   - Task moves to "Completed" section (dismissed is a type of completion)
   - Toast notification: "Task updated"

### 5.4 Verify Database Updates

After clicking buttons, check the database:

```sql
SELECT title, status, completed_at, updated_at 
FROM tasks 
WHERE family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1)
ORDER BY updated_at DESC;
```

- Status should match the action taken
- `completed_at` should be set for 'done' status
- `updated_at` should be recent

## Step 6: Test Date Picker

### 6.1 Open Date Picker

1. Click the "Date" button on any task
2. Date picker popover should appear

### 6.2 Change Due Date

1. Select a new date from the calendar
2. Expected behavior:
   - Popover closes
   - Toast notification: "Due date updated"
   - Task may move to a different section
   - Due date displays new value

### 6.3 Clear Due Date

1. Click "Date" button
2. Click "Clear date" at bottom of picker
3. Expected behavior:
   - Date is removed
   - Task shows "No due date"
   - Task moves to "Upcoming" section

### 6.4 Verify in Database

```sql
SELECT title, due_date, updated_at 
FROM tasks 
WHERE family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1)
AND title LIKE '%<task you modified>%';
```

## Step 7: Test Feedback Input

### 7.1 Add Feedback

1. Click "Add Feedback" on any task
2. Textarea expands
3. Type feedback: "This task is for Emma, not Cora"
4. Click "Send Feedback"
5. Expected behavior:
   - Toast notification: "Feedback submitted"
   - Feedback input collapses
   - Button text changes to "Edit Feedback"

### 7.2 Edit Existing Feedback

1. Click "Edit Feedback"
2. Existing feedback should populate textarea
3. Modify text
4. Click "Send Feedback"
5. Verify update

### 7.3 Character Limit

1. Try to enter more than 500 characters
2. Counter should show "500/500"
3. Toast error if attempting to submit over limit

### 7.4 Verify in Database

```sql
SELECT title, feedback, feedback_submitted_at 
FROM tasks 
WHERE family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1)
AND feedback IS NOT NULL;
```

## Step 8: Test Section Collapsing

### 8.1 Collapse/Expand Sections

1. Click on "Skipped" section header
2. Section should expand/collapse
3. Click on "Completed" section header
4. Section should expand/collapse
5. Active sections (Overdue, Today, etc.) should not be collapsed by default

## Step 9: Test Empty States

### 9.1 Mark All Tasks as Done

1. Go through and mark all "not_done" tasks as "done"
2. Expected behavior:
   - Overdue, Today, This Week, Upcoming sections show empty state messages
   - "No overdue tasks", "Nothing due today", etc.
   - Completed section fills up

### 9.2 Test No Tasks at All

```sql
-- Delete all tasks for your family (CAREFUL - test environment only!)
DELETE FROM tasks 
WHERE family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1);
```

1. Refresh `/tasks` page
2. Expected behavior:
   - Large empty state appears
   - Icon: 📋
   - Text: "No tasks yet"
   - Subtitle: "Tasks from your emails will appear here automatically."

## Step 10: Test Mobile Responsiveness

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on various screen sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)

### Check for:
- Task cards stack properly
- Action buttons wrap appropriately
- Date picker popover doesn't overflow
- Section headers are readable
- Spacing looks good

## Step 11: Test Row Level Security

### 11.1 Create Second Test User

1. Log out of current user
2. Sign up with a different Google account
3. Verify new family is created

### 11.2 Verify Isolation

1. User 1 should only see their family's tasks
2. User 2 should only see their family's tasks
3. Neither should see the other's tasks

### 11.3 Test with Database Query

```sql
-- This should return NO tasks for User 2 when querying with User 1's family_id
SELECT * FROM tasks 
WHERE family_id = '<user-1-family-id>'
-- When executed as User 2, this should return empty due to RLS
```

## Step 12: Test Error Handling

### 12.1 Network Error Simulation

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to update a task
4. Expected: Error toast appears
5. Re-enable network
6. Try again → should work

### 12.2 Invalid Task ID

Try manually calling API with invalid ID:
```bash
curl -X PATCH https://your-app.com/api/tasks/invalid-uuid \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

Expected: 404 error with appropriate message

## Step 13: Performance Testing

### 13.1 Many Tasks

Insert 50+ tasks using script:

```sql
DO $$
DECLARE
  test_family_id UUID;
  i INTEGER;
BEGIN
  SELECT id INTO test_family_id FROM families ORDER BY created_at DESC LIMIT 1;
  
  FOR i IN 1..50 LOOP
    INSERT INTO tasks (family_id, title, description, due_date, status)
    VALUES (
      test_family_id,
      'Task #' || i,
      'This is test task number ' || i,
      CURRENT_DATE + (i % 30) * INTERVAL '1 day',
      'not_done'
    );
  END LOOP;
END $$;
```

1. Reload `/tasks` page
2. Verify page loads quickly (< 2 seconds)
3. Check for any layout issues with many tasks

## Success Criteria Checklist

- [ ] Database migration applied successfully
- [ ] User authentication creates family membership
- [ ] Tasks display in correct sections
- [ ] Done button moves task to Completed
- [ ] Skip button moves task to Skipped
- [ ] Dismiss button moves task to Completed
- [ ] Date picker updates due dates
- [ ] Feedback input saves to database
- [ ] Sections can collapse/expand
- [ ] Empty states display correctly
- [ ] Mobile layout is responsive
- [ ] RLS prevents cross-family access
- [ ] Error handling works (network errors, invalid IDs)
- [ ] Performance is acceptable with many tasks

## Troubleshooting

### Issue: Tasks not appearing

**Check:**
1. Does user have a family_id in `family_members`?
2. Are tasks linked to that family_id?
3. Check browser console for API errors
4. Verify RLS policies are enabled

### Issue: Can't update tasks

**Check:**
1. RLS policies allow UPDATE for user's family
2. User session is valid (not expired)
3. Check Network tab for API response
4. Verify PATCH endpoint is working

### Issue: Date picker not working

**Check:**
1. `react-day-picker` is installed
2. `date-fns` is installed
3. No console errors about missing components
4. Popover component is imported correctly

### Issue: Family not created on signup

**Check:**
1. `ensureFamilyMembership` is called in callback
2. Service role key is set in environment
3. Check server logs for errors
4. Verify function import path is correct

## Next Steps After Testing

Once all tests pass:

1. **Deploy to Production**: Push to Railway
2. **Monitor Logs**: Watch for any errors in production
3. **Test with Real Email**: Integrate with n8n AI processor to create tasks from emails
4. **User Feedback**: Gather feedback from beta testers
5. **Iterate**: Implement improvements based on usage patterns
