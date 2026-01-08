# Supabase Schema Alignment Audit

## Summary
✅ **All n8n nodes align correctly with Supabase schema**

All field references, types, and operations match the actual database schema.

---

## Schema Reference

### `users` Table
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `email` | text | NO | null | Required |
| `full_name` | text | YES | null | Optional |
| `nango_connection_id` | text | YES | null | Optional |
| `subscription_tier` | text | YES | 'free' | Optional |
| `subscription_status` | text | YES | 'active' | Optional |
| `emails_processed_count` | integer | YES | 0 | Optional |
| `emails_processed_this_month` | integer | YES | 0 | Optional |
| `monthly_limit` | integer | YES | 100 | Optional |
| `status` | text | YES | 'active' | Optional |
| `created_at` | timestamp with time zone | YES | now() | Auto |
| `updated_at` | timestamp with time zone | YES | now() | Auto |
| `last_login_at` | timestamp with time zone | YES | null | Optional |
| `first_name` | text | YES | null | Optional |
| `last_name` | text | YES | null | Optional |

### `connected_services` Table
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | NO | null | **REQUIRED** - Foreign key |
| `service_name` | text | NO | null | **REQUIRED** |
| `service_type` | text | NO | null | **REQUIRED** |
| `nango_provider_key` | text | YES | null | Optional |
| `is_active` | boolean | YES | true | Optional |
| `last_verified_at` | timestamp with time zone | YES | null | Optional |
| `last_sync_at` | timestamp with time zone | YES | null | Optional |
| `last_error` | text | YES | null | Optional |
| `consecutive_failures` | integer | YES | 0 | Optional |
| `settings` | jsonb | YES | '{}'::jsonb | Optional |
| `created_at` | timestamp with time zone | YES | now() | Auto |
| `updated_at` | timestamp with time zone | YES | now() | Auto |
| `encrypted_username` | bytea | YES | null | Optional |
| `encrypted_password` | bytea | YES | null | Optional |

### `onboarding_summaries` Table
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `user_id` | uuid | YES | null | **Nullable** - Can be null |
| `summary_sentences` | ARRAY | YES | null | Array type (TEXT[]) |
| `children` | jsonb | YES | '[]'::jsonb | Optional |
| `unassigned_schools` | ARRAY | YES | null | Optional |
| `unassigned_activities` | ARRAY | YES | null | Optional |
| `raw_ai_output` | jsonb | YES | null | Optional |
| `emails_analyzed_count` | integer | YES | null | Optional |
| `status` | text | YES | 'pending_review' | Optional |
| `created_at` | timestamp with time zone | YES | now() | Auto |
| `updated_at` | timestamp with time zone | YES | now() | Auto |

---

## Node-by-Node Analysis

### 1. "Check if User Exists" (getAll)
- **Table**: `users`
- **Operation**: `getAll`
- **Filter Field**: `id` (uuid, eq)
- ✅ **Status**: CORRECT
  - Field exists in schema
  - Type matches (uuid)
  - Field is primary key, appropriate for filtering

---

### 2. "Create User" (create)
- **Table**: `users`
- **Operation**: `create`
- **Fields Set**:
  - `id`: `={{ $('Supabase OAuth Webhook').item.json.body.userId }}` (uuid)
  - `email`: `={{ $('Supabase OAuth Webhook').item.json.body.email }}` (text)
- ✅ **Status**: CORRECT
  - Both fields exist in schema
  - Both fields are required (NOT NULL) and are being set
  - Types match (uuid, text)
  - All other fields have defaults or are nullable

---

### 3. "Update Existing User" (update)
- **Table**: `users`
- **Operation**: `update`
- **Filter Field**: `id` (uuid, eq)
- **Fields Updated**:
  - `last_login_at`: `={{ $now.toISO() }}` (timestamp)
  - `status`: `"active"` (text)
- ✅ **Status**: CORRECT
  - Filter field exists (primary key)
  - Update fields exist in schema
  - Types match (timestamp with time zone, text)
  - Fields are nullable (safe to update)

---

### 4. "Create Connected Service" (create)
- **Table**: `connected_services`
- **Operation**: `create`
- **Fields Set**:
  - `user_id`: `={{ $('Supabase OAuth Webhook').item.json.body.userId }}` (uuid)
  - `service_name`: `"Gmail"` (text)
  - `service_type`: `"email"` (text)
- ✅ **Status**: CORRECT
  - All three fields exist in schema
  - All three fields are **REQUIRED** (NOT NULL) and are being set ✅
  - Types match (uuid, text, text)
  - `id` has default (gen_random_uuid()) so doesn't need to be set
  - Other fields have defaults or are nullable

---

### 5. "Save Onboarding Summaries" (update)
- **Table**: `onboarding_summaries`
- **Operation**: `update`
- **Filter Field**: `user_id` (uuid, eq)
- **Fields Updated**:
  - `summary_sentences`: `={{ $json.sentences }}` (ARRAY)
- ✅ **Status**: CORRECT
  - Filter field exists (user_id, nullable but can be used for filtering)
  - Update field exists in schema
  - Type matches (ARRAY - TEXT[])
  - Field is nullable, but workflow provides value

---

### 6. "Insert Onboarding Summaries" (create)
- **Table**: `onboarding_summaries`
- **Operation**: `create`
- **Fields Set**:
  - `user_id`: `={{ $('Supabase OAuth Webhook').item.json.body.userId }}` (uuid)
  - `summary_sentences`: `={{ $json.sentences }}` (ARRAY)
- ✅ **Status**: CORRECT
  - Both fields exist in schema
  - Types match (uuid, ARRAY - TEXT[])
  - Both fields are nullable, but workflow provides values
  - `id` has default (gen_random_uuid()) so doesn't need to be set

---

## Key Findings

### ✅ All Aligned
1. All field names match exactly (case-sensitive matching not required, but names are correct)
2. All data types are compatible
3. Required fields (NOT NULL) are being set in create operations
4. Filter fields exist and are appropriate for querying
5. No missing fields or type mismatches

### ⚠️ Notes
1. **`onboarding_summaries.user_id`** is nullable in the schema, but the workflow always sets it - this is fine and recommended
2. **`connected_services`** requires all three fields (`user_id`, `service_name`, `service_type`) - all are being set correctly ✅
3. **`users`** requires `id` and `email` - both are being set in "Create User" ✅

---

## Recommendations

1. ✅ **No changes needed** - All nodes are correctly aligned with the schema
2. Consider adding error handling for cases where `user_id` might be missing (though current workflow ensures it exists via webhook validation)
3. The workflow correctly handles optional vs required fields

---

## Conclusion

**All n8n Supabase nodes are properly aligned with the database schema.** No fixes needed.







