/**
 * Sidebar - Project Controls & BOM Display
 * Shows compliance results and live material estimates
 */

import { AlertCircle, CheckCircle2, Package, Settings, Home } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { RoomType, ClimateZone } from '../types';

export default function Sidebar() {
  const {
    project,
    compliance,
    bom,
    isValidating,
    selectedWallId,
    updateRoomType,
    updateCeilingHeight,
    updateClimateZone,
    addWindow,
    validateProject,
  } = useProjectStore();

  const room = project.rooms[0];
  const selectedWall = room.walls.find((w) => w.id === selectedWallId);

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-6 h-6" />
          <h2 className="text-xl font-bold">{project.name}</h2>
        </div>
        <p className="text-blue-100 text-sm">
          {project.location_zip} • Climate Zone {project.climate_zone}
        </p>
      </div>

      {/* Project Settings */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Project Settings</h3>
        </div>

        <div className="space-y-3">
          {/* Room Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Room Type</label>
            <select
              value={room.room_type}
              onChange={(e) => updateRoomType(e.target.value as RoomType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {Object.values(RoomType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Ceiling Height */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Ceiling Height: {room.ceiling_height_feet.toFixed(1)} ft
            </label>
            <input
              type="range"
              min="6"
              max="12"
              step="0.5"
              value={room.ceiling_height_feet}
              onChange={(e) => updateCeilingHeight(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Climate Zone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Climate Zone</label>
            <select
              value={project.climate_zone}
              onChange={(e) => updateClimateZone(parseInt(e.target.value) as ClimateZone)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {Object.values(ClimateZone)
                .filter((v) => typeof v === 'number')
                .map((zone) => (
                  <option key={zone} value={zone}>
                    Zone {zone}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Wall Editor */}
      {selectedWall && (
        <div className="p-4 bg-orange-50 border-b border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-3">
            Selected Wall: {selectedWall.length_feet.toFixed(1)} ft
          </h3>
          <button
            onClick={() =>
              addWindow(selectedWall.id, {
                width_inches: 36,
                height_inches: 48,
                u_factor: 0.3,
                window_type: 'Double-Hung',
              })
            }
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
          >
            + Add Window (3' x 4')
          </button>
          <p className="text-xs text-orange-700 mt-2">
            Windows: {selectedWall.windows.length} | Framing: {selectedWall.framing_type}
          </p>
        </div>
      )}

      {/* Compliance Results */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Code Compliance</h3>
          {isValidating && (
            <span className="text-xs text-blue-600 animate-pulse">Validating...</span>
          )}
        </div>

        {compliance.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">All checks passed!</span>
          </div>
        ) : (
          <div className="space-y-2">
            {compliance.map((issue, idx) => (
              <div
                key={idx}
                className={`flex gap-2 p-3 rounded text-sm ${
                  issue.severity === 'ERROR'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    issue.severity === 'ERROR' ? 'text-red-600' : 'text-yellow-600'
                  }`}
                />
                <div>
                  <div
                    className={`font-semibold ${
                      issue.severity === 'ERROR' ? 'text-red-900' : 'text-yellow-900'
                    }`}
                  >
                    {issue.code}
                  </div>
                  <div className="text-gray-700 text-xs mt-1">{issue.message}</div>
                  {issue.component && (
                    <div className="text-gray-500 text-xs mt-1">→ {issue.component}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill of Materials */}
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Bill of Materials</h3>
        </div>

        {bom ? (
          <div className="space-y-3">
            {/* Framing */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Framing</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Studs (2x6)</span>
                  <span className="font-mono font-semibold">{bom.studs_count} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stud Linear Feet</span>
                  <span className="font-mono">{bom.stud_linear_feet.toFixed(1)} LF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Top Plate</span>
                  <span className="font-mono">{bom.top_plate_lf.toFixed(1)} LF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bottom Plate</span>
                  <span className="font-mono">{bom.bottom_plate_lf.toFixed(1)} LF</span>
                </div>
              </div>
            </div>

            {/* Panels */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Panels</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sheathing (OSB)</span>
                  <span className="font-mono">{bom.sheathing_sqft.toFixed(0)} sq ft</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>4x8 sheets needed</span>
                  <span>{Math.ceil(bom.sheathing_sqft / 32)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drywall</span>
                  <span className="font-mono">{bom.drywall_sqft.toFixed(0)} sq ft</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>4x8 sheets needed</span>
                  <span>{Math.ceil(bom.drywall_sqft / 32)}</span>
                </div>
              </div>
            </div>

            {/* Insulation */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Insulation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fiberglass Batts</span>
                  <span className="font-mono">{bom.insulation_sqft.toFixed(0)} sq ft</span>
                </div>
              </div>
            </div>

            {/* Foundation */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Foundation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gravel (3/4")</span>
                  <span className="font-mono">{bom.gravel_cubic_yards.toFixed(2)} CY</span>
                </div>
              </div>
            </div>

            {/* Cost Estimate (placeholder) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-sm text-blue-900 mb-2">Estimated Cost</h4>
              <div className="text-2xl font-bold text-blue-700">
                ${((bom.studs_count * 8 + bom.gravel_cubic_yards * 45 + bom.drywall_sqft * 0.5) / 1).toFixed(2)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Materials only • Based on avg prices
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No BOM data yet</p>
            <button
              onClick={validateProject}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Calculate Materials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
