"""
etdrs.py - Automated ETDRS 9-Zone Macular Grid & CSME Risk Profiler
==================================================================
Implements the clinical gold-standard Early Treatment Diabetic Retinopathy
Study (ETDRS) 9-zone macular grid and Clinically Significant Macular Edema
(CSME) diagnostic risk stratification.

Standard ETDRS Dimensions (centered on Fovea):
- Central Foveal Subfield (CSF): Diameter = 1.0 mm (Radius = 500 µm)
- Inner Macular Ring: Diameter = 3.0 mm (Radius = 1500 µm)
  Subdivided into: Inner Superior (IS), Inner Nasal (IN), Inner Inferior (II), Inner Temporal (IT)
- Outer Macular Ring: Diameter = 6.0 mm (Radius = 3000 µm)
  Subdivided into: Outer Superior (OS), Outer Nasal (ON), Outer Inferior (OI), Outer Temporal (OT)

FOV Scaling:
- Standard 45° posterior pole fundus image ≈ 15,000 µm across diameter.
- 1% normalized coordinate ≈ 150 µm.
"""

import math
from typing import List, Dict, Any, Tuple


MICRONS_PER_PERCENT = 150.0  # 1% of 45° FOV ≈ 150 µm

# ETDRS Radial Thresholds in Microns
RADIUS_CSF_UM = 500.0    # 0.5 mm radius (1.0 mm diameter)
RADIUS_INNER_UM = 1500.0  # 1.5 mm radius (3.0 mm diameter)
RADIUS_OUTER_UM = 3000.0  # 3.0 mm radius (6.0 mm diameter)


def classify_etdrs_sector(
    dx_pct: float,
    dy_pct: float,
    eye: str = "od"
) -> Tuple[str, str, float]:
    """
    Classifies a lesion relative to the foveal center into one of the 9 ETDRS sectors.

    Args:
        dx_pct: x_lesion - x_fovea (normalized percentage)
        dy_pct: y_lesion - y_fovea (normalized percentage, positive downward)
        eye: 'od' (Right Eye) or 'os' (Left Eye)

    Returns:
        (sector_code, sector_name, distance_microns)
    """
    dist_pct = math.sqrt(dx_pct ** 2 + dy_pct ** 2)
    dist_um = dist_pct * MICRONS_PER_PERCENT

    # Angle in degrees (-180 to 180), 0 = rightward, 90 = downward (inverted image coordinates)
    # Convert to standard mathematical angle: 0 = right, 90 = top (Superior), 180 = left, 270 = bottom (Inferior)
    # In screen coordinates, y increases downwards, so math_y = -dy
    math_angle = math.degrees(math.atan2(-dy_pct, dx_pct))
    if math_angle < 0:
        math_angle += 360.0

    # Sector boundaries:
    # Top sector (Superior): 45° to 135°
    # Left sector: 135° to 225°
    # Bottom sector (Inferior): 225° to 315°
    # Right sector: 315° to 45°
    if 45.0 <= math_angle < 135.0:
        vert = "Superior"
        vert_code = "S"
    elif 225.0 <= math_angle < 315.0:
        vert = "Inferior"
        vert_code = "I"
    elif 135.0 <= math_angle < 225.0:
        # Left side of image:
        # For OD (Right Eye), left side is Temporal! Right side is Nasal.
        # For OS (Left Eye), left side is Nasal! Right side is Temporal.
        if eye.lower() == "od":
            vert = "Temporal"
            vert_code = "T"
        else:
            vert = "Nasal"
            vert_code = "N"
    else:
        # Right side of image
        if eye.lower() == "od":
            vert = "Nasal"
            vert_code = "N"
        else:
            vert = "Temporal"
            vert_code = "T"

    # Radial ring classification
    if dist_um <= RADIUS_CSF_UM:
        return "CSF", "Central Foveal Subfield (1mm)", dist_um
    elif dist_um <= RADIUS_INNER_UM:
        code = f"I{vert_code}"
        name = f"Inner {vert} (3mm)"
        return code, name, dist_um
    elif dist_um <= RADIUS_OUTER_UM:
        code = f"O{vert_code}"
        name = f"Outer {vert} (6mm)"
        return code, name, dist_um
    else:
        return "Peripheral", "Peripheral Retina (>6mm)", dist_um


