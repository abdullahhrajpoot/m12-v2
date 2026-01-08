# Onboarding Summaries Schema Simplification Proposal

## Current Schema Issues

From examining the codebase and execution data, the `onboarding_summaries` table has many unused fields:

### Fields Currently in Schema:
- ✅ `id` - Required (primary key)
- ✅ `user_id` - **USED** (required, foreign key)
- ✅ `summary_sentences` - **USED** (main data, array of strings)
- ✅ `status` - **USED** (set to "pending_review", returned in API)
- ✅ `created_at` - Standard timestamp (useful)
- ✅ `updated_at` - Standard timestamp (useful)
- ❌ `children` - **UNUSED** (always empty array `[]`)
- ❌ `unassigned_schools` - **UNUSED** (always `null`)
- ❌ `unassigned_activities` - **UNUSED** (always `null`)
- ❌ `raw_ai_output` - **UNUSED** (always `null`)
- ❌ `emails_analyzed_count` - **UNUSED** (always `null`)

### Evidence:
1. **Workflow**: Only sets `user_id` and `summary_sentences`
2. **Frontend**: Only uses `summary_sentences` (from `app/whatwefound/page.tsx`)
3. **API**: Returns all fields but only `summary_sentences` is used
4. **Execution data**: Shows all unused fields are null/empty

## Proposed Simplified Schema

```sql
CREATE TABLE onboarding_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_sentences TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'completed', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One summary per user
);

-- Index for faster lookups
CREATE INDEX idx_onboarding_summaries_user_id ON onboarding_summaries(user_id);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_summaries_updated_at
  BEFORE UPDATE ON onboarding_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Simplified Schema Fields:

| Field | Type | Purpose | Required |
|-------|------|---------|----------|
| `id` | UUID | Primary key | ✅ |
| `user_id` | UUID | Foreign key to users | ✅ |
| `summary_sentences` | TEXT[] | Array of extracted fact sentences | ✅ |
| `status` | TEXT | Status: 'pending_review', 'completed', 'reviewed' | ✅ |
| `created_at` | TIMESTAMPTZ | When record was created | ✅ |
| `updated_at` | TIMESTAMPTZ | When record was last updated | ✅ |

**Total: 6 fields** (down from 11 fields)

## Benefits of Simplification:

1. **Clearer intent**: Schema reflects what's actually used
2. **Easier maintenance**: Fewer fields to manage in workflows/API
3. **Better performance**: Smaller rows = faster queries
4. **Reduced confusion**: Developers won't wonder what unused fields are for
5. **Simpler migrations**: Future changes are easier

## Fields Removed (and why):

| Field | Why Remove | Alternative |
|-------|------------|-------------|
| `children` | Never populated, facts already contain entity info | Info is in `summary_sentences` |
| `unassigned_schools` | Never populated | Could be extracted from `summary_sentences` if needed |
| `unassigned_activities` | Never populated | Could be extracted from `summary_sentences` if needed |
| `raw_ai_output` | Never populated, would be large if stored | Store in logs/workflow execution if debugging needed |
| `emails_analyzed_count` | Never populated | Could query `unified_events` table if needed |

## Migration Path:

If you want to simplify, you would:

1. **Create migration** to drop unused columns:
   ```sql
   ALTER TABLE onboarding_summaries 
     DROP COLUMN IF EXISTS children,
     DROP COLUMN IF EXISTS unassigned_schools,
     DROP COLUMN IF EXISTS unassigned_activities,
     DROP COLUMN IF EXISTS raw_ai_output,
     DROP COLUMN IF EXISTS emails_analyzed_count;
   ```

2. **Update API route** (`app/api/onboarding/summary/route.ts`) to remove references to dropped fields

3. **Verify workflows** - they already don't set these fields, so no changes needed

## Recommendation:

**YES, simplify the schema.** The unused fields add complexity without value. The simplified schema is:
- **Clearer** - reflects actual usage
- **Faster** - smaller rows
- **Easier to maintain** - fewer fields to think about

If you need the removed fields in the future, they can be added back, but it's better to add them when needed rather than maintain unused fields.





