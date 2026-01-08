# Simplified API Response Example

## Current API Response (with unused fields):

```typescript
return NextResponse.json({
  user_id: summaryData.user_id,
  summary_sentences: summaryData.summary_sentences || [],
  children: summaryData.children || [],                    // ❌ Always empty
  unassigned_schools: summaryData.unassigned_schools || [], // ❌ Always empty
  unassigned_activities: summaryData.unassigned_activities || [], // ❌ Always empty
  emails_analyzed_count: summaryData.emails_analyzed_count || 0, // ❌ Always 0/null
  status: summaryData.status || 'completed',
  created_at: summaryData.created_at,
  updated_at: summaryData.updated_at
})
```

## Simplified API Response:

```typescript
return NextResponse.json({
  user_id: summaryData.user_id,
  summary_sentences: summaryData.summary_sentences || [],
  status: summaryData.status || 'pending_review',
  created_at: summaryData.created_at,
  updated_at: summaryData.updated_at
})
```

## Updated API Route Code:

```typescript
// app/api/onboarding/summary/route.ts (simplified)

// Return the summary data
return NextResponse.json({
  user_id: summaryData.user_id,
  summary_sentences: summaryData.summary_sentences || [],
  status: summaryData.status || 'pending_review',
  created_at: summaryData.created_at,
  updated_at: summaryData.updated_at
})
```

## Benefits:

1. **Cleaner response**: Only fields that are actually used
2. **Smaller payload**: Less data transferred
3. **Easier to understand**: Clear what the API returns
4. **Matches database**: Response matches actual schema

## Frontend Impact:

**No changes needed!** The frontend (`app/whatwefound/page.tsx`) already only uses `summary_sentences`:

```typescript
// Frontend only uses summary_sentences
if (data.summary_sentences && Array.isArray(data.summary_sentences) && data.summary_sentences.length > 0) {
  setFacts(data.summary_sentences)
  // ...
}
```

So removing the unused fields from the API response won't break anything.





