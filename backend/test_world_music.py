import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestWorldMusicOverview:
    def test_overview_returns_regions_and_counts(self):
        resp = client.get("/api/world-music")
        assert resp.status_code == 200
        data = resp.json()
        assert "regions" in data
        assert "traditions_count" in data
        assert "instruments_count" in data
        assert "scales_count" in data
        assert "rhythms_count" in data
        assert data["traditions_count"] > 0
        assert data["instruments_count"] > 0


class TestTraditions:
    def test_list_traditions(self):
        resp = client.get("/api/world-music/traditions")
        assert resp.status_code == 200
        data = resp.json()
        assert "traditions" in data
        assert data["total"] > 0

    def test_tradition_has_required_fields(self):
        resp = client.get("/api/world-music/traditions")
        traditions = resp.json()["traditions"]
        for t in traditions:
            assert "id" in t
            assert "name" in t
            assert "region" in t
            assert "description" in t
            assert "instruments" in t
            assert "difficulty" in t

    def test_filter_by_region(self):
        resp = client.get("/api/world-music/traditions?region=south_asia")
        assert resp.status_code == 200
        traditions = resp.json()["traditions"]
        assert len(traditions) == 2
        for t in traditions:
            assert t["region"] == "south_asia"

    def test_filter_by_difficulty(self):
        resp = client.get("/api/world-music/traditions?difficulty=beginner")
        assert resp.status_code == 200
        traditions = resp.json()["traditions"]
        assert len(traditions) > 0
        for t in traditions:
            assert t["difficulty"] == "beginner"

    def test_search_by_name(self):
        resp = client.get("/api/world-music/traditions?search=jazz")
        assert resp.status_code == 200
        traditions = resp.json()["traditions"]
        assert len(traditions) >= 1
        assert any("jazz" in t["name"].lower() for t in traditions)

    def test_search_by_instrument(self):
        resp = client.get("/api/world-music/traditions?search=sitar")
        assert resp.status_code == 200
        traditions = resp.json()["traditions"]
        assert len(traditions) >= 1

    def test_empty_search_result(self):
        resp = client.get("/api/world-music/traditions?search=nonexistent_instrument_xyz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["traditions"] == []

    def test_tradition_detail(self):
        resp = client.get("/api/world-music/traditions/hindustani")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "hindustani"
        assert data["name"] == "Hindustani Classical"
        assert "instruments_detail" in data
        assert "scales_detail" in data
        assert "rhythms_detail" in data
        assert "related_traditions_detail" in data
        assert len(data["instruments_detail"]) > 0
        assert len(data["scales_detail"]) > 0

    def test_tradition_detail_not_found(self):
        resp = client.get("/api/world-music/traditions/nonexistent")
        assert resp.status_code == 404

    def test_all_traditions_have_detail(self):
        list_resp = client.get("/api/world-music/traditions")
        traditions = list_resp.json()["traditions"]
        for t in traditions:
            resp = client.get(f"/api/world-music/traditions/{t['id']}")
            assert resp.status_code == 200
            data = resp.json()
            assert data["id"] == t["id"]
            assert "instruments_detail" in data


class TestRegions:
    def test_get_regions(self):
        resp = client.get("/api/world-music/regions")
        assert resp.status_code == 200
        regions = resp.json()["regions"]
        assert len(regions) > 0
        for r in regions:
            assert "id" in r
            assert "name" in r
            assert "description" in r


class TestInstruments:
    def test_get_all_instruments(self):
        resp = client.get("/api/world-music/instruments")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        for inst in data["instruments"]:
            assert "id" in inst
            assert "name" in inst
            assert "family" in inst
            assert "tradition" in inst

    def test_filter_instruments_by_tradition(self):
        resp = client.get("/api/world-music/instruments?tradition=hindustani")
        assert resp.status_code == 200
        instruments = resp.json()["instruments"]
        assert len(instruments) > 0
        for inst in instruments:
            assert inst["tradition"] == "hindustani"

    def test_filter_instruments_by_family(self):
        resp = client.get("/api/world-music/instruments?family=percussion")
        assert resp.status_code == 200
        instruments = resp.json()["instruments"]
        assert len(instruments) > 0
        for inst in instruments:
            assert inst["family"] == "percussion"


class TestScales:
    def test_get_all_scales(self):
        resp = client.get("/api/world-music/scales")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        for scale in data["scales"]:
            assert "id" in scale
            assert "name" in scale
            assert "tradition" in scale

    def test_filter_scales_by_tradition(self):
        resp = client.get("/api/world-music/scales?tradition=arabic_maqam")
        assert resp.status_code == 200
        scales = resp.json()["scales"]
        assert len(scales) > 0
        for s in scales:
            assert s["tradition"] == "arabic_maqam"

    def test_search_scales(self):
        resp = client.get("/api/world-music/scales?search=blues")
        assert resp.status_code == 200
        scales = resp.json()["scales"]
        assert len(scales) >= 1


class TestRhythms:
    def test_get_all_rhythms(self):
        resp = client.get("/api/world-music/rhythms")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        for r in data["rhythms"]:
            assert "id" in r
            assert "name" in r
            assert "beats" in r

    def test_filter_rhythms_by_tradition(self):
        resp = client.get("/api/world-music/rhythms?tradition=flamenco")
        assert resp.status_code == 200
        rhythms = resp.json()["rhythms"]
        assert len(rhythms) > 0
        for r in rhythms:
            assert r["tradition"] == "flamenco"


class TestLearningPaths:
    def test_get_learning_paths(self):
        resp = client.get("/api/world-music/learning-paths")
        assert resp.status_code == 200
        paths = resp.json()["learning_paths"]
        assert len(paths) > 0
        for p in paths:
            assert "id" in p
            assert "name" in p
            assert "steps" in p

    def test_get_learning_path_detail(self):
        resp = client.get("/api/world-music/learning-paths/explore_india")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "explore_india"
        assert len(data["steps"]) > 0

    def test_learning_path_not_found(self):
        resp = client.get("/api/world-music/learning-paths/nonexistent")
        assert resp.status_code == 404


class TestComparison:
    def test_compare_two_traditions(self):
        resp = client.get("/api/world-music/compare?ids=hindustani,arabic_maqam")
        assert resp.status_code == 200
        data = resp.json()
        assert "traditions" in data
        assert "dimensions" in data
        assert len(data["traditions"]) == 2

    def test_compare_requires_two_ids(self):
        resp = client.get("/api/world-music/compare?ids=hindustani")
        assert resp.status_code == 400

    def test_compare_max_four_ids(self):
        resp = client.get("/api/world-music/compare?ids=hindustani,arabic_maqam,jazz,flamenco,celtic")
        assert resp.status_code == 400

    def test_compare_invalid_ids(self):
        resp = client.get("/api/world-music/compare?ids=nonexistent1,nonexistent2")
        assert resp.status_code == 404
