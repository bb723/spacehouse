/**
 * Zustand Store for Project State Management
 * Mirrors backend schemas and handles API synchronization
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { calculateProject } from '../api/client';
import {
  FramingType,
  RoomType,
  ClimateZone,
} from '../types';
import type {
  Project,
  Wall,
  Window,
  MaterialLayer,
  CalculationResponse,
  ComplianceResult,
  BillOfMaterials,
} from '../types';

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface ProjectState {
  // Current project data
  project: Project;

  // API response data
  calculationResult: CalculationResponse | null;
  compliance: ComplianceResult[];
  bom: BillOfMaterials | null;

  // UI state
  isValidating: boolean;
  selectedWallId: string | null;

  // Actions - Wall manipulation
  updateWallLength: (wallId: string, newLength: number) => void;
  updateWallHeight: (wallId: string, newHeight: number) => void;
  updateWallFraming: (wallId: string, newFraming: FramingType) => void;
  addWall: (wall: Omit<Wall, 'id'>) => void;
  removeWall: (wallId: string) => void;

  // Actions - Window manipulation
  addWindow: (wallId: string, window: Window) => void;
  removeWindow: (wallId: string, windowIndex: number) => void;

  // Actions - Room manipulation
  updateRoomType: (roomType: RoomType) => void;
  updateCeilingHeight: (height: number) => void;

  // Actions - Project settings
  updateProjectName: (name: string) => void;
  updateClimateZone: (zone: ClimateZone) => void;
  updateLocationZip: (zip: string) => void;

  // Actions - API operations
  validateProject: () => Promise<void>;
  setSelectedWall: (wallId: string | null) => void;

  // Actions - Reset
  resetProject: () => void;
}

// ============================================================================
// DEFAULT WALL ASSEMBLY (Exterior 2x6 Wall)
// ============================================================================

const createDefaultLayers = (): MaterialLayer[] => [
  {
    name: "Vinyl Siding",
    thickness_inches: 0.5,
    r_value: 0.6,
  },
  {
    name: "OSB Sheathing",
    thickness_inches: 0.5,
    r_value: 0.6,
  },
  {
    name: "Fiberglass Batt R-19",
    thickness_inches: 5.5,
    r_value: 19.0,
  },
  {
    name: "Drywall",
    thickness_inches: 0.5,
    r_value: 0.45,
  },
];

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialProject: Project = {
  name: "My House Project",
  location_zip: "04101",
  climate_zone: ClimateZone.ZONE_6,
  rooms: [
    {
      room_type: RoomType.BEDROOM,
      ceiling_height_feet: 8.0,
      walls: [
        {
          id: "wall-1",
          length_feet: 12.0,
          height_feet: 8.0,
          framing_type: FramingType.STUD_2x6_16OC,
          is_exterior: true,
          layers: createDefaultLayers(),
          windows: [
            {
              width_inches: 36,
              height_inches: 48,
              u_factor: 0.30,
              window_type: "Double-Hung",
            },
          ],
        },
        {
          id: "wall-2",
          length_feet: 10.0,
          height_feet: 8.0,
          framing_type: FramingType.STUD_2x6_16OC,
          is_exterior: true,
          layers: createDefaultLayers(),
          windows: [],
        },
        {
          id: "wall-3",
          length_feet: 12.0,
          height_feet: 8.0,
          framing_type: FramingType.STUD_2x6_16OC,
          is_exterior: true,
          layers: createDefaultLayers(),
          windows: [],
        },
        {
          id: "wall-4",
          length_feet: 10.0,
          height_feet: 8.0,
          framing_type: FramingType.STUD_2x6_16OC,
          is_exterior: false,
          layers: [],
          windows: [],
        },
      ],
    },
  ],
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // Initial state
      project: initialProject,
      calculationResult: null,
      compliance: [],
      bom: null,
      isValidating: false,
      selectedWallId: null,

      // ========================================================================
      // WALL ACTIONS
      // ========================================================================

      updateWallLength: (wallId: string, newLength: number) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.map((wall) =>
                wall.id === wallId ? { ...wall, length_feet: newLength } : wall
              ),
            })),
          },
        }));

        // Auto-validate after update
        setTimeout(() => get().validateProject(), 500);
      },

      updateWallHeight: (wallId: string, newHeight: number) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.map((wall) =>
                wall.id === wallId ? { ...wall, height_feet: newHeight } : wall
              ),
            })),
          },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      updateWallFraming: (wallId: string, newFraming: FramingType) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.map((wall) =>
                wall.id === wallId ? { ...wall, framing_type: newFraming } : wall
              ),
            })),
          },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      addWall: (wall: Omit<Wall, 'id'>) => {
        const newWall: Wall = {
          ...wall,
          id: `wall-${Date.now()}`,
        };

        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room, idx) =>
              idx === 0 ? { ...room, walls: [...room.walls, newWall] } : room
            ),
          },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      removeWall: (wallId: string) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.filter((wall) => wall.id !== wallId),
            })),
          },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      // ========================================================================
      // WINDOW ACTIONS
      // ========================================================================

      addWindow: (wallId: string, window: Window) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.map((wall) =>
                wall.id === wallId
                  ? { ...wall, windows: [...wall.windows, window] }
                  : wall
              ),
            })),
          },
        }));

        toast.success('Window added');
        setTimeout(() => get().validateProject(), 500);
      },

      removeWindow: (wallId: string, windowIndex: number) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.map((wall) =>
                wall.id === wallId
                  ? {
                      ...wall,
                      windows: wall.windows.filter((_, idx) => idx !== windowIndex),
                    }
                  : wall
              ),
            })),
          },
        }));

        toast.success('Window removed');
        setTimeout(() => get().validateProject(), 500);
      },

      // ========================================================================
      // ROOM ACTIONS
      // ========================================================================

      updateRoomType: (roomType: RoomType) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room, idx) =>
              idx === 0 ? { ...room, room_type: roomType } : room
            ),
          },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      updateCeilingHeight: (height: number) => {
        set((state) => ({
          project: {
            ...state.project,
            rooms: state.project.rooms.map((room, idx) =>
              idx === 0 ? { ...room, ceiling_height_feet: height } : room
            ),
          },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      // ========================================================================
      // PROJECT ACTIONS
      // ========================================================================

      updateProjectName: (name: string) => {
        set((state) => ({
          project: { ...state.project, name },
        }));
      },

      updateClimateZone: (zone: ClimateZone) => {
        set((state) => ({
          project: { ...state.project, climate_zone: zone },
        }));

        setTimeout(() => get().validateProject(), 500);
      },

      updateLocationZip: (zip: string) => {
        set((state) => ({
          project: { ...state.project, location_zip: zip },
        }));
      },

      // ========================================================================
      // API VALIDATION
      // ========================================================================

      validateProject: async () => {
        const state = get();

        set({ isValidating: true });

        try {
          // Prepare payload (remove frontend-only 'id' field from walls)
          const payload: Project = {
            ...state.project,
            rooms: state.project.rooms.map((room) => ({
              ...room,
              walls: room.walls.map(({ id, ...wall }) => wall) as Wall[],
            })),
          };

          const result = await calculateProject(payload);

          set({
            calculationResult: result,
            compliance: result.compliance,
            bom: result.bom,
            isValidating: false,
          });

          // Show toast notifications for violations
          if (result.compliance.length > 0) {
            const errorCount = result.compliance.filter((c) => c.severity === 'ERROR').length;
            toast.error(`${errorCount} code violation(s) found`, {
              duration: 4000,
            });
          } else {
            toast.success('Project passes all code checks!', {
              duration: 2000,
            });
          }
        } catch (error) {
          console.error('Validation failed:', error);
          set({ isValidating: false });
          toast.error('Failed to validate project. Check API connection.');
        }
      },

      // ========================================================================
      // UI STATE
      // ========================================================================

      setSelectedWall: (wallId: string | null) => {
        set({ selectedWallId: wallId });
      },

      // ========================================================================
      // RESET
      // ========================================================================

      resetProject: () => {
        set({
          project: initialProject,
          calculationResult: null,
          compliance: [],
          bom: null,
          selectedWallId: null,
        });

        toast.success('Project reset');
      },
    }),
    { name: 'ProjectStore' }
  )
);
