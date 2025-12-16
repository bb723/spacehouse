/**
 * CanvasEditor - Interactive 2D Blueprint Canvas
 * Uses React-Konva to render a top-down view of the room
 * Allows dragging walls and triggers real-time validation
 */

import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Line, Text, Circle } from 'react-konva';
import { useProjectStore } from '../store/projectStore';
import type { Wall } from '../types';

const SCALE = 30; // pixels per foot
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const WALL_THICKNESS = 6; // pixels
const ORIGIN_X = 100;
const ORIGIN_Y = 100;

export default function CanvasEditor() {
  const { project, selectedWallId, setSelectedWall, updateWallLength, validateProject } =
    useProjectStore();

  const stageRef = useRef(null);
  const room = project.rooms[0]; // For simplicity, edit the first room

  // Validate on mount
  useEffect(() => {
    validateProject();
  }, [validateProject]);

  /**
   * Render a wall as a rectangle
   * Color-coded: Blue = exterior, Gray = interior
   */
  const renderWall = (wall: Wall, index: number) => {
    const isSelected = wall.id === selectedWallId;

    // Calculate wall position based on index (simple box layout)
    const positions = [
      { x: ORIGIN_X, y: ORIGIN_Y, width: wall.length_feet * SCALE, height: WALL_THICKNESS }, // North
      { x: ORIGIN_X + room.walls[0].length_feet * SCALE, y: ORIGIN_Y, width: WALL_THICKNESS, height: wall.length_feet * SCALE }, // East
      { x: ORIGIN_X, y: ORIGIN_Y + room.walls[1].length_feet * SCALE, width: wall.length_feet * SCALE, height: WALL_THICKNESS }, // South
      { x: ORIGIN_X, y: ORIGIN_Y, width: WALL_THICKNESS, height: wall.length_feet * SCALE }, // West
    ];

    const pos = positions[index] || positions[0];

    return (
      <React.Fragment key={wall.id}>
        {/* Wall Rectangle */}
        <Rect
          x={pos.x}
          y={pos.y}
          width={pos.width}
          height={pos.height}
          fill={wall.is_exterior ? '#3b82f6' : '#6b7280'}
          stroke={isSelected ? '#f59e0b' : '#1f2937'}
          strokeWidth={isSelected ? 3 : 1}
          shadowBlur={isSelected ? 10 : 0}
          shadowColor="orange"
          onClick={() => setSelectedWall(wall.id)}
          onTap={() => setSelectedWall(wall.id)}
        />

        {/* Wall Label */}
        <Text
          x={pos.x + 10}
          y={pos.y - 20}
          text={`Wall ${index + 1}: ${wall.length_feet.toFixed(1)}ft`}
          fontSize={12}
          fill="#1f2937"
        />

        {/* Drag Handle (resize point) */}
        {isSelected && (
          <Circle
            x={index === 0 ? pos.x + pos.width : index === 1 ? pos.x + pos.width / 2 : index === 2 ? pos.x + pos.width : pos.x + pos.width / 2}
            y={index === 0 ? pos.y + pos.height / 2 : index === 1 ? pos.y + pos.height : index === 2 ? pos.y + pos.height / 2 : pos.y + pos.height}
            radius={8}
            fill="#f59e0b"
            stroke="#000"
            strokeWidth={1}
            draggable
            dragBoundFunc={(newPos) => {
              // Constrain drag to only the relevant axis
              if (index === 0 || index === 2) {
                // North/South walls - horizontal drag only
                return { x: Math.max(ORIGIN_X + 5 * SCALE, newPos.x), y: index === 0 ? ORIGIN_Y + WALL_THICKNESS / 2 : pos.y + pos.height / 2 };
              } else {
                // East/West walls - vertical drag only
                return { x: index === 1 ? pos.x + pos.width / 2 : ORIGIN_X + WALL_THICKNESS / 2, y: Math.max(ORIGIN_Y + 5 * SCALE, newPos.y) };
              }
            }}
            onDragMove={(e) => {
              if (index === 0) {
                // North wall - horizontal resize
                const newX = e.target.x();
                const newLength = Math.max(5, (newX - ORIGIN_X) / SCALE);
                updateWallLength(wall.id, Math.round(newLength * 10) / 10);
              } else if (index === 1) {
                // East wall - vertical resize
                const newY = e.target.y();
                const newLength = Math.max(5, (newY - ORIGIN_Y) / SCALE);
                updateWallLength(wall.id, Math.round(newLength * 10) / 10);
              } else if (index === 2) {
                // South wall - horizontal resize
                const newX = e.target.x();
                const newLength = Math.max(5, (newX - ORIGIN_X) / SCALE);
                updateWallLength(wall.id, Math.round(newLength * 10) / 10);
              } else if (index === 3) {
                // West wall - vertical resize
                const newY = e.target.y();
                const newLength = Math.max(5, (newY - ORIGIN_Y) / SCALE);
                updateWallLength(wall.id, Math.round(newLength * 10) / 10);
              }
            }}
          />
        )}

        {/* Render windows on this wall */}
        {wall.windows.map((window, winIdx) => {
          const windowWidth = (window.width_inches / 12) * SCALE;
          const windowHeight = WALL_THICKNESS * 2;

          return (
            <Rect
              key={`${wall.id}-window-${winIdx}`}
              x={pos.x + 20 + winIdx * 60}
              y={pos.y - 5}
              width={windowWidth}
              height={windowHeight}
              fill="#60a5fa"
              stroke="#1e40af"
              strokeWidth={2}
            />
          );
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="relative bg-gray-50 border-2 border-gray-300 rounded-lg overflow-hidden">
      {/* Canvas Header */}
      <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow-md z-10">
        <h3 className="font-bold text-gray-800">2D Floor Plan - Top View</h3>
        <p className="text-xs text-gray-600">Click walls to select • Drag orange handles to resize</p>
      </div>

      {/* Grid Background */}
      <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef}>
        <Layer>
          {/* Grid Lines */}
          {Array.from({ length: 30 }).map((_, i) => (
            <React.Fragment key={`grid-${i}`}>
              <Line
                points={[0, i * 30, CANVAS_WIDTH, i * 30]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
              />
              <Line
                points={[i * 30, 0, i * 30, CANVAS_HEIGHT]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
              />
            </React.Fragment>
          ))}

          {/* Origin Marker */}
          <Circle x={ORIGIN_X} y={ORIGIN_Y} radius={5} fill="#ef4444" />
          <Text x={ORIGIN_X + 10} y={ORIGIN_Y - 10} text="Origin" fontSize={10} fill="#991b1b" />

          {/* Render Walls */}
          {room.walls.map((wall, index) => renderWall(wall, index))}

          {/* Room Label */}
          <Text
            x={ORIGIN_X + 50}
            y={ORIGIN_Y + 50}
            text={`${room.room_type} (${room.ceiling_height_feet}ft ceiling)`}
            fontSize={16}
            fontStyle="bold"
            fill="#374151"
          />
        </Layer>
      </Stage>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white px-4 py-3 rounded shadow-md">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border border-gray-800"></div>
            <span>Exterior Wall</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 border border-gray-800"></div>
            <span>Interior Wall</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 border-2 border-blue-800"></div>
            <span>Window</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span>Resize Handle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
