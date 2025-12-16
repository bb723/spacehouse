/**
 * TypeScript types that mirror the FastAPI Pydantic models
 * These ensure type safety between frontend and backend
 */

// ============================================================================
// ENUMERATIONS
// ============================================================================

export enum FramingType {
  STUD_2x4_16OC = "2x4 @ 16oc",
  STUD_2x4_24OC = "2x4 @ 24oc",
  STUD_2x6_16OC = "2x6 @ 16oc",
  STUD_2x6_24OC = "2x6 @ 24oc",
}

export enum RoomType {
  BEDROOM = "Bedroom",
  KITCHEN = "Kitchen",
  BATHROOM = "Bathroom",
  LIVING = "Living Room",
  UTILITY = "Utility",
}

export enum ClimateZone {
  ZONE_1 = 1,
  ZONE_2 = 2,
  ZONE_3 = 3,
  ZONE_4 = 4,
  ZONE_5 = 5,
  ZONE_6 = 6,
  ZONE_7 = 7,
  ZONE_8 = 8,
}

// ============================================================================
// DATA MODELS (Mirror Backend Pydantic Schemas)
// ============================================================================

export interface MaterialLayer {
  name: string;
  thickness_inches: number;
  r_value: number;
}

export interface Window {
  width_inches: number;
  height_inches: number;
  u_factor: number;
  window_type: string;
}

export interface Wall {
  id: string; // Frontend-only: for tracking in UI
  length_feet: number;
  height_feet: number;
  framing_type: FramingType;
  is_exterior: boolean;
  layers: MaterialLayer[];
  windows: Window[];
}

export interface Room {
  room_type: RoomType;
  ceiling_height_feet: number;
  walls: Wall[];
}

export interface Project {
  name: string;
  location_zip: string;
  climate_zone: ClimateZone;
  rooms: Room[];
}

// ============================================================================
// API RESPONSE MODELS
// ============================================================================

export interface ComplianceResult {
  code: string;
  severity: "ERROR" | "WARNING";
  message: string;
  component?: string;
}

export interface BillOfMaterials {
  studs_count: number;
  stud_linear_feet: number;
  top_plate_lf: number;
  bottom_plate_lf: number;
  sheathing_sqft: number;
  drywall_sqft: number;
  insulation_sqft: number;
  gravel_cubic_yards: number;
}

export interface CalculationResponse {
  compliance: ComplianceResult[];
  bom: BillOfMaterials;
  summary: {
    project_name: string;
    location: string;
    climate_zone: number;
    total_rooms: number;
    total_walls: number;
    total_windows: number;
    compliance_status: "PASS" | "FAIL";
    violation_count: number;
  };
}
