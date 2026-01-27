# How to Log Into Railway CLI

## Steps

1. **Open your terminal** (not in Cursor, use your system terminal)

2. **Navigate to your project directory:**
   ```bash
   cd /Users/hanschung/Documents/Parser/Cursor/projects/tldrpal
   ```

3. **Run the login command:**
   ```bash
   railway login
   ```

4. **Follow the prompts:**
   - It will open your browser automatically
   - Or give you a URL to visit
   - You'll need to authorize the CLI to access your Railway account

5. **After logging in, link your project:**
   ```bash
   railway link
   ```
   - This will show you a list of your Railway projects
   - Select the project that contains your bippity.boo service

6. **Verify you're logged in:**
   ```bash
   railway whoami
   ```
   - Should show your Railway username/email

## After Logging In

Once logged in, you can check logs:

```bash
# View recent deployment logs
railway logs --deploy

# Filter for callback/unipile related logs
railway logs --deploy | grep -i "callback\|unipile\|session"

# View logs for specific service
railway logs --service <service-name>

# View logs with more lines
railway logs --deploy --lines 200
```

## Alternative: Use Railway Dashboard

If you prefer not to use CLI, you can check logs in the Railway web dashboard:
1. Go to https://railway.app
2. Log in
3. Select your project
4. Click on your service
5. Go to "Deployments" tab
6. Click on the latest deployment
7. View the logs there
