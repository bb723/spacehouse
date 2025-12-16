/**
 * ElevationViewer - Wall Elevation Pane
 * Displays a head-on (elevation) view of a selected wall with framing details
 * Includes studs, plates, and architectural title block
 */

import React from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import { useProjectStore } from '../store/projectStore';
import type { Wall } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SCALE = 40; // pixels per foot (1 ft = 40 px)
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MARGIN = 50;

// Dimensions in inches (converted to pixels later)
const STUD_WIDTH_INCHES = 1.5;
const BOTTOM_PLATE_HEIGHT_INCHES = 1.5;
const TOP_PLATE_HEIGHT_INCHES = 3; // Double top plate
const STUD_16OC = 16; // 16 inches on center
const STUD_24OC = 24; // 24 inches on center

// Visual styling
const WOOD_COLOR = '#E6C288';
const STROKE_COLOR = '#000000';
const DIMENSION_COLOR = '#1f2937';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert inches to pixels
 */
const inchesToPixels = (inches: number): number => {
  return (inches / 12) * SCALE;
};

/**
 * Calculate stud positions based on wall length and framing type
 */
const calculateStudPositions = (wall: Wall): number[] => {
  const lengthInches = wall.length_feet * 12;
  const spacing = wall.framing_type.includes('16oc') ? STUD_16OC : STUD_24OC;

  const positions: number[] = [];

  // Always start with a stud at position 0 (left end)
  positions.push(0);

  // Add studs at spacing intervals
  let currentPosition = spacing;
  while (currentPosition < lengthInches) {
    positions.push(currentPosition);
    currentPosition += spacing;
  }

  // Always end with a stud at the right end (if not already there)
  if (positions[positions.length - 1] !== lengthInches) {
    positions.push(lengthInches);
  }

  return positions;
};

/**
 * Format dimension text (e.g., "12' 6\"")
 */
const formatDimension = (feet: number): string => {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * 12);

  if (inches === 0) {
    return `${wholeFeet}' 0"`;
  }
  return `${wholeFeet}' ${inches}"`;
};

// ============================================================================
// TITLE BLOCK COMPONENT
// ============================================================================

interface TitleBlockProps {
  wall: Wall;
  studCount: number;
}

