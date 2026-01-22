# Test Emails for Onboarding Workflow

## User Details
- **User ID**: `ecb8cdd3-e8cc-4da3-99b3-f197c7dce7da`
- **Email**: `hanschung@gmail.com`

## Test Email 1: School Newsletter with Class Information

**Subject**: Welcome to 3rd Grade - Important Information for Parents

**From**: `mrs.johnson@lincoln-elementary.edu`

**Body**:
```
Dear Parents and Guardians,

Welcome to the 2025-2026 school year! I'm Mrs. Johnson, your child's 3rd grade teacher. I'm excited to work with your family this year.

Important Dates:
- Back to School Night: September 5th at 6:00 PM
- First Day of School: August 28th
- Parent-Teacher Conferences: October 15-17

Classroom Supplies Needed:
- 2 composition notebooks
- Pencils and erasers
- Glue sticks
- Scissors

Please return the permission slip for the field trip to the Science Museum by September 10th.

Looking forward to meeting you all!

Best regards,
Mrs. Johnson
3rd Grade Teacher
Lincoln Elementary School
```

**Keywords this should match**: school, grade, teacher, parent, classroom, field trip

---

## Test Email 2: Soccer Team Update

**Subject**: AYSO Soccer Practice Schedule Change - Tigers Team

**From**: `coach.mike@ayso.org`

**Body**:
```
Hi Parents,

This is Coach Mike from the Tigers soccer team. I wanted to let you know about a schedule change for this week.

Practice Update:
- Regular practice: Tuesdays and Thursdays at 4:00 PM
- This week ONLY: Practice moved to Wednesday at 4:30 PM due to field maintenance
- Location: Fields 4 & 5 at Riverside Park

Game Schedule:
- First game: Saturday, September 7th at 9:00 AM vs. Lions
- Please arrive 15 minutes early for warm-up

Uniform pickup will be at practice next week. Please bring a check for $45 for the uniform fee.

See you at practice!

Coach Mike
AYSO Tigers - U10 Division
```

**Keywords this should match**: soccer, practice, game, team, AYSO, schedule

---

## Test Email 3: Ballet Class Registration

**Subject**: Fall Session Registration Open - Dance Academy

**From**: `info@danceacademy.com`

**Body**:
```
Dear Dance Families,

Fall session registration is now open! We're excited to welcome your dancer back for another season.

Class Schedule:
- Beginner Ballet: Mondays and Wednesdays at 3:30 PM
- Intermediate Ballet: Tuesdays and Thursdays at 4:00 PM
- Recital Date: December 15th at 2:00 PM

Registration Details:
- Fall session runs: September 9 - December 13
- Tuition: $180 per month
- Registration deadline: September 1st

Please complete the online registration form and submit payment by the deadline to secure your spot.

We also need parent volunteers for the recital. Sign-up sheet will be available at the front desk.

Questions? Reply to this email or call us at (555) 123-4567.

Thank you,
Dance Academy Staff
```

**Keywords this should match**: ballet, dance, class, registration, recital, session

---

## How to Use These Test Emails

### Option 1: Send to Yourself
1. Send these emails from the "From" addresses (or use your own email)
2. Send them TO: `hanschung@gmail.com`
3. The workflow should pick them up in the next email scan

### Option 2: Use Gmail API to Create Drafts
You could create a script to inject these as drafts, but that's more complex.

### Option 3: Manual Gmail Search Test
The workflow searches for emails with specific keywords. These emails contain:
- School-related: school, grade, teacher, classroom, field trip
- Activity-related: soccer, practice, game, team, ballet, dance, class
- Time-related: dates, schedules, deadlines

### Option 4: Trigger Workflow Manually
You can manually trigger the onboarding workflow via webhook with the user ID, and it will search for emails matching the keywords.

---

## Expected Workflow Behavior

When the workflow processes these emails, it should:

1. **Find the emails** via Gmail search (keywords: school, soccer, ballet, etc.)
2. **Extract relevant information**:
   - From Email 1: 3rd grade, Mrs. Johnson, Lincoln Elementary, field trip
   - From Email 2: Soccer/Tigers team, AYSO, practice schedule, games
   - From Email 3: Ballet classes, Dance Academy, recital date
3. **Create onboarding summary** with facts like:
   - "Child is in 3rd grade at Lincoln Elementary"
   - "Child plays soccer on Tigers team (AYSO)"
   - "Child takes ballet classes at Dance Academy"
4. **Store in `onboarding_summaries` table** for user `ecb8cdd3-e8cc-4da3-99b3-f197c7dce7da`

---

## Testing Steps

1. **Send the test emails** to `hanschung@gmail.com`
2. **Wait a few minutes** for Gmail to index them
3. **Trigger the onboarding workflow** (or wait for it to run automatically)
4. **Check the results**:
   ```sql
   SELECT * FROM onboarding_summaries 
   WHERE user_id = 'ecb8cdd3-e8cc-4da3-99b3-f197c7dce7da';
   ```
5. **Verify the summary** contains information from all 3 emails

---

## Alternative: Use Gmail API to Send Test Emails

If you want to programmatically create these emails, you could use the Gmail API, but that requires:
- OAuth tokens (which you have)
- Gmail API access
- Creating draft messages or sending via API

The simplest approach is to just send these emails manually to the test account.
