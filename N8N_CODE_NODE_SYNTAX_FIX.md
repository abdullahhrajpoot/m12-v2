# Fix: Code Node Syntax Error

## Error
```
$(...).item is not a function [line 2]
```

## Root Cause
In n8n Code nodes, the syntax for accessing other nodes is different from expression syntax. The code was using `$('Node Name').item(0)` which is expression syntax, not Code node syntax.

## Solution
Changed the syntax from:
```javascript
const token = $('Get Token from Supabase').item(0).json.access_token;
```

To the correct Code node syntax:
```javascript
const token = $node['Get Token from Supabase'].json.access_token;
```

In Code nodes:
- Use `$node['Node Name']` instead of `$('Node Name')`
- Access the first item directly with `.json` (no `.item()` or `.itemAt()` needed)
- For multiple items, use `.all()` to get all items

## Status
✅ Fixed - The node now uses the correct Code node syntax to access data from other nodes.