def compute_etdrs_profile(
    lesions: List[Dict[str, Any]],
    fovea_x: float = 50.0,
    fovea_y: float = 50.0,
    eye: str = "od"
) -> Dict[str, Any]:
    """
    Evaluates complete ETDRS 9-Zone distribution and CSME risk profile
    for a given list of retinal lesions.

    Returns:
        Structured ETDRS clinical profile matching ophthalmology gold standards.
    """
    sector_counts = {
        "CSF": {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "IS":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "IN":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "II":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "IT":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "OS":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "ON":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "OI":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "OT":  {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
        "Peripheral": {"microaneurysm": 0, "hemorrhage": 0, "exudate": 0, "total": 0, "area_px": 0},
    }

    closest_exudate_dist = float("inf")
    closest_ma_dist = float("inf")
    closest_hem_dist = float("inf")

    exudates_in_csf = 0
    exudates_in_inner = 0
    exudates_in_outer = 0

    enriched_lesions = []

    for l in lesions:
        # Resolve x, y percentages
        x = float(l.get("x", 50.0))
        y = float(l.get("y", 50.0))
        if "bbox" in l and l["bbox"] and len(l["bbox"]) == 4:
            x1, y1, x2, y2 = l["bbox"]
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            if max(x1, x2, y1, y2) <= 1.0:
                x = cx * 100.0
                y = cy * 100.0
            else:
                x = (cx / 512.0) * 100.0
                y = (cy / 512.0) * 100.0

        dx = x - fovea_x
        dy = y - fovea_y
        sec_code, sec_name, dist_um = classify_etdrs_sector(dx, dy, eye=eye)

        l_type = l.get("type", "microaneurysm").lower()
        if "exudate" in l_type:
            norm_type = "exudate"
            if dist_um < closest_exudate_dist:
                closest_exudate_dist = dist_um
            if dist_um <= RADIUS_CSF_UM:
                exudates_in_csf += 1
            elif dist_um <= RADIUS_INNER_UM:
                exudates_in_inner += 1
            elif dist_um <= RADIUS_OUTER_UM:
                exudates_in_outer += 1
        elif "hemorrhage" in l_type or "haem" in l_type:
            norm_type = "hemorrhage"
            if dist_um < closest_hem_dist:
                closest_hem_dist = dist_um
        else:
            norm_type = "microaneurysm"
            if dist_um < closest_ma_dist:
                closest_ma_dist = dist_um

        area = int(l.get("area_px") or l.get("area") or 50)

        if sec_code in sector_counts:
            sector_counts[sec_code][norm_type] += 1
            sector_counts[sec_code]["total"] += 1
            sector_counts[sec_code]["area_px"] += area

        enriched_lesion = dict(l)
        enriched_lesion.update({
            "x": round(x, 1),
            "y": round(y, 1),
            "etdrs_sector": sec_code,
            "etdrs_sector_name": sec_name,
            "foveal_distance_um": round(dist_um, 1),
            "csme_threat": dist_um <= RADIUS_INNER_UM and norm_type == "exudate",
        })
        enriched_lesions.append(enriched_lesion)

    # ── CSME (Clinically Significant Macular Edema) Risk Stratification ──────
    # ETDRS Rule 1: Exudates within 500 µm of macular center (CSF)
    # ETDRS Rule 2: Exudates within 500-1500 µm (Inner Ring)
    # ETDRS Rule 3: Peripheral exudates
    if exudates_in_csf > 0:
        csme_risk = "HIGH"
        csme_label = "Center-Involved CSME (Severe Vision Threat)"
        csme_badge_color = "#dc2626"
        csme_badge_bg = "#fee2e2"
        triage_urgency = "Urgent Retina Specialist Evaluation within 7–14 Days"
        clinical_protocol = (
            f"ETDRS Criterion 1 Met: {exudates_in_csf} hard exudate(s) detected within "
            f"500 µm of the foveal center (closest: {round(closest_exudate_dist)} µm). "
            f"High risk of central foveal involvement and irreversible visual acuity loss. "
            f"Immediate Optical Coherence Tomography (OCT) & Anti-VEGF / Focal Laser evaluation required."
        )
    elif exudates_in_inner > 0:
        csme_risk = "MODERATE"
        csme_label = "Non-Center Involved CSME (Impending Macular Threat)"
        csme_badge_color = "#ea580c"
        csme_badge_bg = "#ffedd5"
        triage_urgency = "Retina Specialist Referral within 1 Month"
        clinical_protocol = (
            f"ETDRS Criterion 2 Met: {exudates_in_inner} hard exudate(s) present in the inner "
            f"macular ring (500–1500 µm from fovea, closest: {round(closest_exudate_dist)} µm). "
            f"High probability of progressive subretinal lipid migration. Macular OCT recommended."
        )
    elif exudates_in_outer > 0:
        csme_risk = "BORDERLINE"
        csme_label = "Macular Threat Borderline (Outer 3–6mm Ring)"
        csme_badge_color = "#ca8a04"
        csme_badge_bg = "#fef9c3"
        triage_urgency = "Routine Diabetic Macular Review (3–6 Months)"
        clinical_protocol = (
            f"Hard exudates detected in outer macular zone (1500–3000 µm from fovea). "
            f"Foveal center currently spared. Intensify glycemic and lipid management."
        )
    else:
        csme_risk = "LOW"
        csme_label = "No Apparent Macular Edema"
        csme_badge_color = "#16a34a"
        csme_badge_bg = "#dcfce7"
        triage_urgency = "Annual Retinal Screening"
        clinical_protocol = (
            "No hard exudates or microvascular leakage detected within the 6mm ETDRS macular zone. "
            "Macular architecture clear."
        )

    return {
        "fovea_anchor": {
            "x": fovea_x,
            "y": fovea_y,
            "unit": "percent",
        },
        "eye": eye.upper(),
        "csme_risk": csme_risk,
        "csme_label": csme_label,
        "csme_badge_color": csme_badge_color,
        "csme_badge_bg": csme_badge_bg,
        "triage_urgency": triage_urgency,
        "clinical_protocol": clinical_protocol,
        "closest_exudate_dist_um": round(closest_exudate_dist, 1) if closest_exudate_dist != float("inf") else None,
        "closest_ma_dist_um": round(closest_ma_dist, 1) if closest_ma_dist != float("inf") else None,
        "closest_hem_dist_um": round(closest_hem_dist, 1) if closest_hem_dist != float("inf") else None,
        "exudates_in_csf": exudates_in_csf,
        "exudates_in_inner": exudates_in_inner,
        "exudates_in_outer": exudates_in_outer,
        "sector_distribution": sector_counts,
        "enriched_lesions": enriched_lesions,
    }
