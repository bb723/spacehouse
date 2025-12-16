# Browser Debugging Guide

The Vite dev server is running correctly at http://localhost:3000

## If You See a Blank Page:

### Step 1: Open Browser Developer Tools
1. Press **F12** (or Right-click → Inspect)
2. Click on the **Console** tab
3. Look for any red error messages

### Step 2: Check Network Tab
1. In DevTools, click **Network** tab
2. Refresh the page (Ctrl+R)
3. Look for any failed requests (red status codes)

### Step 3: Common Issues & Fixes

#### Issue: "Cannot GET /"
**Fix**: The Vite server might not be running
```bash
cd frontend
npm run dev
```

#### Issue: Red errors in Console
**Possible errors and fixes**:

**Error**: "Failed to fetch" or "NetworkError"
- Backend isn't running
- Start backend: `python3.12 api.py`

**Error**: "Cannot find module"
- Missing dependency
- Run: `npm install`

**Error**: "Unexpected token '<'"
- Build issue
- Restart Vite: Ctrl+C then `npm run dev`

#### Issue: White screen, no errors
**Fix**: Hard refresh
- Windows: **Ctrl + Shift + R**
- Mac: **Cmd + Shift + R**
- Or clear cache in DevTools Network tab (checkbox "Disable cache")

### Step 4: Manual URL Test

Try these URLs directly in your browser:

1. **Main page**: http://localhost:3000
   - Should show the React app

2. **Vite client**: http://localhost:3000/@vite/client
   - Should show JavaScript code (not 404)

3. **Main component**: http://localhost:3000/src/main.tsx
   - Should show compiled JavaScript

If ALL of these work, the issue is likely:
- Browser cache (clear it)
- Browser extension blocking (try Incognito mode)

### Step 5: Try Different Browser

If nothing works:
1. Close current browser
2. Open a different browser (Chrome, Firefox, Edge)
3. Navigate to http://localhost:3000

### Step 6: Check Terminal Output

Look at the terminal where `npm run dev` is running:

**Good output** (server is ready):
```
VITE v5.4.21  ready in 1647 ms
➜  Local:   http://localhost:3000/
```

**Bad output** (errors):
- Any red error messages
- "EADDRINUSE" = port 3000 already in use
- Solution: `npx kill-port 3000` then restart

## Expected Browser Console Output

When the page loads correctly, you should see:
- No red errors
- Possibly some info messages in blue/gray
- React DevTools extension might show a React icon

## Test Curl (From Terminal)

```bash
# This should return HTML
curl http://localhost:3000

# This should NOT be empty
curl http://localhost:3000/src/main.tsx
```

## Still Not Working?

### Nuclear Option: Full Reset

```bash
# Stop all servers (Ctrl+C in both terminals)

# Frontend: Clean install
cd frontend
rm -rf node_modules
npm install
npm run dev

# Backend: Restart
cd ..
python3.12 api.py
```

### Check for Firewall/Antivirus

Some antivirus software blocks localhost:3000:
- Temporarily disable antivirus
- Or add exception for Node.js/npm

## Screenshot What You See

If still broken, take a screenshot showing:
1. Browser address bar (http://localhost:3000)
2. The blank page
3. DevTools Console tab (F12)
4. DevTools Network tab

This will help diagnose the issue!
