# Task Feature MVP - Deployment Checklist

Use this checklist to ensure everything is ready for production deployment.

## ✅ Pre-Deployment Checklist

### Database Setup
- [ ] Migration file reviewed: `migrations/006_create_task_tables.sql`
- [ ] Migration applied to Supabase database
- [ ] Tables verified: `families`, `family_members`, `tasks`
- [ ] RLS policies enabled on all three tables
- [ ] Helper function `current_user_email()` created
- [ ] Test with sample data inserted
- [ ] Cross-family isolation verified (RLS working)

### Environment Variables
Verify these are set in Railway:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (e.g., https://bippity.boo)
- [ ] `UNIPILE_DSN`
- [ ] `UNIPILE_API_KEY`
- [ ] `N8N_UNIPILE_ONBOARDING_WEBHOOK_URL`

### Code Review
- [ ] All TypeScript types defined in `types/task.ts`
- [ ] Helper functions tested in `lib/task-helpers.ts`
- [ ] Family membership logic in `lib/family.ts`
- [ ] API routes handle errors gracefully
- [ ] Auth callback integrates family creation
- [ ] UI components use proper TypeScript props
- [ ] No hardcoded test data in production code
- [ ] Console.logs reviewed (remove sensitive data)

### Dependencies
- [ ] No new npm packages needed (all exist)
- [ ] `react-day-picker` available for calendar
- [ ] `date-fns` available for date utilities
- [ ] `sonner` available for toast notifications
- [ ] All shadcn/ui components created

### Testing (Local)
- [ ] Sign up creates family membership
- [ ] Navigate to `/tasks` works
- [ ] Tasks display in correct sections
- [ ] Done button updates status
- [ ] Skip button updates status
- [ ] Dismiss button updates status
- [ ] Date picker changes dates
- [ ] Feedback input saves
- [ ] Section collapsing works
- [ ] Empty states display
- [ ] Mobile responsive verified
- [ ] RLS prevents cross-family access

## 🚀 Deployment Steps

### Step 1: Commit Changes

```bash
git add .
git commit -m "Add Task Feature MVP

- Database migration for families, family_members, and tasks
- API endpoints for task CRUD operations
- Complete UI with sections, cards, and actions
- Integration with existing Unipile auth
- Mobile-responsive design
- Row Level Security for multi-tenant isolation"

git push origin main
```

### Step 2: Apply Database Migration

**Before or after deployment, you must run the migration:**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/006_create_task_tables.sql`
3. Paste and run
4. Verify success (check for any errors)

**Or use Supabase CLI:**
```bash
supabase db push migrations/006_create_task_tables.sql
```

### Step 3: Verify Railway Build

1. Watch Railway logs during deployment
2. Check for build errors
3. Verify all environment variables are loaded
4. Wait for deployment to complete

### Step 4: Smoke Test Production

1. Visit your production URL (e.g., https://bippity.boo)
2. Sign in with test account
3. Navigate to `/dashboard`
4. Click "Tasks" card
5. Verify page loads without errors
6. Check browser console for errors
7. Test one action (e.g., click Done on a task)

## 📊 Post-Deployment Monitoring

### Immediate (First Hour)

- [ ] Check Railway logs for errors
- [ ] Monitor Sentry for exceptions
- [ ] Verify database connections working
- [ ] Test auth flow end-to-end
- [ ] Check API response times
- [ ] Verify mobile view in production

### First 24 Hours

- [ ] Monitor user signups
- [ ] Check task creation patterns
- [ ] Review error rates
- [ ] Gather initial user feedback
- [ ] Check database query performance
- [ ] Verify RLS is working correctly

### First Week

- [ ] Analyze user engagement metrics
- [ ] Review feedback submissions
- [ ] Identify common issues
- [ ] Plan next iteration
- [ ] Optimize slow queries if needed
- [ ] Update documentation based on learnings

## 🔍 Verification Queries

Run these in Supabase SQL Editor after deployment:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('families', 'family_members', 'tasks');
```

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'family_members', 'tasks');
```

### Check Policies Exist
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('families', 'family_members', 'tasks');
```

### Check First User's Family
```sql
SELECT 
  f.name AS family_name,
  fm.email,
  fm.unipile_account_id,
  COUNT(t.id) AS task_count
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN tasks t ON f.id = t.family_id
GROUP BY f.id, f.name, fm.email, fm.unipile_account_id
ORDER BY f.created_at DESC
LIMIT 5;
```

## 🐛 Common Issues & Fixes

### Issue: Migration fails with "relation already exists"

**Fix:** Tables may already exist. Drop them first:
```sql
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families CASCADE;
DROP FUNCTION IF EXISTS current_user_email();
```
Then re-run migration.

### Issue: Users can't see tasks

**Fix:** Check RLS policies are enabled:
```sql
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### Issue: "current_user_email() does not exist"

**Fix:** Function needs to be created:
```sql
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'email',
    ''
  );
$$ LANGUAGE SQL STABLE;
```

### Issue: Family not created on signup

**Fix:** Check server logs for errors in callback route. Verify:
- `SUPABASE_SERVICE_ROLE_KEY` is set
- `ensureFamilyMembership` function is imported
- No errors in function execution

### Issue: Tasks API returns 401

**Fix:** User session may be expired. Check:
- Middleware is refreshing sessions
- Cookies are set with correct domain
- User is authenticated before calling API

## 📱 Mobile Testing URLs

Test on actual devices or browser DevTools:

- **iPhone SE**: 375px width
- **iPhone 12 Pro**: 390px width  
- **iPhone 14 Pro Max**: 430px width
- **iPad**: 768px width
- **Desktop**: 1920px width

### Check:
- Task cards don't overflow
- Buttons wrap properly
- Date picker is usable
- Text is readable
- Spacing looks good
- No horizontal scroll

## 🎯 Success Criteria

Deployment is successful when:

- [ ] All tests in TASK_FEATURE_TESTING_GUIDE.md pass
- [ ] No console errors on production
- [ ] Users can sign up and see tasks
- [ ] All actions work (Done, Skip, Dismiss, Date, Feedback)
- [ ] Mobile view is usable
- [ ] RLS prevents data leaks
- [ ] Page loads in < 2 seconds
- [ ] No Sentry errors for 1 hour

## 📞 Support

If you encounter issues:

1. **Check logs first**: Railway logs, Supabase logs, browser console
2. **Review testing guide**: `TASK_FEATURE_TESTING_GUIDE.md`
3. **Verify environment**: All env vars set correctly?
4. **Test locally**: Can you reproduce locally?
5. **Check RLS**: Are policies blocking legitimate access?

## 🎉 Launch Announcement

Once deployed and verified, you can announce:

> 🎉 Task Management is now live!
> 
> - View all your family tasks in one place
> - Organized by due date (Overdue, Today, This Week, Upcoming)
> - One-click actions to mark tasks done or skip them
> - Add feedback if something is wrong
> - Mobile-friendly design
> 
> Access it from the Dashboard → Tasks

## 📈 Metrics to Track

Set up monitoring for:

1. **Usage Metrics**
   - Daily active users on `/tasks`
   - Tasks viewed per session
   - Action button clicks
   - Feedback submissions

2. **Performance Metrics**
   - Page load time
   - API response time (GET /api/tasks)
   - Time to first interaction
   - Database query duration

3. **Error Metrics**
   - 4xx/5xx response rates
   - Failed mutations
   - Auth errors
   - RLS policy violations

4. **Business Metrics**
   - Task completion rate
   - User retention
   - Feature adoption
   - Feedback quality

---

**Ready to deploy?** Double-check this list, then push to production! 🚀
