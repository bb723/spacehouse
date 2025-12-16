"""
Parametric Building Configurator - REST API
Exposes the construction logic engine as a FastAPI service for frontend consumption.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any
from enum import Enum
import uvicorn


# ============================================================================
# ENUMERATIONS - Domain-Specific Types
# ============================================================================

class FramingType(str, Enum):
    """Standard wood framing configurations"""
    STUD_2x4_16OC = "2x4 @ 16oc"
    STUD_2x4_24OC = "2x4 @ 24oc"
    STUD_2x6_16OC = "2x6 @ 16oc"
    STUD_2x6_24OC = "2x6 @ 24oc"


class RoomType(str, Enum):
    """IRC Room Classifications"""
    BEDROOM = "Bedroom"
    KITCHEN = "Kitchen"
    BATHROOM = "Bathroom"
    LIVING = "Living Room"
    UTILITY = "Utility"


class ClimateZone(int, Enum):
    """IECC Climate Zone Classifications"""
    ZONE_1 = 1
    ZONE_2 = 2
    ZONE_3 = 3
    ZONE_4 = 4
    ZONE_5 = 5
    ZONE_6 = 6
    ZONE_7 = 7
    ZONE_8 = 8


# ============================================================================
# PYDANTIC MODELS - API Request/Response Schemas
# ============================================================================

class MaterialLayer(BaseModel):
    """
    Represents a single layer in a wall assembly.
    Pydantic automatically validates types on API requests.
    """
    name: str = Field(..., description="Layer material name", example="Fiberglass Batt R-19")
    thickness_inches: float = Field(..., gt=0, description="Nominal thickness in inches", example=5.5)
    r_value: float = Field(..., ge=0, description="Thermal resistance (ft²·°F·h/BTU)", example=19.0)

    class Config:
        use_enum_values = True


class Window(BaseModel):
    """
    Window component with egress and thermal properties.
    """
    width_inches: float = Field(..., gt=0, description="Window width in inches", example=36)
    height_inches: float = Field(..., gt=0, description="Window height in inches", example=48)
    u_factor: float = Field(..., gt=0, le=2.0, description="Thermal transmittance", example=0.30)
    window_type: str = Field(default="Double-Hung", description="Window style", example="Double-Hung")

    @property
    def area_sqft(self) -> float:
        """Total window area in square feet"""
        return (self.width_inches * self.height_inches) / 144.0

    @property
    def clear_opening_sqft(self) -> float:
        """
        IRC requires "clear opening" for egress calculations.
        Assumes 90% of total area is operable.
        """
        return self.area_sqft * 0.9

    class Config:
        use_enum_values = True


class Wall(BaseModel):
    """
    Intelligent wall component with framing, layers, and openings.
    """
    length_feet: float = Field(..., gt=0, description="Wall length in feet", example=12.0)
    height_feet: float = Field(..., gt=0, description="Wall height in feet", example=8.0)
    framing_type: FramingType = Field(..., description="Framing configuration")
    is_exterior: bool = Field(..., description="Exterior vs interior wall")
    layers: List[MaterialLayer] = Field(default_factory=list, description="Wall assembly layers")
    windows: List[Window] = Field(default_factory=list, description="Window openings")

    @validator('height_feet')
    def validate_height(cls, v):
        if v < 6.0:
            raise ValueError('Wall height must be at least 6 feet')
        if v > 20.0:
            raise ValueError('Wall height cannot exceed 20 feet (residential)')
        return v

    @property
    def area_sqft(self) -> float:
        """Gross wall area"""
        return self.length_feet * self.height_feet

    @property
    def net_area_sqft(self) -> float:
        """Wall area minus window openings"""
        window_area = sum(w.area_sqft for w in self.windows)
        return self.area_sqft - window_area

    @property
    def total_r_value(self) -> float:
        """Total thermal resistance of wall assembly"""
        return sum(layer.r_value for layer in self.layers)

    @property
    def stud_spacing_inches(self) -> int:
        """Extract stud spacing from framing type"""
        framing_str = self.framing_type if isinstance(self.framing_type, str) else self.framing_type.value
        if "16oc" in framing_str:
            return 16
        elif "24oc" in framing_str:
            return 24
        return 16

    class Config:
        use_enum_values = True


class Room(BaseModel):
    """
    Room assembly containing walls, openings, and spatial properties.
    """
    room_type: RoomType = Field(..., description="IRC room classification")
    ceiling_height_feet: float = Field(..., gt=0, description="Ceiling height in feet", example=8.0)
    walls: List[Wall] = Field(..., min_items=1, description="Room walls")

    @property
    def total_floor_area_sqft(self) -> float:
        """Approximate floor area from wall dimensions"""
        if len(self.walls) >= 2:
            return self.walls[0].length_feet * self.walls[1].length_feet
        return 0.0

    def get_all_windows(self) -> List[Window]:
        """Collect all windows from all walls"""
        windows = []
        for wall in self.walls:
            windows.extend(wall.windows)
        return windows

    class Config:
        use_enum_values = True


class Project(BaseModel):
    """
    Project context that drives code compliance decisions.
    """
    name: str = Field(..., description="Project name", example="Maine Residence")
    location_zip: str = Field(..., description="ZIP code", example="04101")
    climate_zone: ClimateZone = Field(..., description="IECC Climate Zone")
    rooms: List[Room] = Field(..., min_items=1, description="Project rooms")

    class Config:
        use_enum_values = True


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class ComplianceResult(BaseModel):
    """Individual code compliance check result"""
    code: str = Field(..., description="Code reference (e.g., IRC R310.1)", example="IRC R310.1")
    severity: str = Field(..., description="ERROR or WARNING", example="ERROR")
    message: str = Field(..., description="Violation description")
    component: Optional[str] = Field(None, description="Affected component", example="Bedroom")


class BillOfMaterials(BaseModel):
    """Material quantities calculated from room geometry"""
    studs_count: int = Field(..., description="Number of studs required")
    stud_linear_feet: float = Field(..., description="Total linear feet of studs")
    top_plate_lf: float = Field(..., description="Top plate linear feet")
    bottom_plate_lf: float = Field(..., description="Bottom plate linear feet")
    sheathing_sqft: float = Field(..., description="Sheathing area in sq ft")
    drywall_sqft: float = Field(..., description="Drywall area in sq ft")
    insulation_sqft: float = Field(..., description="Insulation area in sq ft")
    gravel_cubic_yards: float = Field(..., description="Foundation gravel volume")


class CalculationResponse(BaseModel):
    """Complete API response with compliance and BOM"""
    compliance: List[ComplianceResult] = Field(..., description="Code compliance check results")
    bom: BillOfMaterials = Field(..., description="Bill of Materials")
    summary: Dict[str, Any] = Field(..., description="High-level project summary")


# ============================================================================
# BUSINESS LOGIC - Material Calculator
# ============================================================================

class MaterialCalculator:
    """
    Calculates Bill of Materials (BOM) from building components.
    Applies construction industry estimating rules.
    """

    @staticmethod
    def calculate_wall_materials(wall: Wall) -> Dict[str, float]:
        """
        Calculate materials for a single wall assembly.

        Construction Math Rules:
        - Studs: (Length / Spacing) + 1, plus plates
        - Top Plates: Double (2x length for overlapping joints)
        - Bottom Plate: Single (1x length)
        - Insulation: Net wall area (minus windows)
        - Sheathing/Drywall: Gross wall area
        - Gravel: Foundation trench (exterior walls only)
        """
        materials = {}

        # === FRAMING LUMBER ===
        num_studs_vertical = int((wall.length_feet * 12) / wall.stud_spacing_inches) + 1
        num_studs_plates = 3
        total_studs = num_studs_vertical + num_studs_plates

        materials["studs_count"] = total_studs
        materials["stud_linear_feet"] = total_studs * wall.height_feet
        materials["top_plate_lf"] = wall.length_feet * 2
        materials["bottom_plate_lf"] = wall.length_feet

        # === SHEATHING & FINISHES ===
        materials["sheathing_sqft"] = wall.area_sqft
        materials["drywall_sqft"] = wall.area_sqft

        # === INSULATION ===
        materials["insulation_sqft"] = wall.net_area_sqft

        # === FOUNDATION GRAVEL ===
        if wall.is_exterior:
            trench_volume_cuft = wall.length_feet * 2.0 * 0.5
            materials["gravel_cubic_yards"] = trench_volume_cuft / 27.0
        else:
            materials["gravel_cubic_yards"] = 0.0

        return materials

    @staticmethod
    def calculate_room_materials(room: Room) -> Dict[str, float]:
        """Aggregate materials for an entire room"""
        totals = {
            "studs_count": 0,
            "stud_linear_feet": 0,
            "top_plate_lf": 0,
            "bottom_plate_lf": 0,
            "sheathing_sqft": 0,
            "drywall_sqft": 0,
            "insulation_sqft": 0,
            "gravel_cubic_yards": 0
        }

        for wall in room.walls:
            wall_materials = MaterialCalculator.calculate_wall_materials(wall)
            for key in totals:
                totals[key] += wall_materials.get(key, 0)

        return totals

    @staticmethod
    def calculate_project_materials(project: Project) -> Dict[str, float]:
        """Aggregate materials for entire project"""
        totals = {
            "studs_count": 0,
            "stud_linear_feet": 0,
            "top_plate_lf": 0,
            "bottom_plate_lf": 0,
            "sheathing_sqft": 0,
            "drywall_sqft": 0,
            "insulation_sqft": 0,
            "gravel_cubic_yards": 0
        }

        for room in project.rooms:
            room_materials = MaterialCalculator.calculate_room_materials(room)
            for key in totals:
                totals[key] += room_materials.get(key, 0)

        return totals


# ============================================================================
# BUSINESS LOGIC - Code Validator
# ============================================================================

class CodeValidator:
    """
    Validates building components against IRC and IECC requirements.
    """

    # IECC R-Value Requirements by Climate Zone
    IECC_RVALUE_REQUIREMENTS = {
        ClimateZone.ZONE_1: 13,
        ClimateZone.ZONE_2: 13,
        ClimateZone.ZONE_3: 13,
        ClimateZone.ZONE_4: 15,
        ClimateZone.ZONE_5: 20,
        ClimateZone.ZONE_6: 20,
        ClimateZone.ZONE_7: 21,
        ClimateZone.ZONE_8: 21
    }

    @staticmethod
    def validate_project(project: Project) -> List[ComplianceResult]:
        """Run all code compliance checks for entire project"""
        all_errors = []

        for room_idx, room in enumerate(project.rooms):
            room_errors = CodeValidator.validate_room(room, project)

            # Add room context to errors
            for error in room_errors:
                room_type_str = room.room_type if isinstance(room.room_type, str) else room.room_type.value
                if error.component:
                    error.component = f"Room {room_idx + 1} ({room_type_str}) - {error.component}"
                else:
                    error.component = f"Room {room_idx + 1} ({room_type_str})"

            all_errors.extend(room_errors)

        return all_errors

    @staticmethod
    def validate_room(room: Room, project: Project) -> List[ComplianceResult]:
        """Run all code compliance checks for a room"""
        errors = []

        # Check 1: Minimum Ceiling Height
        errors.extend(CodeValidator._check_ceiling_height(room))

        # Check 2: Bedroom Egress Requirements
        if room.room_type == RoomType.BEDROOM:
            errors.extend(CodeValidator._check_bedroom_egress(room))

        # Check 3: Thermal Envelope
        errors.extend(CodeValidator._check_thermal_envelope(room, project))

        return errors

    @staticmethod
    def _check_ceiling_height(room: Room) -> List[ComplianceResult]:
        """IRC R305.1: Habitable rooms require minimum 7ft ceiling height"""
        errors = []
        MIN_HEIGHT = 7.0

        if room.ceiling_height_feet < MIN_HEIGHT:
            room_type_str = room.room_type if isinstance(room.room_type, str) else room.room_type.value
            errors.append(ComplianceResult(
                code="IRC R305.1",
                severity="ERROR",
                message=f"Ceiling height {room.ceiling_height_feet}ft is below minimum {MIN_HEIGHT}ft",
                component=f"{room_type_str}"
            ))

        return errors

    @staticmethod
    def _check_bedroom_egress(room: Room) -> List[ComplianceResult]:
        """IRC R310.1: Bedrooms require emergency escape/rescue opening"""
        errors = []
        MIN_CLEAR_OPENING = 5.7  # sq ft

        windows = room.get_all_windows()

        if not windows:
            room_type_str = room.room_type if isinstance(room.room_type, str) else room.room_type.value
            errors.append(ComplianceResult(
                code="IRC R310.1",
                severity="ERROR",
                message="Bedroom requires at least one egress window",
                component=f"{room_type_str}"
            ))
            return errors

        has_compliant_egress = False
        for window in windows:
            if window.clear_opening_sqft >= MIN_CLEAR_OPENING:
                has_compliant_egress = True
                break

        if not has_compliant_egress:
            max_opening = max(w.clear_opening_sqft for w in windows)
            room_type_str = room.room_type if isinstance(room.room_type, str) else room.room_type.value
            errors.append(ComplianceResult(
                code="IRC R310.1",
                severity="ERROR",
                message=f"No window meets egress requirement. "
                        f"Required: {MIN_CLEAR_OPENING} sq ft, "
                        f"Largest found: {max_opening:.2f} sq ft",
                component=f"{room_type_str}"
            ))

        return errors

    @staticmethod
    def _check_thermal_envelope(room: Room, project: Project) -> List[ComplianceResult]:
        """IECC R402.1: Exterior walls must meet minimum R-value"""
        errors = []
        required_rvalue = CodeValidator.IECC_RVALUE_REQUIREMENTS.get(
            project.climate_zone, 20
        )

        for i, wall in enumerate(room.walls):
            if wall.is_exterior:
                if wall.total_r_value < required_rvalue:
                    climate_zone_str = project.climate_zone if isinstance(project.climate_zone, int) else project.climate_zone.value
                    framing_type_str = wall.framing_type if isinstance(wall.framing_type, str) else wall.framing_type.value
                    errors.append(ComplianceResult(
                        code="IECC R402.1",
                        severity="ERROR",
                        message=f"Exterior wall R-value {wall.total_r_value:.1f} "
                                f"below required {required_rvalue} for Climate Zone {climate_zone_str}",
                        component=f"Wall #{i+1} ({framing_type_str})"
                    ))

        return errors


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Parametric Building Configurator API",
    description="REST API for construction code validation and material calculation",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc"  # ReDoc at /redoc
)

# ============================================================================
# CORS MIDDLEWARE - Enable Cross-Origin Requests
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (React dev server, etc.)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Parametric Building Configurator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/calculate", response_model=CalculationResponse)
def calculate_project(project: Project):
    """
    Main calculation endpoint.

    Accepts a Project payload with rooms/walls/windows.
    Returns code compliance results and bill of materials.

    Args:
        project: Project model with room definitions

    Returns:
        CalculationResponse with compliance checks and BOM

    Raises:
        HTTPException: If validation or calculation fails
    """
    try:
        # Run code compliance validation
        compliance_results = CodeValidator.validate_project(project)

        # Calculate bill of materials
        bom_dict = MaterialCalculator.calculate_project_materials(project)

        # Convert to Pydantic model
        bom = BillOfMaterials(
            studs_count=int(bom_dict["studs_count"]),
            stud_linear_feet=round(bom_dict["stud_linear_feet"], 2),
            top_plate_lf=round(bom_dict["top_plate_lf"], 2),
            bottom_plate_lf=round(bom_dict["bottom_plate_lf"], 2),
            sheathing_sqft=round(bom_dict["sheathing_sqft"], 2),
            drywall_sqft=round(bom_dict["drywall_sqft"], 2),
            insulation_sqft=round(bom_dict["insulation_sqft"], 2),
            gravel_cubic_yards=round(bom_dict["gravel_cubic_yards"], 2)
        )

        # Generate summary statistics
        total_windows = 0
        for room in project.rooms:
            for wall in room.walls:
                total_windows += len(wall.windows)

        summary = {
            "project_name": project.name,
            "location": project.location_zip,
            "climate_zone": project.climate_zone if isinstance(project.climate_zone, int) else project.climate_zone.value,
            "total_rooms": len(project.rooms),
            "total_walls": sum(len(room.walls) for room in project.rooms),
            "total_windows": total_windows,
            "compliance_status": "PASS" if len(compliance_results) == 0 else "FAIL",
            "violation_count": len(compliance_results)
        }

        return CalculationResponse(
            compliance=compliance_results,
            bom=bom,
            summary=summary
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@app.post("/validate", response_model=List[ComplianceResult])
def validate_only(project: Project):
    """
    Code validation endpoint (no BOM calculation).

    Useful for quick compliance checks without material calculations.

    Args:
        project: Project model with room definitions

    Returns:
        List of compliance violations (empty if all checks pass)
    """
    try:
        compliance_results = CodeValidator.validate_project(project)
        return compliance_results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


@app.post("/bom", response_model=BillOfMaterials)
def calculate_bom_only(project: Project):
    """
    Bill of Materials endpoint (no validation).

    Calculates material quantities without running code checks.

    Args:
        project: Project model with room definitions

    Returns:
        BillOfMaterials with all material quantities
    """
    try:
        bom_dict = MaterialCalculator.calculate_project_materials(project)

        bom = BillOfMaterials(
            studs_count=int(bom_dict["studs_count"]),
            stud_linear_feet=round(bom_dict["stud_linear_feet"], 2),
            top_plate_lf=round(bom_dict["top_plate_lf"], 2),
            bottom_plate_lf=round(bom_dict["bottom_plate_lf"], 2),
            sheathing_sqft=round(bom_dict["sheathing_sqft"], 2),
            drywall_sqft=round(bom_dict["drywall_sqft"], 2),
            insulation_sqft=round(bom_dict["insulation_sqft"], 2),
            gravel_cubic_yards=round(bom_dict["gravel_cubic_yards"], 2)
        )

        return bom

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BOM calculation error: {str(e)}")


# ============================================================================
# SERVER RUNNER
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("Starting Parametric Building Configurator API")
    print("=" * 80)
    print()
    print("Server running at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("ReDoc: http://localhost:8000/redoc")
    print()
    print("CORS enabled for all origins (React dev server compatible)")
    print()
    print("Press CTRL+C to stop the server")
    print("=" * 80)
    print()

    uvicorn.run(
        app,
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,
        log_level="info"
    )
