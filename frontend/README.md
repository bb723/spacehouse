# SpaceHouse Frontend - Interactive Building Configurator

A React + TypeScript application for parametric building design with real-time code validation and material calculation.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React-Konva** - 2D Canvas for interactive blueprints
- **Zustand** - State management
- **Axios** - API client
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Features

### 1. Interactive 2D Canvas
- Top-down blueprint view of rooms
- Drag handles to resize walls
- Click-to-select walls
- Visual window placement
- Color-coded exterior/interior walls

### 2. Real-Time Code Validation
- Automatic validation on every change
- IRC (International Residential Code) compliance
- IECC (International Energy Conservation Code) compliance
- Live error/warning display

### 3. Material Calculation (BOM)
- Framing lumber (studs, plates)
- Sheathing and drywall quantities
- Insulation requirements
- Foundation gravel volume
- Cost estimation

### 4. Project Controls
- Room type selector (Bedroom, Kitchen, etc.)
- Climate zone configuration
- Ceiling height adjustment
- Window management

## Prerequisites

Before you begin, ensure you have installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Backend API** (Must be running)
   - The FastAPI server at `http://localhost:8000`
   - See `../api.py` in the parent directory

## Installation

### Step 1: Install Node.js

If Node.js is not installed:

**Windows:**
```bash
# Download from https://nodejs.org/
# Or use Windows Package Manager
winget install OpenJS.NodeJS
```

**macOS:**
```bash
brew install node
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install Dependencies

Navigate to the frontend directory and install packages:

```bash
cd frontend
npm install
```

This will install:
- React and React DOM
- Vite and TypeScript tooling
- React-Konva for canvas rendering
- Zustand for state management
- Axios for API calls
- Tailwind CSS for styling
- React Hot Toast for notifications
- Lucide React for icons

### Step 3: Start the Backend API

**IMPORTANT:** The frontend requires the backend API to be running.

In a separate terminal:

```bash
# Navigate to the parent directory
cd ..

# Start the FastAPI server
python3.12 api.py
```

You should see:
```
================================================================================
Starting Parametric Building Configurator API
================================================================================

Server running at: http://localhost:8000
API Documentation: http://localhost:8000/docs
```

### Step 4: Start the Development Server

Back in the frontend directory:

```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts           # Axios API client
│   ├── components/
│   │   ├── CanvasEditor.tsx    # Interactive 2D canvas
│   │   └── Sidebar.tsx         # BOM & compliance display
│   ├── store/
│   │   └── projectStore.ts     # Zustand state management
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Usage Guide

### 1. Canvas Interactions

**Select a Wall:**
- Click on any wall (blue = exterior, gray = interior)
- The selected wall will have an orange border

**Resize a Wall:**
- Select a wall
- Drag the orange circle handle
- The wall length will update in real-time
- Validation will run automatically (500ms debounce)

**View Windows:**
- Windows appear as light blue rectangles on walls

### 2. Sidebar Controls

**Project Settings:**
- **Room Type**: Changes code requirements (Bedroom needs egress window)
- **Ceiling Height**: IRC requires minimum 7ft
- **Climate Zone**: Affects required R-value for walls

**Selected Wall Actions:**
- Click "Add Window" to add a 3'x4' window to the selected wall

**Compliance Section:**
- Green checkmark = All code checks passed
- Red alerts = Code violations (must fix)
- Yellow alerts = Warnings

**Bill of Materials:**
- Live-updating material quantities
- Organized by category (Framing, Panels, Insulation, Foundation)
- Includes sheet counts for 4x8 panels
- Cost estimate (simplified)

### 3. Real-Time Validation

The app automatically validates when you:
- Resize a wall
- Change room type
- Adjust ceiling height
- Add/remove windows
- Change climate zone

**Validation Flow:**
1. User makes a change
2. 500ms debounce delay
3. POST request to `/calculate` endpoint
4. Response updates compliance + BOM
5. Toast notification shows result

### 4. Common Code Violations

**IRC R310.1 - Bedroom Egress:**
- Bedrooms require at least one window with 5.7 sq ft clear opening
- Default 3'x4' window = 12 sq ft total × 0.9 = 10.8 sq ft clear ✅

**IRC R305.1 - Ceiling Height:**
- Minimum 7 feet for habitable rooms
- Use the ceiling height slider to adjust

**IECC R402.1 - Thermal Envelope:**
- Climate Zone 6 requires R-20 exterior walls
- Default assembly: R-19.65 (may fail if Climate Zone 6)
- Add more insulation layers to pass

## API Endpoints Used

The frontend communicates with these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/calculate` | POST | Full validation + BOM calculation |
| `/validate` | POST | Code compliance only |
| `/bom` | POST | Material calculation only |

## Development Commands

```bash
# Start dev server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Troubleshooting

### Issue: "Failed to validate project. Check API connection."

**Solution:**
1. Verify the backend API is running at `http://localhost:8000`
2. Check browser console for CORS errors
3. Test the API directly: Visit `http://localhost:8000/docs`

### Issue: Canvas not rendering

**Solution:**
1. Check browser console for errors
2. Ensure React-Konva is installed: `npm install react-konva konva`
3. Try refreshing the page

### Issue: TypeScript errors

**Solution:**
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Restart your editor/IDE
3. Check `tsconfig.json` is properly configured

### Issue: Tailwind styles not applying

**Solution:**
1. Ensure `index.css` imports Tailwind directives
2. Verify `tailwind.config.js` content paths include `./src/**/*.{js,ts,jsx,tsx}`
3. Restart the dev server

## Environment Variables

Create a `.env` file if you need to customize the API URL:

```env
VITE_API_URL=http://localhost:8000
```

Then update `src/api/client.ts`:
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  // ...
});
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

- [ ] Multi-room support
- [ ] 3D view with Three.js
- [ ] Save/load projects to backend
- [ ] Export to PDF
- [ ] Drag-and-drop window placement
- [ ] Material cost database integration
- [ ] Undo/redo functionality
- [ ] Collaborative editing

## License

MIT
