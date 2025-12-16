"""
Parametric Building Configurator - Smart Component Architecture
A construction logic engine that treats building elements as intelligent data objects
with embedded code compliance and material calculation capabilities.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum


# ============================================================================
# ENUMERATIONS - Domain-Specific Types
# ============================================================================

class FramingType(Enum):
    """Standard wood framing configurations"""
    STUD_2x4_16OC = "2x4 @ 16oc"
    STUD_2x4_24OC = "2x4 @ 24oc"
    STUD_2x6_16OC = "2x6 @ 16oc"
    STUD_2x6_24OC = "2x6 @ 24oc"


class RoomType(Enum):
    """IRC Room Classifications"""
    BEDROOM = "Bedroom"
    KITCHEN = "Kitchen"
    BATHROOM = "Bathroom"
    LIVING = "Living Room"
    UTILITY = "Utility"


class ClimateZone(Enum):
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
# DATA STRUCTURES - The Kit of Parts
# ============================================================================

@dataclass
class MaterialLayer:
    """
    Represents a single layer in a wall assembly.
    Each layer contributes to thermal performance and thickness.
    """
    name: str
    thickness_inches: float  # Nominal thickness
    r_value: float  # Thermal resistance (ft²·°F·h/BTU)

    def __repr__(self) -> str:
        return f"{self.name} ({self.thickness_inches}\" @ R-{self.r_value})"


@dataclass
class Window:
    """
    Window component with egress and thermal properties.
    """
    width_inches: float
    height_inches: float
    u_factor: float  # Thermal transmittance (BTU/h·ft²·°F)
    window_type: str = "Double-Hung"

    @property
    def area_sqft(self) -> float:
        """Total window area in square feet"""
        return (self.width_inches * self.height_inches) / 144.0

    @property
    def clear_opening_sqft(self) -> float:
        """
        IRC requires "clear opening" for egress calculations.
        Assumes 90% of total area is operable (conservative estimate).
        """
        return self.area_sqft * 0.9

    def __repr__(self) -> str:
        return f"Window {self.width_inches}\"x{self.height_inches}\" (U={self.u_factor})"


@dataclass
class Wall:
    """
    Intelligent wall component with framing, layers, and openings.
    Knows how to calculate its own material requirements.
    """
    length_feet: float
    height_feet: float
    framing_type: FramingType
    is_exterior: bool
    layers: List[MaterialLayer] = field(default_factory=list)
    windows: List[Window] = field(default_factory=list)

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
        """
        Total thermal resistance of wall assembly.
        Sum of all layer R-values (series resistance).
        """
        return sum(layer.r_value for layer in self.layers)

    @property
    def stud_spacing_inches(self) -> int:
        """Extract stud spacing from framing type"""
        if "16oc" in self.framing_type.value:
            return 16
        elif "24oc" in self.framing_type.value:
            return 24
        return 16  # Default

    def __repr__(self) -> str:
        location = "EXT" if self.is_exterior else "INT"
        return f"Wall [{location}] {self.length_feet}'x{self.height_feet}' ({self.framing_type.value})"


@dataclass
class Room:
    """
    Room assembly containing walls, openings, and spatial properties.
    """
    room_type: RoomType
    ceiling_height_feet: float
    walls: List[Wall] = field(default_factory=list)

    @property
    def total_floor_area_sqft(self) -> float:
        """
        Approximate floor area from wall dimensions.
        Assumes rectangular room for simplicity.
        """
        if len(self.walls) >= 2:
            return self.walls[0].length_feet * self.walls[1].length_feet
        return 0.0

    def get_all_windows(self) -> List[Window]:
        """Collect all windows from all walls"""
        windows = []
        for wall in self.walls:
            windows.extend(wall.windows)
        return windows


@dataclass
class Project:
    """
    Project context that drives code compliance decisions.
    """
    name: str
    location_zip: str
    climate_zone: ClimateZone
    rooms: List[Room] = field(default_factory=list)


# ============================================================================
# MATERIAL CALCULATOR - The Construction Math Engine
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
        # Calculate vertical studs based on on-center spacing
        num_studs_vertical = int((wall.length_feet * 12) / wall.stud_spacing_inches) + 1

        # Add plates: 2 top plates + 1 bottom plate
        num_studs_plates = 3

        # Total studs (all at wall height)
        total_studs = num_studs_vertical + num_studs_plates
        materials["studs_count"] = total_studs
        materials["stud_linear_feet"] = total_studs * wall.height_feet

        # Plate lumber (runs horizontal at wall length)
        materials["top_plate_lf"] = wall.length_feet * 2  # Double top plate
        materials["bottom_plate_lf"] = wall.length_feet

        # === SHEATHING & FINISHES ===
        materials["sheathing_sqft"] = wall.area_sqft  # Exterior: OSB/Plywood
        materials["drywall_sqft"] = wall.area_sqft    # Interior finish

        # === INSULATION ===
        # Only insulate the cavity (net area minus windows)
        materials["insulation_sqft"] = wall.net_area_sqft

        # === FOUNDATION GRAVEL (Exterior walls only) ===
        if wall.is_exterior:
            # Assume continuous footer trench: 2ft wide x 6in (0.5ft) deep
            trench_volume_cuft = wall.length_feet * 2.0 * 0.5
            # Convert to cubic yards (divide by 27)
            materials["gravel_cubic_yards"] = trench_volume_cuft / 27.0
        else:
            materials["gravel_cubic_yards"] = 0.0

        return materials

    @staticmethod
    def calculate_room_materials(room: Room) -> Dict[str, float]:
        """
        Aggregate materials for an entire room.
        Returns totals across all walls.
        """
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


# ============================================================================
# CODE VALIDATOR - Building Code Compliance Engine
# ============================================================================

@dataclass
class ValidationError:
    """Represents a code violation or warning"""
    code: str  # IRC 310.1, IECC R402.1, etc.
    severity: str  # "ERROR" or "WARNING"
    message: str
    component: Optional[str] = None


class CodeValidator:
    """
    Validates building components against IRC and IECC requirements.
    """

    # IECC R-Value Requirements by Climate Zone (simplified)
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
    def validate_room(room: Room, project: Project) -> List[ValidationError]:
        """
        Run all code compliance checks for a room.
        Returns list of violations (empty list = compliant).
        """
        errors = []

        # === CHECK 1: Minimum Ceiling Height (IRC R305.1) ===
        errors.extend(CodeValidator._check_ceiling_height(room))

        # === CHECK 2: Bedroom Egress Requirements (IRC R310.1) ===
        if room.room_type == RoomType.BEDROOM:
            errors.extend(CodeValidator._check_bedroom_egress(room))

        # === CHECK 3: Thermal Envelope (IECC R402.1) ===
        errors.extend(CodeValidator._check_thermal_envelope(room, project))

        return errors

    @staticmethod
    def _check_ceiling_height(room: Room) -> List[ValidationError]:
        """IRC R305.1: Habitable rooms require minimum 7ft ceiling height"""
        errors = []
        MIN_HEIGHT = 7.0

        if room.ceiling_height_feet < MIN_HEIGHT:
            errors.append(ValidationError(
                code="IRC R305.1",
                severity="ERROR",
                message=f"Ceiling height {room.ceiling_height_feet}ft is below minimum {MIN_HEIGHT}ft",
                component=f"{room.room_type.value}"
            ))

        return errors

    @staticmethod
    def _check_bedroom_egress(room: Room) -> List[ValidationError]:
        """
        IRC R310.1: Bedrooms require emergency escape/rescue opening.
        Minimum clear opening: 5.7 sq ft
        Minimum opening height: 24 inches
        Minimum opening width: 20 inches
        """
        errors = []
        MIN_CLEAR_OPENING = 5.7  # sq ft

        windows = room.get_all_windows()

        if not windows:
            errors.append(ValidationError(
                code="IRC R310.1",
                severity="ERROR",
                message="Bedroom requires at least one egress window",
                component=f"{room.room_type.value}"
            ))
            return errors

        # Check if ANY window meets egress requirements
        has_compliant_egress = False
        for window in windows:
            if window.clear_opening_sqft >= MIN_CLEAR_OPENING:
                has_compliant_egress = True
                break

        if not has_compliant_egress:
            max_opening = max(w.clear_opening_sqft for w in windows)
            errors.append(ValidationError(
                code="IRC R310.1",
                severity="ERROR",
                message=f"No window meets egress requirement. "
                        f"Required: {MIN_CLEAR_OPENING} sq ft, "
                        f"Largest found: {max_opening:.2f} sq ft",
                component=f"{room.room_type.value}"
            ))

        return errors

    @staticmethod
    def _check_thermal_envelope(room: Room, project: Project) -> List[ValidationError]:
        """
        IECC R402.1: Exterior walls must meet minimum R-value for climate zone.
        """
        errors = []
        required_rvalue = CodeValidator.IECC_RVALUE_REQUIREMENTS.get(
            project.climate_zone, 20
        )

        for i, wall in enumerate(room.walls):
            if wall.is_exterior:
                if wall.total_r_value < required_rvalue:
                    errors.append(ValidationError(
                        code="IECC R402.1",
                        severity="ERROR",
                        message=f"Exterior wall R-value {wall.total_r_value:.1f} "
                                f"below required {required_rvalue} for Climate Zone {project.climate_zone.value}",
                        component=f"Wall #{i+1} ({wall.framing_type.value})"
                    ))

        return errors


# ============================================================================
# MAIN EXECUTION - Demonstration
# ============================================================================

def main():
    """
    Demonstrate the parametric building configurator with a real scenario:
    - Create a Bedroom in Climate Zone 6 (Maine)
    - Intentionally create code violations to test validator
    - Calculate materials and show BOM
    """

    print("=" * 80)
    print("PARAMETRIC BUILDING CONFIGURATOR - SMART COMPONENT DEMO")
    print("=" * 80)
    print()

    # ========================================================================
    # STEP 1: Define Material Assemblies (The "Kit of Parts")
    # ========================================================================

    print("📦 STEP 1: Defining Wall Assembly Layers")
    print("-" * 80)

    # Typical exterior wall assembly (2x6 framing)
    exterior_layers = [
        MaterialLayer("Vinyl Siding", 0.5, 0.6),
        MaterialLayer("OSB Sheathing", 0.5, 0.6),
        MaterialLayer("Fiberglass Batt R-19", 5.5, 19.0),  # Cavity insulation
        MaterialLayer("Drywall", 0.5, 0.45)
    ]

    # Calculate total assembly R-value
    total_r = sum(layer.r_value for layer in exterior_layers)
    print(f"Exterior Wall Assembly (Total R-{total_r}):")
    for layer in exterior_layers:
        print(f"  - {layer}")
    print()

    # ========================================================================
    # STEP 2: Create Building Components
    # ========================================================================

    print("🏗️  STEP 2: Creating Room Components")
    print("-" * 80)

    # Create a small, non-compliant window (for testing validator)
    small_window = Window(
        width_inches=24,
        height_inches=24,
        u_factor=0.30,
        window_type="Double-Hung"
    )
    print(f"Window: {small_window}")
    print(f"  Clear Opening: {small_window.clear_opening_sqft:.2f} sq ft")
    print()

    # Create 4 walls for a 12x10 bedroom
    north_wall = Wall(
        length_feet=12.0,
        height_feet=8.0,
        framing_type=FramingType.STUD_2x6_16OC,
        is_exterior=True,
        layers=exterior_layers.copy(),
        windows=[small_window]  # Egress window (too small!)
    )

    south_wall = Wall(
        length_feet=12.0,
        height_feet=8.0,
        framing_type=FramingType.STUD_2x6_16OC,
        is_exterior=True,
        layers=exterior_layers.copy()
    )

    east_wall = Wall(
        length_feet=10.0,
        height_feet=8.0,
        framing_type=FramingType.STUD_2x6_16OC,
        is_exterior=True,
        layers=exterior_layers.copy()
    )

    west_wall = Wall(
        length_feet=10.0,
        height_feet=8.0,
        framing_type=FramingType.STUD_2x6_16OC,
        is_exterior=False,  # Party wall
        layers=[]
    )

    print("Walls Created:")
    for i, wall in enumerate([north_wall, south_wall, east_wall, west_wall], 1):
        print(f"  {i}. {wall} | R-Value: {wall.total_r_value}")
    print()

    # Create the bedroom
    bedroom = Room(
        room_type=RoomType.BEDROOM,
        ceiling_height_feet=8.0,
        walls=[north_wall, south_wall, east_wall, west_wall]
    )

    # Create project context
    project = Project(
        name="Maine Residence",
        location_zip="04101",
        climate_zone=ClimateZone.ZONE_6,
        rooms=[bedroom]
    )

    print(f"Room: {bedroom.room_type.value}")
    print(f"  Floor Area: ~{bedroom.total_floor_area_sqft:.0f} sq ft")
    print(f"  Ceiling Height: {bedroom.ceiling_height_feet} ft")
    print(f"  Climate Zone: {project.climate_zone.value}")
    print()

    # ========================================================================
    # STEP 3: Run Code Validation
    # ========================================================================

    print("✅ STEP 3: Running Code Compliance Checks")
    print("-" * 80)

    validator = CodeValidator()
    violations = validator.validate_room(bedroom, project)

    if violations:
        print(f"❌ Found {len(violations)} code violation(s):\n")
        for i, error in enumerate(violations, 1):
            print(f"{i}. [{error.severity}] {error.code}")
            print(f"   Component: {error.component}")
            print(f"   Issue: {error.message}")
            print()
    else:
        print("✅ All code checks passed!")
        print()

    # ========================================================================
    # STEP 4: Fix the Egress Window and Re-validate
    # ========================================================================

    print("🔧 STEP 4: Fixing Egress Window")
    print("-" * 80)

    # Replace with compliant egress window
    compliant_window = Window(
        width_inches=36,
        height_inches=48,
        u_factor=0.28,
        window_type="Double-Hung"
    )

    north_wall.windows = [compliant_window]

    print(f"New Window: {compliant_window}")
    print(f"  Clear Opening: {compliant_window.clear_opening_sqft:.2f} sq ft (Required: 5.7)")
    print()

    # Re-run validation
    violations = validator.validate_room(bedroom, project)

    if violations:
        print(f"❌ Still have {len(violations)} violation(s)")
    else:
        print("✅ All code violations resolved!")
    print()

    # ========================================================================
    # STEP 5: Calculate Bill of Materials
    # ========================================================================

    print("📊 STEP 5: Calculating Bill of Materials (BOM)")
    print("-" * 80)

    calculator = MaterialCalculator()
    bom = calculator.calculate_room_materials(bedroom)

    print("LUMBER:")
    print(f"  • Studs (2x6): {int(bom['studs_count'])} pieces")
    print(f"  • Stud Linear Feet: {bom['stud_linear_feet']:.1f} LF")
    print(f"  • Top Plate: {bom['top_plate_lf']:.1f} LF")
    print(f"  • Bottom Plate: {bom['bottom_plate_lf']:.1f} LF")
    print()

    print("PANELS:")
    print(f"  • Sheathing (OSB): {bom['sheathing_sqft']:.1f} sq ft ({bom['sheathing_sqft']/32:.1f} sheets @ 4x8)")
    print(f"  • Drywall: {bom['drywall_sqft']:.1f} sq ft ({bom['drywall_sqft']/32:.1f} sheets @ 4x8)")
    print()

    print("INSULATION:")
    print(f"  • Fiberglass Batts: {bom['insulation_sqft']:.1f} sq ft")
    print()

    print("FOUNDATION:")
    print(f"  • Gravel (3/4\" crushed): {bom['gravel_cubic_yards']:.2f} cubic yards")
    print()

    # ========================================================================
    # STEP 6: Summary
    # ========================================================================

    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Room Type: {bedroom.room_type.value}")
    print(f"Dimensions: ~{bedroom.walls[0].length_feet}' x {bedroom.walls[1].length_feet}'")
    print(f"Wall Assembly R-Value: {north_wall.total_r_value}")
    print(f"Code Compliance: {'✅ PASS' if not violations else '❌ FAIL'}")
    print(f"Total Material Cost Drivers:")
    print(f"  - {int(bom['studs_count'])} studs")
    print(f"  - {bom['sheathing_sqft']/32:.0f} sheets sheathing")
    print(f"  - {bom['gravel_cubic_yards']:.1f} CY gravel")
    print()


if __name__ == "__main__":
    main()
