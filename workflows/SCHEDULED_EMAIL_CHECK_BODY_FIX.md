# Fix for Bippity - Scheduled Email Check

## Node to Update: "Parse Email + Rate Limit"

Replace the body extraction section (lines 44-51 in the jsCode) with this enhanced version:

```javascript
// Extract body text - handle multiple formats
let bodyText = '';

// First check if Gmail returned simplified fields
if (response.textBody) {
  bodyText = response.textBody;
} else if (response.body && typeof response.body === 'string') {
  bodyText = response.body;
} else if (payload.parts && payload.parts.length) {
  // Handle multipart messages
  for (const part of payload.parts) {
    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
      bodyText += decodeBase64Url(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body && part.body.data && !bodyText) {
      // Fallback to HTML if no plain text found
      bodyText += decodeBase64Url(part.body.data);
    }
  }
} else if (payload.body && payload.body.data) {
  // Handle single-part messages
  bodyText = decodeBase64Url(payload.body.data);
}
```

## What This Fixes

The enhanced logic now:
1. ✅ Checks for simplified Gmail response fields first (`textBody`, `body`)
2. ✅ Falls back to HTML if no text/plain part exists
3. ✅ Handles both multipart and single-part messages
4. ✅ Prevents blank email bodies in the database

## How to Apply

### Option 1: Via n8n UI
1. Open workflow "Bippity - Scheduled Email Check" (ID: YLmpF5CnOPUFDYJz)
2. Find node "Parse Email + Rate Limit"
3. Replace lines 44-51 in the jsCode with the code above
4. Save workflow

### Option 2: Full Node Code
<details>
<summary>Click to expand full updated node code</summary>

```javascript
// Process ALL items from Get Email Content
const items = $input.all();
const results = [];

function decodeBase64Url(data) {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

function getHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}

for (const item of items) {
  const input = item.json;
  
  // Get user context from Split Messages
  const userContext = {
    user_id: input.user_id || $('Split Messages').first().json.user_id,
    access_token: input.access_token || $('Split Messages').first().json.access_token
  };

  // Check for rate limit on individual message fetch
  if (input.statusCode === 429) {
    const retryAfter = parseInt(input.headers?.['retry-after']) || 30;
    const retryCount = input.retry_count || 0;
    
    if (retryCount < 3) {
      // Skip this item for now - would need retry logic
      continue;
    }
    continue;
  }

  // Check for other errors
  if (input.statusCode >= 400) {
    continue;
  }

  // Success - parse the email
  const response = input.body || input;
  const payload = response.payload;
  
  if (!payload) {
    continue;
  }
  
  // UPDATED: Enhanced body extraction logic
  let bodyText = '';

  // First check if Gmail returned simplified fields
  if (response.textBody) {
    bodyText = response.textBody;
  } else if (response.body && typeof response.body === 'string') {
    bodyText = response.body;
  } else if (payload.parts && payload.parts.length) {
    // Handle multipart messages
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        bodyText += decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body && part.body.data && !bodyText) {
        // Fallback to HTML if no plain text found
        bodyText += decodeBase64Url(part.body.data);
      }
    }
  } else if (payload.body && payload.body.data) {
    // Handle single-part messages
    bodyText = decodeBase64Url(payload.body.data);
  }

  const headers = payload.headers || [];

  results.push({
    json: {
      id: response.id,
      thread_id: response.threadId,
      user_id: userContext.user_id,
      subject: getHeader(headers, 'Subject'),
      from_email: getHeader(headers, 'From'),
      to: getHeader(headers, 'To'),
      date: getHeader(headers, 'Date'),
      body: bodyText,
      snippet: response.snippet,
      received_at: new Date(parseInt(response.internalDate)).toISOString()
    }
  });
}

return results.length > 0 ? results : [];
```

</details>
