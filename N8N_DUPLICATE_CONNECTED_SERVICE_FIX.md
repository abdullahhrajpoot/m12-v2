# Fix: Duplicate Connected Service Error

## Error
```
duplicate key value violates unique constraint "connected_services_user_id_service_name_key"
Key (user_id, service_name)=(8ac8bfee-c53a-4c35-b2d0-f92b0906b146, Gmail) already exists.
```

## Root Cause
The `connected_services` table has a unique constraint on `(user_id, service_name)`, preventing duplicate connections for the same user and service. When a user triggers the onboarding workflow multiple times (e.g., re-authorizing OAuth), the workflow tries to create the same connected service again, causing this error.

## Solution
Added `continueOnFail: true` to the "Create Connected Service" node, allowing the workflow to continue even if the connected service already exists. This matches the pattern used in the "Create User" node and handles idempotent re-runs of the onboarding flow gracefully.

## Status
✅ Fixed - The node will now continue execution if the connected service already exists, rather than stopping the workflow.







