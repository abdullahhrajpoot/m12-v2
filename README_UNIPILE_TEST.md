# Unipile Simple Test Instructions

## Quickest Test (5 minutes)

This test proves:
- ✅ User can sign up via Unipile
- ✅ You can read their full email inbox
- ✅ Email content is accessible

### Prerequisites

1. **Get Unipile API Key**
   - Go to: https://dashboard.unipile.com/
   - Sign up / Login
   - Copy your API key from Settings

2. **Set Environment Variable**
   ```bash
   export UNIPILE_API_KEY=your_api_key_here
   ```

### Run the Test

```bash
# Install tsx if you don't have it
npm install -g tsx

# Run the test script
npx tsx test-unipile-signup.ts
```

### What Happens

1. **Script generates a hosted auth link** (unique URL)
2. **You open the link** in your browser
3. **Sign in with a TEST Gmail account** (not your main one!)
4. **Grant permissions** to Unipile
5. **Come back to terminal** and press ENTER
6. **Script reads your recent emails** and displays them

### Expected Output

```
✅ Found connected account:
   Email: testuser@gmail.com
   Account ID: acc_abc123xyz
   Status: CONNECTED

✅ Successfully read 10 recent emails!

📧 Recent Emails:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Your Amazon order has shipped
   From: Amazon <ship-confirm@amazon.com>
   Date: 1/20/2026, 10:30 AM
   Snippet: Hi John, Your order #123-456... has shipped...

2. Weekly Newsletter
   From: TechCrunch <newsletter@techcrunch.com>
   Date: 1/19/2026, 8:00 AM
   Snippet: Here are this week's top stories...
```

### Success Criteria

- ✅ You get an account ID (save this!)
- ✅ Script shows your actual email subjects
- ✅ Script shows email content preview
- ✅ Full email body is retrieved

### Troubleshooting

**Error: "Failed to create hosted auth link"**
- Check your API key is correct
- Make sure you copied it from Unipile dashboard

**Error: "No accounts found"**
- Make sure you completed the OAuth flow in browser
- Check if you granted all permissions
- Wait 10 seconds and try again

**Error: "Failed to fetch emails"**
- Account might still be syncing
- Wait 30 seconds and run the script again
- Check account status in Unipile dashboard

### What This Proves

If this test succeeds, you know:
1. **Unipile hosted OAuth works** → Users can connect accounts
2. **Email read access works** → You can access their inbox
3. **Full email content is available** → You can read body, attachments, etc.
4. **You have an account ID** → You can link this to your user database

### Next Steps After Success

1. **Store the account ID** in your database
   ```sql
   UPDATE oauth_tokens 
   SET unipile_account_id = 'acc_abc123xyz'
   WHERE user_id = 'user_uuid';
   ```

2. **Replace Gmail nodes in your workflows** with Unipile API calls

3. **Set up webhooks** for real-time email notifications

4. **Test sending an email** via Unipile (add to workflow)

### Alternative: Manual Dashboard Test

If you prefer GUI testing:

1. Go to https://dashboard.unipile.com/accounts
2. Click "Add Account"
3. Choose Gmail
4. Connect your test account
5. Go to "Messages" tab
6. See your emails in the dashboard

This proves Unipile works without writing any code!

---

## Notes

- Use a **test Gmail account**, not your personal one
- The account ID format: `acc_` followed by random string
- Each connected account has its own ID
- One Unipile account can manage multiple connected Gmail accounts
- First sync might take 30-60 seconds for recent emails

---

**Time Required**: ~5 minutes  
**Difficulty**: Easy  
**Cost**: Free (Unipile has free tier)
