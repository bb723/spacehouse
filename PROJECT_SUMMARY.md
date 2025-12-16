# SpaceHouse - Parametric Building Configurator

## Project Overview

A full-stack application that combines construction engineering logic with real-time web-based visualization. Users can design building components in an interactive 2D canvas and receive instant feedback on code compliance (IRC/IECC) and material requirements.

---

## Tech Stack

### Backend
- **Python 3.12**
- **FastAPI** - Modern async web framework
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **React-Konva** - Canvas-based 2D rendering
- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│  ┌────────────┐        ┌────────────┐        ┌────────────┐     │
│  │  Drag Wall │   →    │ Change     │   →    │  Add       │     │
│  │  Handle    │        │ Room Type  │        │  Window    │     │
│  └────────────┘        └────────────┘        └────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Konva)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Zustand Store (projectStore.ts)                          │   │
│  │  • Project state (walls, windows, room)                  │   │
│  │  • Actions (updateWallLength, addWindow)                 │   │
│  │  • API integration (validateProject)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓ Updates                      ↓ Reads                   │
│  ┌─────────────────┐            ┌─────────────────┐             │
│  │ CanvasEditor    │            │ Sidebar         │             │
│  │ • Konva Stage   │            │ • Compliance    │             │
│  │ • Wall shapes   │            │ • BOM display   │             │
│  │ • Drag handles  │            │ • Controls      │             │
│  └─────────────────┘            └─────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
                    axios.post('/calculate', project)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ POST /calculate Endpoint                                 │   │
