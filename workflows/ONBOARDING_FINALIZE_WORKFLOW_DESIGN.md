# Onboarding Finalize Workflow Design

## Overview
Single workflow that handles both "Submit Edits/Add Facts" and "It's All Good" buttons from the whatwefound page.

## Workflow Structure

### 1. Webhook Trigger
- **Path**: `onboarding-finalize`
- **Method**: POST
- **Expected Body**:
  ```json
  {
    "userId": "uuid",
    "facts": ["fact 1", "fact 2", ...],
    "userEdits": "string | null"  // null if "It's All Good", otherwise user's edits
  }
  ```

### 2. IF Node: Has User Edits?
- **Condition**: Check if `userEdits` exists and is not empty/null
- **TRUE branch**: User provided edits → Run AI refinement
- **FALSE branch**: "It's All Good" → Skip to saving facts

### 3. TRUE Branch (With Edits)

#### 3a. AI Agent: Refine Facts
- **Input**: `facts` array + `userEdits` string
- **Prompt**: 
  ```
  The user has reviewed the following facts we extracted:
  {facts}
  
  They provided these edits/additions:
  {userEdits}
  
  Please refine the facts list by:
  1. Incorporating their edits and additions
  2. Removing or correcting any facts they mentioned are wrong
  3. Adding any new facts they provided
  4. Keeping all facts that weren't mentioned
  
  Return a JSON array of refined facts:
  ["refined fact 1", "refined fact 2", ...]
  ```
- **Output**: Refined facts array

#### 3b. Save to family_facts
- **Operation**: Insert/Update
- **For each fact**: Insert row with:
  - `user_id`: from webhook
  - `fact_type`: "general" or determine from fact content
  - `fact_text`: the fact string
  - `source`: "onboarding_scan"
  - `is_confirmed`: true
  - `confidence`: 1.0 (user confirmed)

### 4. FALSE Branch (It's All Good)

#### 4a. Save to family_facts
- Same as 3b, but using original `facts` array (no refinement)

### 5. Send Welcome Email (Both Branches)
- **Email Service**: Use HTTP Request or Email node
- **Template**: Welcome email with:
  - User's name (fetch from users table)
  - Confirmation that facts are saved
  - Link to dashboard
- **To**: User's email from users table

## Implementation Notes

### family_facts Table Structure
- `id`: uuid (auto-generated)
- `user_id`: uuid (from webhook)
- `fact_type`: text (e.g., "child", "school", "activity", "general")
- `subject`: text (nullable, e.g., child's name)
- `fact_text`: text (the fact itself)
- `structured_data`: jsonb (nullable, for structured info)
- `source`: text (default: "user_input")
- `confidence`: double (default: 1.0)
- `is_confirmed`: boolean (default: true)

### Fact Type Detection (Optional)
You could use a simple AI call or pattern matching to determine fact_type:
- "attends" or "goes to" → fact_type: "school" or "activity"
- "is in" or "grade" → fact_type: "child"
- Default: "general"

### Email Service
Options:
1. **SendGrid** (via HTTP Request)
2. **n8n Email node** (if configured)
3. **Supabase Edge Function** that calls email service
4. **Direct SMTP** (via HTTP Request to email API)

## Workflow Benefits
- ✅ Single workflow = easier maintenance
- ✅ Shared logic (save + email) = DRY principle
- ✅ Simple IF logic = easy to understand
- ✅ Both paths converge at the end = clean architecture

## Testing
Test with:
1. `userEdits: null` → Should skip AI refinement, save facts directly
2. `userEdits: "Add: Ballet is Tuesdays at 3pm. Remove: Soccer practice."` → Should refine and save
3. Verify facts saved to `family_facts` table
4. Verify welcome email sent

