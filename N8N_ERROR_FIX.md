# n8n Workflow Error Fix - Create Connected Service

## Error
```
Bad request - please check your parameters: null value in column "user_id" of relation "connected_services" violates not-null constraint
```

## Root Cause
The "Create Connected Service" node was missing the `fieldsUi` parameter with field values, causing all fields (including required `user_id`) to be null when creating a record.

## Fix Applied
Added the missing `fieldsUi` configuration with required fields:
- `user_id`: References webhook payload `{{ $('Supabase OAuth Webhook').item.json.body.userId }}`
- `service_name`: "Gmail"
- `service_type`: "email"

## Status
✅ Fixed - The node now includes all required field mappings.






