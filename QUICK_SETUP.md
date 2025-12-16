# Quick Setup Guide - Transfer to Another PC

## 3 Options to Choose From:

### 🏆 Option 1: GitHub (Best for Development)
```bash
# === ON CURRENT PC ===
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"
git init
git add .
git commit -m "Initial commit - SpaceHouse with Elevation Viewer"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/spacehouse.git
git push -u origin main

# === ON NEW PC ===
git clone https://github.com/YOUR_USERNAME/spacehouse.git
cd spacehouse/frontend
npm install
cd ..
# Run: python api.py (Terminal 1)
# Run: cd frontend && npm run dev (Terminal 2)
```

### ☁️ Option 2: OneDrive (Easiest)
```bash
# === ON NEW PC ===
# 1. Install OneDrive, sign in with same account
# 2. Sync the Applications\spacehouse folder
# 3. Wait for sync to complete
# 4. Install dependencies:
cd "C:\Users\YourName\OneDrive\Desktop\Applications\spacehouse\frontend"
npm install
cd ..
# Run: python api.py (Terminal 1)
# Run: cd frontend && npm run dev (Terminal 2)
```

### 📦 Option 3: ZIP File (Quick Transfer)
```bash
# === ON CURRENT PC ===
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse\frontend"
rm -rf node_modules  # Delete this first!
# Then ZIP the spacehouse folder
# Transfer via USB/Email/Cloud

# === ON NEW PC ===
# 1. Extract the ZIP file
# 2. Install dependencies:
cd spacehouse/frontend
npm install
cd ..
# Run: python api.py (Terminal 1)
# Run: cd frontend && npm run dev (Terminal 2)
```

## Prerequisites for New PC

Install these before transferring:

1. **Python 3.12+**: https://www.python.org/downloads/
   - ✅ Check "Add to PATH" during install
   - Verify: `python --version`

2. **Node.js 18+**: https://nodejs.org/
   - ✅ Download LTS version
   - ✅ Check "Add to PATH" during install
   - Verify: `node --version` and `npm --version`

3. **Git** (if using Option 1): https://git-scm.com/download/win
   - Verify: `git --version`

## Running the Application

Always need 2 terminals:

**Terminal 1 (Backend):**
```bash
cd spacehouse
python api.py
# Should see: Running on http://localhost:8000
```

**Terminal 2 (Frontend):**
```bash
cd spacehouse/frontend
npm run dev
# Should see: Local: http://localhost:3000
```

## Quick Verification

After setup, test these:
- [ ] Backend running at http://localhost:8000/docs
- [ ] Frontend running at http://localhost:3000
- [ ] Click a wall → Elevation viewer appears
- [ ] Framing diagram shows studs
- [ ] Title block shows specifications

## Common Issues

**"npm: command not found"**
→ Node.js not installed or not in PATH. Reinstall with PATH checked.

**"python: command not found"**
→ Python not installed or not in PATH. Try `python3` or reinstall.

**"Cannot find module 'react'"**
→ Run `npm install` in the frontend folder.

**"Port already in use"**
→ Use `npm run dev -- --port 3001` or kill existing process.

**Canvas is blank**
→ Refresh page (Ctrl+R) or check console for errors.

## Files Structure (What to Transfer)

```
spacehouse/
├── api.py                          ✅ Transfer
├── parametric_building_configurator.py  ✅ Transfer
├── *.md files                      ✅ Transfer
└── frontend/
    ├── package.json                ✅ Transfer (important!)
    ├── package-lock.json           ✅ Transfer (important!)
    ├── src/                        ✅ Transfer all
    ├── public/                     ✅ Transfer all
    ├── *.config.* files            ✅ Transfer all
    └── node_modules/               ❌ DON'T transfer (run npm install)
```

## That's It!

For detailed instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
