import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

router = APIRouter(prefix="/api/world-music", tags=["World Music"])

WORLD_MUSIC_PATH = Path(__file__).parent.parent / "data" / "world_music.json"


def load_world_music():
    if not WORLD_MUSIC_PATH.exists():
        raise HTTPException(status_code=404, detail="World music data not found")
    with open(WORLD_MUSIC_PATH) as f:
        return json.load(f)


@router.get("")
def get_world_music_overview():
    data = load_world_music()
    return {
        "regions": data.get("regions", []),
        "traditions_count": len(data.get("traditions", [])),
        "instruments_count": len(data.get("instruments", [])),
        "scales_count": len(data.get("scales_modes", [])),
        "rhythms_count": len(data.get("rhythms", [])),
    }


@router.get("/traditions")
def get_traditions(
    region: Optional[str] = Query(None, description="Filter by region id"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    search: Optional[str] = Query(None, description="Search by name or description"),
):
    data = load_world_music()
    traditions = data.get("traditions", [])

    if region:
        traditions = [t for t in traditions if t.get("region") == region]
    if difficulty:
        traditions = [t for t in traditions if t.get("difficulty") == difficulty]
    if search:
        q = search.lower()
        traditions = [
            t for t in traditions
            if q in (t.get("name", "").lower())
            or q in (t.get("description", "").lower())
            or q in (t.get("country_or_area", "").lower())
            or any(q in inst.lower() for inst in t.get("instruments", []))
            or any(q in term["term"].lower() for term in t.get("terminology", []))
        ]

    return {"traditions": traditions, "total": len(traditions)}


@router.get("/traditions/{tradition_id}")
def get_tradition(tradition_id: str):
    data = load_world_music()
    for t in data.get("traditions", []):
        if t["id"] == tradition_id:
            instruments = data.get("instruments", [])
            scales = data.get("scales_modes", [])
            rhythms = data.get("rhythms", [])

            tradition_instruments = [
                inst for inst in instruments if inst.get("tradition") == tradition_id
            ]
            tradition_scales = [
                s for s in scales if s.get("tradition") == tradition_id
            ]
            tradition_rhythms = [
                r for r in rhythms if r.get("tradition") == tradition_id
            ]

            related = []
            for rel_id in t.get("related_traditions", []):
                for ot in data.get("traditions", []):
                    if ot["id"] == rel_id:
                        related.append({"id": ot["id"], "name": ot["name"], "region": ot["region"]})
                        break

            return {
                **t,
                "instruments_detail": tradition_instruments,
                "scales_detail": tradition_scales,
                "rhythms_detail": tradition_rhythms,
                "related_traditions_detail": related,
            }
    raise HTTPException(status_code=404, detail=f"Tradition '{tradition_id}' not found")


@router.get("/regions")
def get_regions():
    data = load_world_music()
    return {"regions": data.get("regions", [])}


@router.get("/instruments")
def get_instruments(
    tradition: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    family: Optional[str] = Query(None),
):
    data = load_world_music()
    instruments = data.get("instruments", [])

    if tradition:
        instruments = [i for i in instruments if i.get("tradition") == tradition]
    if region:
        instruments = [i for i in instruments if i.get("region") == region]
    if family:
        instruments = [i for i in instruments if i.get("family") == family]

    return {"instruments": instruments, "total": len(instruments)}


@router.get("/scales")
def get_scales(
    tradition: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    data = load_world_music()
    scales = data.get("scales_modes", [])

    if tradition:
        scales = [s for s in scales if s.get("tradition") == tradition]
    if search:
        q = search.lower()
        scales = [
            s for s in scales
            if q in s.get("name", "").lower()
            or q in s.get("description", "").lower()
            or q in s.get("equivalent", "").lower()
        ]

    return {"scales": scales, "total": len(scales)}


@router.get("/rhythms")
def get_rhythms(
    tradition: Optional[str] = Query(None),
):
    data = load_world_music()
    rhythms = data.get("rhythms", [])

    if tradition:
        rhythms = [r for r in rhythms if r.get("tradition") == tradition]

    return {"rhythms": rhythms, "total": len(rhythms)}


@router.get("/learning-paths")
def get_learning_paths():
    data = load_world_music()
    return {"learning_paths": data.get("learning_paths", [])}


@router.get("/learning-paths/{path_id}")
def get_learning_path(path_id: str):
    data = load_world_music()
    for lp in data.get("learning_paths", []):
        if lp["id"] == path_id:
            return lp
    raise HTTPException(status_code=404, detail=f"Learning path '{path_id}' not found")


@router.get("/compare")
def compare_traditions(
    ids: str = Query(..., description="Comma-separated tradition ids to compare"),
):
    data = load_world_music()
    id_list = [i.strip() for i in ids.split(",") if i.strip()]

    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 tradition ids to compare")
    if len(id_list) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 traditions for comparison")

    traditions = []
    for tid in id_list:
        for t in data.get("traditions", []):
            if t["id"] == tid:
                traditions.append(t)
                break

    if len(traditions) < 2:
        raise HTTPException(status_code=404, detail="Could not find enough traditions for comparison")

    return {
        "traditions": traditions,
        "dimensions": {
            "region": [t.get("region", "N/A") for t in traditions],
            "instruments": [t.get("instruments", []) for t in traditions],
            "scales_or_modes": [t.get("scales_or_modes", []) for t in traditions],
            "rhythmic_concepts": [t.get("rhythmic_concepts", []) for t in traditions],
            "vocal_concepts": [t.get("vocal_concepts", []) for t in traditions],
            "difficulty": [t.get("difficulty", "N/A") for t in traditions],
            "characteristics": [t.get("characteristics", []) for t in traditions],
        },
    }
