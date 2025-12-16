# Deployment Guide - Moving SpaceHouse to Another PC

## Option 1: Using Git & GitHub (Recommended)

### Step 1: Initialize Git Repository (On Current PC)

```bash
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"

# Initialize git repository
git init

# Create .gitignore file (see below)
# Then add all files
git add .

# Create initial commit
git commit -m "Initial commit - SpaceHouse Configurator with Wall Elevation Viewer

- TerraBuild application with React + Konva
- Floor plan canvas editor
- Wall elevation viewer with framing details
- Real-time code validation
- Bill of materials calculation
- FastAPI backend"
```

### Step 2: Create .gitignore File

Create a file named `.gitignore` in the root directory with this content:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.pytest_cache/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log
```

### Step 3: Push to GitHub

```bash
# Create a new repository on GitHub (github.com/new)
# Then link it:

git remote add origin https://github.com/YOUR_USERNAME/spacehouse.git
git branch -M main
git push -u origin main
```

### Step 4: Clone on Another PC

```bash
# Navigate to where you want the project
cd "C:\Users\YourName\Desktop\Applications"

# Clone the repository
git clone https://github.com/YOUR_USERNAME/spacehouse.git

# Enter the directory
cd spacehouse
```

### Step 5: Install Dependencies on New PC

```bash
# Install Python dependencies (if any)
# Make sure Python 3.12 is installed first
python --version

# Install Node.js dependencies
cd frontend
npm install

# Go back to root
cd ..
```

### Step 6: Run the Application

```bash
# Terminal 1: Start the backend
python api.py

# Terminal 2: Start the frontend
cd frontend
npm run dev
```

---

## Option 2: Using OneDrive Sync (Simple but Less Professional)

Since your project is already in OneDrive, you can leverage that:

### On Current PC:
1. Ensure OneDrive is syncing the `Applications\spacehouse` folder
2. Check OneDrive sync status (should show green checkmarks)

### On Another PC:
1. Install OneDrive and sign in with the same account
2. Enable sync for the `Applications\spacehouse` folder
3. Wait for sync to complete
4. Install dependencies:
   ```bash
   cd "C:\Users\YourName\OneDrive\Desktop\Applications\spacehouse\frontend"
   npm install
   ```
5. Run the application

**Note:** Never commit `node_modules/` - always run `npm install` on the new PC.

---

## Option 3: Manual ZIP Transfer (Quick & Dirty)

### On Current PC:

1. **Delete node_modules first** (it's huge and unnecessary):
   ```bash
   cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse\frontend"
   rm -rf node_modules
   ```

2. **Create a ZIP file**:
   - Right-click the `spacehouse` folder
   - Select "Send to" → "Compressed (zipped) folder"

3. **Transfer the ZIP**:
   - USB drive
   - Email (if small enough)
   - Cloud storage (Dropbox, Google Drive, etc.)
   - Network share

### On Another PC:

1. **Extract the ZIP file**
2. **Install dependencies**:
   ```bash
   cd spacehouse/frontend
   npm install
   ```
3. **Run the application**

---

## Prerequisites for the New PC

Before pulling the application, ensure the new PC has:

### 1. Python 3.12+
```bash
python --version
# Should show: Python 3.12.x
```

**Install if needed:**
- Windows: https://www.python.org/downloads/
- Check "Add to PATH" during installation

### 2. Node.js 18+
```bash
node --version
npm --version
# Should show: v18.x or v20.x
```

**Install if needed:**
- Windows: https://nodejs.org/ (download LTS version)
- Check "Add to PATH" during installation

### 3. Git (if using Git method)
```bash
git --version
```

**Install if needed:**
- Windows: https://git-scm.com/download/win

---

## File Structure to Transfer

Make sure these directories and files are included:

```
spacehouse/
├── api.py                           ← Backend API
├── parametric_building_configurator.py
├── QUICKSTART.md
├── ELEVATION_VIEWER_GUIDE.md
├── IMPLEMENTATION_SUMMARY.md
├── DEPLOYMENT_GUIDE.md
├── VISUAL_REFERENCE.txt
└── frontend/
    ├── package.json                 ← Important: Lists dependencies
    ├── package-lock.json            ← Important: Locks versions
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── public/                      ← Static assets
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── api/
    │   │   └── client.ts
    │   ├── components/
    │   │   ├── CanvasEditor.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── ElevationViewer.tsx  ← NEW component
    │   ├── store/
    │   │   └── projectStore.ts
    │   └── types/
    │       └── index.ts
    └── node_modules/                ← DON'T TRANSFER - Too large!