│  │  1. Receive Project JSON                                 │   │
│  │  2. Validate with Pydantic models                        │   │
│  │  3. Run CodeValidator                                    │   │
│  │  4. Run MaterialCalculator                               │   │
│  │  5. Return CalculationResponse                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓ Parallel Processing                                    │
│  ┌──────────────────┐              ┌───────────────────┐        │
│  │ CodeValidator    │              │ MaterialCalculator│        │
│  │ • IRC R305.1     │              │ • Studs calc      │        │
│  │ • IRC R310.1     │              │ • Drywall calc    │        │
│  │ • IECC R402.1    │              │ • Gravel calc     │        │
│  └──────────────────┘              └───────────────────┘        │
│         ↓                                    ↓                   │
│  ComplianceResult[]                 BillOfMaterials             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ JSON Response
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO FRONTEND                          │
│  {                                                               │
│    "compliance": [                                               │
│      { "code": "IRC R310.1", "severity": "ERROR", ... }          │
│    ],                                                            │
│    "bom": {                                                      │
│      "studs_count": 52,                                          │
│      "gravel_cubic_yards": 2.44,                                 │
│      ...                                                         │
│    },                                                            │
│    "summary": { ... }                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         UI UPDATES                               │
│  • Toast notification ("2 code violations found")                │
│  • Compliance section shows errors                              │
│  • BOM updates with new quantities                              │
│  • Cost estimate recalculates                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example

### Scenario: User drags wall to resize it

1. **User Action**
   - Drags orange circle handle on Wall 1
   - New position: 15 feet (was 12 feet)

2. **Canvas Event Handler** (`CanvasEditor.tsx`)
   ```typescript
   onDragMove={(e) => {
     const newX = e.target.x();
     const newLength = (newX - ORIGIN_X) / SCALE;
     updateWallLength(wall.id, newLength);
   }}
   ```

3. **Zustand Store Update** (`projectStore.ts`)
   ```typescript
   updateWallLength: (wallId, newLength) => {
     set((state) => ({
       project: {
         ...state.project,
         rooms: state.project.rooms.map((room) => ({
           ...room,
           walls: room.walls.map((wall) =>
             wall.id === wallId
               ? { ...wall, length_feet: newLength }
               : wall
           ),
         })),
       },
     }));

     // Auto-validate after 500ms
     setTimeout(() => get().validateProject(), 500);
   }
   ```

4. **API Call** (`api/client.ts`)
   ```typescript
   const result = await calculateProject(payload);
   // POST http://localhost:8000/calculate
   ```

5. **Backend Processing** (`api.py`)
   ```python
   @app.post("/calculate")
   def calculate_project(project: Project):
       compliance = CodeValidator.validate_project(project)
       bom = MaterialCalculator.calculate_project_materials(project)

       return CalculationResponse(
           compliance=compliance,
           bom=bom,
           summary={...}
       )
   ```

6. **Response Handling** (`projectStore.ts`)
   ```typescript
   set({
     calculationResult: result,
     compliance: result.compliance,
     bom: result.bom,
   });

   toast.success('Project passes all code checks!');
   ```

7. **UI Updates**
   - Sidebar shows new BOM: "55 studs (was 52)"
   - Canvas shows updated wall length label
   - Toast notification appears

---

## Key Files

### Backend Files

| File | Purpose | LOC |
|------|---------|-----|
| `api.py` | FastAPI server with endpoints | ~600 |
| `parametric_building_configurator.py` | Original standalone demo | ~600 |

### Frontend Files

| File | Purpose | LOC |
|------|---------|-----|
| `src/types/index.ts` | TypeScript type definitions | ~100 |
| `src/api/client.ts` | Axios API client setup | ~80 |
| `src/store/projectStore.ts` | Zustand state management | ~400 |
| `src/components/CanvasEditor.tsx` | React-Konva canvas | ~150 |
| `src/components/Sidebar.tsx` | BOM & compliance UI | ~250 |
| `src/App.tsx` | Main app layout | ~50 |

**Total:** ~2,200 lines of production code

---

## Features Implemented

### ✅ Interactive 2D Canvas
- [x] Top-down blueprint view
- [x] Click to select walls
- [x] Drag handles to resize
- [x] Visual window indicators
- [x] Color-coded wall types
- [x] Grid background with origin marker
- [x] Real-time dimension labels

### ✅ Code Compliance Validation
- [x] IRC R305.1 - Ceiling height (≥7 ft)
- [x] IRC R310.1 - Bedroom egress (≥5.7 sq ft)
- [x] IECC R402.1 - Thermal envelope (Climate Zone R-values)
- [x] Real-time error display
- [x] Severity levels (ERROR/WARNING)

### ✅ Material Calculation (BOM)
- [x] Framing lumber (studs, plates)
- [x] Sheathing (OSB) quantities
- [x] Drywall quantities
- [x] Insulation square footage
- [x] Foundation gravel (cubic yards)
- [x] Sheet count conversion (4x8 panels)
- [x] Cost estimation

### ✅ State Management
- [x] Zustand store with TypeScript
- [x] Wall manipulation (resize, add, remove)
- [x] Window management (add, remove)
- [x] Room configuration (type, ceiling height)
- [x] Project settings (climate zone, location)
- [x] Debounced validation (500ms)
- [x] Optimistic UI updates

### ✅ API Integration
- [x] REST API client with Axios
- [x] Type-safe request/response
- [x] Error handling
- [x] CORS configuration
- [x] Request/response interceptors
- [x] Health check endpoint

### ✅ User Experience
- [x] Toast notifications
- [x] Loading states
- [x] Responsive layout
- [x] Visual feedback (selection, hover)
- [x] Clear error messages
- [x] Interactive controls

---

## Code Quality Features

### Type Safety
- **Frontend:** TypeScript with strict mode
- **Backend:** Pydantic models with validation
- **API Contract:** Shared schema definitions

### State Management
- **Immutable updates** with Zustand
- **Debounced API calls** to reduce server load
- **Optimistic UI** for instant feedback

### Error Handling
- **API interceptors** for centralized error logging
- **Try-catch blocks** in async operations
- **User-friendly error messages** via toast notifications

### Code Organization
- **Separation of concerns:** Store, API, Components
- **Single Responsibility Principle:** Each file has one job
- **Type definitions in dedicated folder**

---

## API Endpoints

### GET `/`
Health check endpoint
```json
{
  "status": "online",
  "service": "Parametric Building Configurator API",
  "version": "1.0.0"
}
```

### POST `/calculate`
Full validation + BOM calculation

**Request:**
```json
{
  "name": "My House",
  "location_zip": "04101",
  "climate_zone": 6,
  "rooms": [
    {
      "room_type": "Bedroom",
      "ceiling_height_feet": 8.0,
      "walls": [...]
    }
  ]
}
```

**Response:**
```json
{
  "compliance": [
    {
      "code": "IRC R310.1",
      "severity": "ERROR",
      "message": "No window meets egress requirement...",
      "component": "Room 1 (Bedroom)"
    }
  ],
  "bom": {
    "studs_count": 52,
    "stud_linear_feet": 416.0,
    "sheathing_sqft": 352.0,
    "gravel_cubic_yards": 2.44
  },
  "summary": {
    "compliance_status": "FAIL",
    "violation_count": 1
  }
}
```

### POST `/validate`
Code validation only (no BOM)

### POST `/bom`
BOM calculation only (no validation)

---

## Setup Instructions Summary

### Backend Setup
```bash
# Install dependencies
pip install fastapi uvicorn pydantic

# Start server
python3.12 api.py

# Server runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Frontend Setup
```bash
# Install Node.js first (https://nodejs.org/)

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# App runs at http://localhost:3000
```

---

## Future Enhancements

### Near Term
- [ ] Multi-room support (edit multiple rooms)
- [ ] Save/load projects (localStorage or backend)
- [ ] Undo/redo functionality
- [ ] Copy/paste walls
- [ ] Keyboard shortcuts

### Medium Term
- [ ] 3D visualization (Three.js)
- [ ] Drag-and-drop window placement
- [ ] Material cost database integration
- [ ] PDF export (floor plans + BOM)
- [ ] User authentication

### Long Term
- [ ] Collaborative editing (WebSockets)
- [ ] Cloud project storage
- [ ] Mobile app (React Native)
- [ ] AI-powered design suggestions
- [ ] Integration with CAD software

---

## Performance Optimizations

### Frontend
- ✅ Debounced API calls (500ms)
- ✅ React.memo for expensive components (Canvas)
- ✅ Zustand (no unnecessary re-renders)
- ⏳ TODO: Virtual scrolling for large projects
- ⏳ TODO: Web Workers for heavy calculations

### Backend
- ✅ FastAPI async/await
- ✅ Pydantic validation caching
- ⏳ TODO: Redis caching for common calculations
- ⏳ TODO: Database for project persistence

---

## Security Considerations

### Current State (Development)
- ⚠️ CORS allows all origins (`allow_origins=["*"]`)
- ⚠️ No authentication
- ⚠️ No rate limiting

### Production Recommendations
- [ ] Restrict CORS to specific domains
- [ ] Add JWT authentication
- [ ] Implement rate limiting
- [ ] Input sanitization
- [ ] HTTPS only
- [ ] API key management

---

## Testing Strategy

### Backend Testing
```python
# TODO: Unit tests for validators
def test_bedroom_egress_validation():
    room = Room(...)
    violations = CodeValidator.validate_room(room)
    assert len(violations) == 1
    assert violations[0].code == "IRC R310.1"

# TODO: Integration tests for API
def test_calculate_endpoint():
    response = client.post("/calculate", json=project_data)
    assert response.status_code == 200
```

### Frontend Testing
```typescript
// TODO: Component tests with React Testing Library
test('wall updates trigger validation', async () => {
  render(<CanvasEditor />);
  // Simulate drag
  // Assert API was called
});

// TODO: Store tests
test('updateWallLength updates state', () => {
  const store = useProjectStore.getState();
  store.updateWallLength('wall-1', 15);
  expect(store.project.rooms[0].walls[0].length_feet).toBe(15);
});
```

---

## Deployment

### Backend Deployment (Example: Heroku)
```bash
# Add Procfile
web: uvicorn api:app --host 0.0.0.0 --port $PORT

# Deploy
git push heroku main
```

### Frontend Deployment (Example: Vercel)
```bash
# Build
npm run build

# Deploy
vercel --prod
```

---

## License

MIT License - Feel free to use, modify, and distribute

---

## Contributors

- Senior Software Architect (Backend Logic)
- Senior Backend Engineer (API Development)
- Senior Frontend Engineer (React Application)

---

## Project Stats

- **Total Files:** 20+
- **Total Lines of Code:** ~2,200
- **Development Time:** ~4 hours
- **Dependencies:** 30+ npm packages, 3 Python packages
- **API Endpoints:** 4
- **Supported Building Codes:** IRC 2021, IECC 2021

---

## Acknowledgments

- **FastAPI** - Modern Python web framework
- **React-Konva** - Canvas rendering for React
- **Zustand** - Minimal state management
- **Tailwind CSS** - Utility-first CSS framework

---

**Built with ❤️ for the AEC (Architecture, Engineering, Construction) industry**
