# SpaceHouse - Quick Start Guide

Get your interactive building configurator running in 5 minutes!

## Prerequisites

1. **Python 3.12** - Already installed ✅
2. **Node.js 18+** - Need to install (see below)
3. **Modern web browser** - Chrome, Firefox, or Edge

## Installation Steps

### Step 1: Install Node.js (if not installed)

**Windows (Recommended Method):**

Download and install from the official website:
- Go to: https://nodejs.org/
- Download the **LTS version** (v20.x or v18.x)
- Run the installer
- ⚠️ **IMPORTANT**: Check the box "Add to PATH" during installation

**Alternative - Windows Package Manager:**
```bash
winget install OpenJS.NodeJS
```

**Verify Installation:**
```bash
node --version
npm --version
```

You should see version numbers like:
```
v20.11.0
10.2.4
```

---

### Step 2: Install Frontend Dependencies

Open a terminal and navigate to the frontend folder:

```bash
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse\frontend"
npm install
```

This will take 1-2 minutes. You'll see packages being downloaded.

Expected output:
```
added 847 packages, and audited 848 packages in 45s
```

---

### Step 3: Start the Backend API

**The backend is already running!** You should see it running at `http://localhost:8000`

If you need to restart it:

```bash
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"
python3.12 api.py
```

Verify it's running:
- Open browser: http://localhost:8000/docs
- You should see the Swagger API documentation

---

### Step 4: Start the Frontend

Open a **NEW terminal** (keep the backend running in the first one):

```bash
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse\frontend"
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

The app will automatically open in your browser at **http://localhost:3000**

---

## What You'll See

### 1. Canvas (Left Side)
- Interactive 2D floor plan
- 4 walls in a rectangular room
- Blue walls = exterior, Gray walls = interior
- Click walls to select them
- Drag the orange handles to resize walls

### 2. Sidebar (Right Side)
- **Project Settings**: Room type, ceiling height, climate zone
- **Code Compliance**: Live validation results
  - Green = Passing all checks
  - Red = Code violations
- **Bill of Materials**: Live material calculations
  - Studs, drywall, insulation, gravel
  - Estimated cost

### 3. Real-Time Validation
Every time you make a change:
1. Wait 500ms (debounce)
2. API call to backend
3. Compliance + BOM updates
4. Toast notification appears

---

## Quick Test

Try this to see the system in action:

1. **Select Wall 1** (the top wall)
2. **Drag the orange handle** to make it longer
3. **Watch** the BOM update with new material quantities
4. **Change Room Type** to "Bedroom" in the sidebar
5. **See** if the egress window passes code (should pass with default 3'x4' window)
6. **Change Climate Zone** to Zone 6
7. **See** the code violation if R-value is too low

---

## Common Issues

### "Failed to validate project. Check API connection."

**Fix:** Make sure the backend API is running at http://localhost:8000

```bash
# In a separate terminal
cd "c:\Users\brett\OneDrive\Desktop\Applications\spacehouse"
python3.12 api.py
```

### "npm: command not found"

**Fix:** Node.js is not installed or not in PATH

1. Install Node.js from https://nodejs.org/
2. Restart your terminal
3. Verify: `node --version`

### Canvas is blank

**Fix:** Refresh the page (Ctrl + R or Cmd + R)

### Port 3000 already in use

**Fix:** Kill the existing process or use a different port:

```bash
npm run dev -- --port 3001
```

---

## File Structure

```
spacehouse/
├── api.py                          # ✅ Backend (FastAPI)
├── parametric_building_configurator.py  # Original standalone script
└── frontend/                       # ✅ React app
    ├── src/
    │   ├── api/client.ts          # Axios API setup
    │   ├── store/projectStore.ts  # Zustand state
    │   ├── components/
    │   │   ├── CanvasEditor.tsx   # React-Konva canvas
    │   │   └── Sidebar.tsx        # BOM + compliance
    │   ├── types/index.ts         # TypeScript types
    │   └── App.tsx                # Main component
    ├── package.json
    └── README.md                  # Detailed documentation
```

---

## Next Steps

1. **Explore the Code**
   - Open `frontend/src/store/projectStore.ts` to see state management
   - Check `frontend/src/components/CanvasEditor.tsx` for canvas logic
   - Review `frontend/src/api/client.ts` for API integration

2. **Customize**
   - Add more wall types
   - Change default room dimensions
   - Modify validation rules
   - Add new material calculations

3. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```
   The optimized app will be in `frontend/dist/`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TS)                    │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ CanvasEditor  │  │ Zustand      │  │ Sidebar         │  │
│  │ (React-Konva) │→ │ Store        │→ │ (BOM Display)   │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
│         ↓                   ↓                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Client (Axios)                                   │   │
│  │ POST http://localhost:8000/calculate                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP (CORS enabled)
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Python)                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ CodeValidator  │  │ MaterialCalc     │  │ Pydantic    │ │
│  │ (IRC/IECC)     │  │ (BOM Engine)     │  │ Models      │ │
│  └────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Help & Support

- **Backend API Docs**: http://localhost:8000/docs
- **Frontend README**: `frontend/README.md`
- **Backend Code**: `api.py`
- **Original Logic**: `parametric_building_configurator.py`

---

## Summary

You now have a **full-stack parametric building configurator** with:

✅ **2D Interactive Canvas** (React-Konva)
✅ **Real-Time Code Validation** (IRC/IECC)
✅ **Live Material Calculation** (BOM)
✅ **Type-Safe API Integration** (TypeScript + Pydantic)
✅ **Modern State Management** (Zustand)
✅ **Responsive UI** (Tailwind CSS)

Enjoy building! 🏗️