```

---

## What NOT to Transfer

These folders are generated and should be recreated on the new PC:

- ❌ `frontend/node_modules/` - Run `npm install` instead
- ❌ `frontend/dist/` - Generated by build process
- ❌ `__pycache__/` - Python cache files
- ❌ `.vscode/` - Editor settings (optional)

---

## Verification Checklist (On New PC)

After setup, verify everything works:

### Backend Check:
```bash
cd spacehouse
python api.py
```
- ✅ Should start on http://localhost:8000
- ✅ Visit http://localhost:8000/docs to see Swagger UI

### Frontend Check:
```bash
cd spacehouse/frontend
npm run dev
```
- ✅ Should start on http://localhost:3000
- ✅ Should automatically open in browser

### Feature Check:
- ✅ Floor plan renders with 4 walls
- ✅ Clicking a wall highlights it in orange
- ✅ Elevation viewer slides in at bottom
- ✅ Framing diagram shows studs
- ✅ Title block displays specifications
- ✅ Dimension lines are visible
- ✅ Sidebar shows BOM and compliance
- ✅ API calls work (check toast notifications)

---

## Troubleshooting Common Issues

### Issue: "npm: command not found"
**Solution:** Node.js is not installed or not in PATH
```bash
# Verify installation
node --version
npm --version

# If not found, reinstall Node.js and check "Add to PATH"
```

### Issue: "python: command not found"
**Solution:** Python is not installed or not in PATH
```bash
# Try python3 instead
python3 --version

# Or reinstall Python with "Add to PATH" checked
```

### Issue: "Cannot find module 'react'"
**Solution:** Dependencies not installed
```bash
cd frontend
npm install
```

### Issue: "Port 3000 already in use"
**Solution:** Kill existing process or use different port
```bash
# Use different port
npm run dev -- --port 3001

# Or kill existing process (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Failed to validate project. Check API connection."
**Solution:** Backend API not running
```bash
# In a separate terminal
cd spacehouse
python api.py
```

### Issue: Canvas is blank
**Solution:**
1. Refresh the page (Ctrl + R)
2. Check browser console for errors
3. Verify react-konva is installed: `npm list react-konva`

---

## Quick Command Reference

### Current PC (Setup Git):
```bash
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"
git init
# Create .gitignore file
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/spacehouse.git
git push -u origin main
```

### New PC (Clone and Run):
```bash
# Clone
git clone https://github.com/YOUR_USERNAME/spacehouse.git
cd spacehouse

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start backend (Terminal 1)
python api.py

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

---

## Recommended Approach

**For professional use:** Use **Option 1 (Git/GitHub)**
- Version control
- Easy collaboration
- Track changes over time
- Proper backup

**For quick personal transfer:** Use **Option 2 (OneDrive)**
- Already set up
- Automatic sync
- No extra steps

**For one-time transfer:** Use **Option 3 (ZIP)**
- Simple and fast
- No dependencies on cloud services
- Good for offline transfer

---

## Additional Notes

### Environment Variables
If you add any API keys or secrets later, create a `.env` file:

```bash
# .env (in root directory)
API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
```

**Important:** Never commit `.env` to Git! It's already in `.gitignore`.

### Production Build
To create a production build:

```bash
cd frontend
npm run build

# Output will be in frontend/dist/
# Serve with any static file server
```

### Updates and Syncing
If you make changes on one PC and want them on another:

**Using Git:**
```bash
# On PC with changes
git add .
git commit -m "Description of changes"
git push

# On other PC
git pull
cd frontend
npm install  # If package.json changed
```

**Using OneDrive:**
- Changes sync automatically
- Still need to run `npm install` if package.json changed

---

## Summary

1. **Choose your method** (Git recommended)
2. **Prepare the project** (remove node_modules, create .gitignore)
3. **Transfer the files** (push to GitHub, OneDrive, or ZIP)
4. **Set up new PC** (install Python, Node.js, Git)
5. **Install dependencies** (`npm install` in frontend folder)
6. **Run the application** (backend + frontend)
7. **Verify features** (click walls, see elevation viewer)

You're all set! 🚀
