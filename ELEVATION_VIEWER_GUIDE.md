# Wall Elevation Viewer - Implementation Guide

## Overview

A professional wall elevation pane has been added to the TerraBuild application. This feature displays a dynamic, head-on view of selected walls with internal framing (studs) and an architectural title block.

## Features Implemented

### 1. Split-Screen Layout
- **Top Half**: Floor plan canvas (existing functionality)
- **Bottom Half**: Wall elevation viewer (appears when a wall is selected)
- Smooth transitions with fade-in animation
- Visual indicator in header when elevation view is active

### 2. Framing Renderer (Smart Stud Calculation)

The `renderFraming()` helper function intelligently calculates and renders:

#### Plates
- **Bottom Plate**: 1.5 inches high (rendered at base of wall)
- **Double Top Plate**: 3 inches high (rendered at top with dashed line showing separation)

#### Studs
- **Width**: 1.5 inches
- **Spacing**: Automatically calculated based on wall framing type:
  - `16oc` (16 inches on center)
  - `24oc` (24 inches on center)
- **Logic**:
  1. Always places a stud at position 0 (left end)
  2. Adds studs at spacing intervals
  3. Always places a stud at the right end
- **Visual Style**: Semi-transparent wood color (#E6C288) with black stroke

#### Scale
- 1 foot = 40 pixels for realistic proportions

### 3. Dimension Lines

Professional architectural dimension lines showing:

#### Horizontal (Wall Length)
- Main dimension line with arrows
- Formatted text (e.g., "12' 0\"")
- Positioned below the wall

#### Vertical (Wall Height)
- Main dimension line with arrows
- Formatted text (e.g., "8' 0\"")
- Positioned to the right of the wall

### 4. Professional Title Block

The title block matches standard architectural construction documents with:

#### Header Section
- Company branding: "TERRABUILD"
- Professional tagline

#### Project Information
- Project name
- Drawing type
- Wall ID

#### Wall Specifications
- Length (formatted as feet and inches)
- Height (formatted as feet and inches)
- Framing type
- Wall type (Exterior/Interior)
- Calculated stud count

#### Materials List
- All layers with thickness and R-value
- Dynamically reads from wall.layers

#### Windows List
- Window dimensions and U-factor
- Shows "No windows" if none exist

#### Revisions Block
- Date tracking
- Revision history

#### Footer
- Scale notation
- Sheet number

## File Structure

```
frontend/src/
├── components/
│   ├── ElevationViewer.tsx    # NEW - Main elevation viewer component
│   ├── CanvasEditor.tsx        # EXISTING - Floor plan canvas
│   └── Sidebar.tsx             # EXISTING - BOM/compliance sidebar
├── App.tsx                     # MODIFIED - Added elevation pane
├── index.css                   # MODIFIED - Added fade-in animation
├── store/projectStore.ts       # EXISTING - Already has selectedWallId
└── types/index.ts              # EXISTING - Wall interface already defined
```

## Component Architecture

### ElevationViewer.tsx Structure

```
ElevationViewer (Main Component)
├── FramingRenderer (Konva Canvas Component)
│   ├── Bottom Plate Rect
│   ├── Top Plate Rect
│   ├── Studs (mapped from calculateStudPositions)
│   ├── Dimension Line - Horizontal
│   └── Dimension Line - Vertical
└── TitleBlock (HTML/CSS Component)
    ├── Header
    ├── Project Information
    ├── Wall Specifications
    ├── Materials List
    ├── Windows List
    ├── Revisions Block
    └── Footer
```

## Usage

### How to Use the Elevation Viewer

1. **Start the application**: `npm run dev`
2. **Click on any wall** in the floor plan
3. **Elevation pane appears** at the bottom
4. **View details**:
   - Left side: Framing diagram with studs
   - Right side: Title block with specifications
5. **Click elsewhere** or deselect to hide

### Example Interaction Flow

```
User clicks Wall 1 (12' × 8', 2x6 @ 16oc)
    ↓
selectedWallId is set in store
    ↓
App.tsx detects selectedWallId
    ↓
Elevation pane slides in (fade animation)
    ↓
FramingRenderer calculates:
- 10 studs (0", 16", 32", 48", 64", 80", 96", 112", 128", 144")
- Bottom plate: 12' × 1.5"
- Top plate: 12' × 3"
    ↓
TitleBlock displays:
- Wall ID: WALL-1
- Length: 12' 0"
- Stud Count: 10
- Materials: Vinyl Siding, OSB, Fiberglass, Drywall
```

## Key Functions

### calculateStudPositions(wall: Wall): number[]

Calculates stud positions in inches from the left edge.

**Algorithm**:
1. Start with position 0
2. Add studs at spacing intervals (16" or 24")
3. End with wall length position
4. Returns array of positions in inches

**Example**:
```typescript
// Wall: 12 feet (144 inches), framing: 16oc
// Returns: [0, 16, 32, 48, 64, 80, 96, 112, 128, 144]
```

### formatDimension(feet: number): string

Formats decimal feet into architectural notation.

**Examples**:
```typescript
formatDimension(12.0)  // "12' 0\""
formatDimension(12.5)  // "12' 6\""
formatDimension(8.25)  // "8' 3\""
```

### inchesToPixels(inches: number): number

Converts inches to pixels using the scale factor.

**Formula**: `(inches / 12) * SCALE`

**Example**:
```typescript
inchesToPixels(1.5)  // 5 pixels (stud width)
inchesToPixels(96)   // 320 pixels (8 feet)
```

## Visual Styling

### Colors
- **Wood (studs/plates)**: `#E6C288` (semi-transparent beige)
- **Stroke (outlines)**: `#000000` (black)
- **Dimensions**: `#1f2937` (dark gray)
- **Title block border**: `#000000` (black, 2px)

### Typography
- **Title block headers**: 12px, semibold, uppercase
- **Title block values**: 12px, monospace
- **Dimension text**: 14px, bold
- **Stud labels**: 8px

## Integration Points

### Store Connection
```typescript
const { project, selectedWallId } = useProjectStore();
```

### Wall Data Access
```typescript
const selectedWall = project.rooms[0]?.walls.find(
  (wall) => wall.id === selectedWallId
);
```

### Conditional Rendering
```typescript
{selectedWallId && (
  <div className="h-1/2 border-t-2 border-gray-300 animate-fade-in">
    <ElevationViewer />
  </div>
)}
```

## Future Enhancements (Optional)

### Possible Additions
1. **Window rendering** on elevation view
2. **Door openings** with header details
3. **Export to PDF** button for construction documents
4. **Print layout** optimization
5. **Multiple wall comparison** side-by-side
6. **Stud detail callouts** (king studs, cripple studs, headers)
7. **Material layer visualization** (exploded view)
8. **Annotation tools** for notes and markups

## Testing Checklist

- [x] Wall selection triggers elevation pane
- [x] Stud count calculates correctly for 16oc
- [x] Stud count calculates correctly for 24oc
- [x] Dimension lines display accurate measurements
- [x] Title block shows all wall properties
- [x] Materials list populates from wall.layers
- [x] Windows list shows/hides based on wall.windows
- [x] Animation plays smoothly
- [x] No wall selected shows placeholder message
- [x] Layout is responsive

## Technical Details

### Dependencies
- **react-konva**: Canvas rendering (already installed)
- **konva**: Canvas library (already installed)
- **tailwindcss**: Styling (already installed)

### Performance Considerations
- Stud calculation is memoized via React rendering
- Canvas re-renders only when selected wall changes
- Dimension calculations are lightweight (no heavy math)

### Browser Compatibility
- Chrome ✅
- Firefox ✅
- Edge ✅
- Safari ✅ (requires konva canvas support)

## Code Quality

### Type Safety
- All components are fully TypeScript typed
- Uses existing `Wall` interface from types/index.ts
- No `any` types used

### Best Practices
- Functional components with hooks
- Proper separation of concerns (canvas vs. HTML)
- Reusable helper functions
- Clear naming conventions
- Comprehensive comments

---

## Quick Reference

### File Locations
- Main component: [ElevationViewer.tsx](frontend/src/components/ElevationViewer.tsx)
- Integration: [App.tsx](frontend/src/App.tsx#L54-L57)
- Animations: [index.css](frontend/src/index.css#L29-L43)

### Key Constants
```typescript
SCALE = 40                    // pixels per foot
STUD_WIDTH_INCHES = 1.5      // standard stud width
BOTTOM_PLATE_HEIGHT = 1.5    // inches
TOP_PLATE_HEIGHT = 3         // inches (double)
STUD_16OC = 16              // inches on center
STUD_24OC = 24              // inches on center
```

---

**Implementation Complete!** 🎉

The Wall Elevation Pane is now fully integrated into your TerraBuild application. Click any wall to see it in action!