const TitleBlock: React.FC<TitleBlockProps> = ({ wall, studCount }) => {
  return (
    <div className="w-80 bg-white border-2 border-gray-900 shadow-xl flex flex-col h-full">
      {/* Header - Logo Area */}
      <div className="border-b-2 border-gray-900 p-4 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">TERRABUILD</h1>
        <p className="text-xs text-gray-600 mt-1">Professional Construction Software</p>
      </div>

      {/* Project Information */}
      <div className="flex-1 p-4 space-y-4">
        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Project Information
          </h2>
          <div className="space-y-1.5">
            <InfoRow label="Project" value="SpaceHouse Configurator" />
            <InfoRow label="Drawing" value="Wall Elevation Detail" />
            <InfoRow label="Wall ID" value={wall.id.toUpperCase()} />
          </div>
        </div>

        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Wall Specifications
          </h2>
          <div className="space-y-1.5">
            <InfoRow label="Length" value={formatDimension(wall.length_feet)} />
            <InfoRow label="Height" value={formatDimension(wall.height_feet)} />
            <InfoRow label="Framing" value={wall.framing_type} />
            <InfoRow label="Type" value={wall.is_exterior ? 'Exterior' : 'Interior'} />
            <InfoRow label="Stud Count" value={studCount.toString()} />
          </div>
        </div>

        <div className="border-b border-gray-300 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Materials
          </h2>
          <div className="space-y-1.5">
            {wall.layers.map((layer, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-600">{layer.name}</span>
                <span className="text-gray-900 font-mono">
                  {layer.thickness_inches}" (R-{layer.r_value})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Windows
          </h2>
          {wall.windows.length > 0 ? (
            <div className="space-y-1.5">
              {wall.windows.map((window, idx) => (
                <InfoRow
                  key={idx}
                  label={`Window ${idx + 1}`}
                  value={`${window.width_inches}" × ${window.height_inches}" (U=${window.u_factor})`}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No windows</p>
          )}
        </div>
      </div>

      {/* Revision Block */}
      <div className="border-t-2 border-gray-900 p-3 bg-gray-50">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Revisions
        </h2>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="font-semibold">Rev</div>
          <div className="font-semibold">Date</div>
          <div className="font-semibold">Description</div>

          <div>A</div>
          <div>{new Date().toLocaleDateString()}</div>
          <div>Initial Issue</div>
        </div>
      </div>

      {/* Footer - Scale and Sheet */}
      <div className="border-t-2 border-gray-900 p-2 bg-gray-900 text-white">
        <div className="flex justify-between text-xs font-mono">
          <span>SCALE: 1" = 1'-0"</span>
          <span>SHEET: E-1</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900 font-mono">{value}</span>
    </div>
  );
};

// ============================================================================
// FRAMING RENDERER (KONVA CANVAS)
// ============================================================================

interface FramingRendererProps {
  wall: Wall;
  onStudCountCalculated: (count: number) => void;
}

const FramingRenderer: React.FC<FramingRendererProps> = ({ wall, onStudCountCalculated }) => {
  // Convert dimensions to pixels
  const wallWidthPx = wall.length_feet * SCALE;
  const wallHeightPx = wall.height_feet * SCALE;
  const studWidthPx = inchesToPixels(STUD_WIDTH_INCHES);
  const bottomPlateHeightPx = inchesToPixels(BOTTOM_PLATE_HEIGHT_INCHES);
  const topPlateHeightPx = inchesToPixels(TOP_PLATE_HEIGHT_INCHES);

  // Calculate stud positions
  const studPositions = calculateStudPositions(wall);
  onStudCountCalculated(studPositions.length);

  // Calculate stud height (wall height minus plates)
  const studHeightPx = wallHeightPx - bottomPlateHeightPx - topPlateHeightPx;

  return (
    <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
      <Layer>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="#f9fafb"
        />

        {/* Main framing group */}
        <Group x={MARGIN} y={MARGIN}>
          {/* Bottom Plate */}
          <Rect
            x={0}
            y={wallHeightPx - bottomPlateHeightPx}
            width={wallWidthPx}
            height={bottomPlateHeightPx}
            fill={WOOD_COLOR}
            stroke={STROKE_COLOR}
            strokeWidth={1}
            opacity={0.9}
          />
          <Text
            x={5}
            y={wallHeightPx - bottomPlateHeightPx + 3}
            text="Bottom Plate"
            fontSize={9}
            fill={STROKE_COLOR}
          />

          {/* Top Plate (Double) */}
          <Rect
            x={0}
            y={0}
            width={wallWidthPx}
            height={topPlateHeightPx}
            fill={WOOD_COLOR}
            stroke={STROKE_COLOR}
            strokeWidth={1}
            opacity={0.9}
          />
          <Text
            x={5}
            y={3}
            text="Double Top Plate"
            fontSize={9}
            fill={STROKE_COLOR}
          />

          {/* Horizontal line to show the two top plates */}
          <Line
            points={[0, topPlateHeightPx / 2, wallWidthPx, topPlateHeightPx / 2]}
            stroke={STROKE_COLOR}
            strokeWidth={0.5}
            dash={[4, 2]}
          />

          {/* Studs */}
          {studPositions.map((positionInches, idx) => {
            const studXPx = inchesToPixels(positionInches) - studWidthPx / 2;

            return (
              <Group key={idx}>
                <Rect
                  x={studXPx}
                  y={topPlateHeightPx}
                  width={studWidthPx}
                  height={studHeightPx}
                  fill={WOOD_COLOR}
                  stroke={STROKE_COLOR}
                  strokeWidth={1}
                  opacity={0.85}
                />

                {/* Stud label */}
                <Text
                  x={studXPx}
                  y={topPlateHeightPx + studHeightPx + 5}
                  text={`${idx + 1}`}
                  fontSize={8}
                  fill={DIMENSION_COLOR}
                />
              </Group>
            );
          })}

          {/* Wall outline */}
          <Rect
            x={0}
            y={0}
            width={wallWidthPx}
            height={wallHeightPx}
            stroke="#374151"
            strokeWidth={2}
            fill="transparent"
          />
        </Group>

        {/* Dimension Line - Wall Length */}
        <Group x={MARGIN} y={MARGIN + wallHeightPx + 30}>
          {/* Main dimension line */}
          <Line
            points={[0, 0, wallWidthPx, 0]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />

          {/* Left arrow */}
          <Line
            points={[0, -5, 0, 5]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[0, 0, 8, -3]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[0, 0, 8, 3]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />

          {/* Right arrow */}
          <Line
            points={[wallWidthPx, -5, wallWidthPx, 5]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[wallWidthPx, 0, wallWidthPx - 8, -3]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[wallWidthPx, 0, wallWidthPx - 8, 3]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />

          {/* Dimension text */}
          <Text
            x={wallWidthPx / 2 - 30}
            y={-20}
            text={formatDimension(wall.length_feet)}
            fontSize={14}
            fontStyle="bold"
            fill={DIMENSION_COLOR}
          />
        </Group>

        {/* Dimension Line - Wall Height */}
        <Group x={MARGIN + wallWidthPx + 30} y={MARGIN}>
          {/* Main dimension line */}
          <Line
            points={[0, 0, 0, wallHeightPx]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />

          {/* Top arrow */}
          <Line
            points={[-5, 0, 5, 0]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[0, 0, -3, 8]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[0, 0, 3, 8]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />

          {/* Bottom arrow */}
          <Line
            points={[-5, wallHeightPx, 5, wallHeightPx]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[0, wallHeightPx, -3, wallHeightPx - 8]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />
          <Line
            points={[0, wallHeightPx, 3, wallHeightPx - 8]}
            stroke={DIMENSION_COLOR}
            strokeWidth={1.5}
          />

          {/* Dimension text (rotated) */}
          <Text
            x={15}
            y={wallHeightPx / 2 - 20}
            text={formatDimension(wall.height_feet)}
            fontSize={14}
            fontStyle="bold"
            fill={DIMENSION_COLOR}
          />
        </Group>

        {/* Title */}
        <Text
          x={MARGIN}
          y={15}
          text="WALL FRAMING ELEVATION"
          fontSize={16}
          fontStyle="bold"
          fill="#111827"
        />
      </Layer>
    </Stage>
  );
};

// ============================================================================
// MAIN ELEVATION VIEWER COMPONENT
// ============================================================================

export default function ElevationViewer() {
  const { project, selectedWallId } = useProjectStore();
  const [studCount, setStudCount] = React.useState(0);

  // Find the selected wall
  const selectedWall = project.rooms[0]?.walls.find(
    (wall) => wall.id === selectedWallId
  );

  if (!selectedWallId || !selectedWall) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border-l-2 border-gray-200">
        <div className="text-center p-8">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Wall Selected
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            Select a wall from the floor plan to view its elevation details, framing layout, and specifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white border-l-2 border-gray-200">
      {/* Left Side - Konva Canvas (The Drawing) */}
      <div className="flex-1 bg-gray-50 p-4 overflow-auto">
        <FramingRenderer wall={selectedWall} onStudCountCalculated={setStudCount} />
      </div>

      {/* Right Side - Title Block (The Branding) */}
      <TitleBlock wall={selectedWall} studCount={studCount} />
    </div>
  );
}
