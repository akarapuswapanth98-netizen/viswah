import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { worldMusicApi } from "../api/worldMusicApi";
import { onKeyDown } from "../utils/keyboard";

const C = {
  ink: "#0C0A14",
  surface: "#161222",
  elevated: "#241E38",
  floating: "#2A2344",
  saffron: "#E8A838",
  saffronMuted: "#C4893A",
  raga: "#C77DBA",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
  borderHover: "rgba(240, 235, 227, 0.12)",
  borderFocus: "rgba(232, 168, 56, 0.3)",
  success: "#6DBF73",
  warning: "#D4A84A",
  error: "#D46A6A",
};

const REGION_ICONS = {
  south_asia: "\uD83C\uDFDE\uFE0F",
  middle_east: "\uD83C\uDFDB\uFE0F",
  east_asia: "\u26E9\uFE0F",
  southeast_asia: "\uD83C\uDF3F",
  africa: "\uD83C\uDF34",
  europe: "\uD83C\uDFF0",
  north_america: "\uD83C\uDF32",
  latin_america: "\uD83C\uDF35",
};

const REGION_COLORS = {
  south_asia: C.saffron,
  middle_east: C.raga,
  east_asia: C.teal,
  southeast_asia: "#6DBF73",
  africa: "#D4A84A",
  europe: "#5B8EC7",
  north_america: C.saffronMuted,
  latin_america: C.error,
};

const DIFFICULTY_COLORS = {
  beginner: { bg: `${C.success}15`, text: C.success },
  intermediate: { bg: `${C.teal}15`, text: C.teal },
  advanced: { bg: `${C.warning}15`, text: C.warning },
};

const FAMILY_ICONS = {
  strings: "\uD83C\uDFB6",
  percussion: "\uD83C\uDFB5",
  winds: "\uD83C\uDF43",
  keyboards: "\uD83C\uDFB9",
  voice: "\uD83C\uDFA4",
};

function SkeletonCard() {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{ height: 24, width: "60%", borderRadius: 8, marginBottom: 12, background: `linear-gradient(90deg, ${C.surface} 25%, ${C.elevated} 50%, ${C.surface} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ height: 14, width: "40%", borderRadius: 8, marginBottom: 8, background: `linear-gradient(90deg, ${C.surface} 25%, ${C.elevated} 50%, ${C.surface} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ height: 14, width: "80%", borderRadius: 8, background: `linear-gradient(90deg, ${C.surface} 25%, ${C.elevated} 50%, ${C.surface} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
    </div>
  );
}

function RegionCard({ region, traditions, onClick, mounted, delay }) {
  const [hovered, setHovered] = useState(false);
  const color = REGION_COLORS[region.id] || C.saffron;
  const count = traditions.filter((t) => t.region === region.id).length;

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onClick(region.id)}
      onKeyDown={(e) => onKeyDown(e, () => onClick(region.id))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.elevated : C.surface,
        border: `1px solid ${hovered ? color + "40" : C.border}`,
        borderRadius: 14,
        padding: 18,
        cursor: "pointer",
        transition: "all 0.25s ease-out",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${delay}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}80)`,
        opacity: hovered ? 1 : 0.5,
        transition: "opacity 0.25s",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{REGION_ICONS[region.id] || "\uD83C\uDFB5"}</span>
        <span style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{region.name}</span>
      </div>
      <p style={{ color: C.textMuted, fontSize: 12, margin: "0 0 10px", lineHeight: 1.4 }}>
        {region.description}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>{count}</span>
        <span style={{ color: C.textMuted, fontSize: 12 }}>tradition{count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function TraditionCard({ tradition, onClick, mounted, delay }) {
  const [hovered, setHovered] = useState(false);
  const regionColor = REGION_COLORS[tradition.region] || C.saffron;
  const dc = DIFFICULTY_COLORS[tradition.difficulty] || DIFFICULTY_COLORS.beginner;

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onClick(tradition.id)}
      onKeyDown={(e) => onKeyDown(e, () => onClick(tradition.id))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.elevated : C.surface,
        border: `1px solid ${hovered ? regionColor + "40" : C.border}`,
        borderRadius: 14,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.25s ease-out",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${delay}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${regionColor}, ${regionColor}80)`,
        opacity: hovered ? 1 : 0.5,
        transition: "opacity 0.25s",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{tradition.name}</h3>
        <span style={{ color: regionColor, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{tradition.region?.replace(/_/g, " ")}</span>
      </div>
      {tradition.country_or_area && (
        <p style={{ color: C.textMuted, fontSize: 12, margin: "0 0 8px" }}>{tradition.country_or_area}</p>
      )}
      <p style={{ color: C.textSecondary, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {tradition.description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {(tradition.instruments || []).slice(0, 3).map((inst) => (
          <span key={inst} style={{
            background: `${C.elevated}`,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 11,
            color: C.textSecondary,
          }}>{inst}</span>
        ))}
        {(tradition.instruments || []).length > 3 && (
          <span style={{ color: C.textMuted, fontSize: 11 }}>+{tradition.instruments.length - 3}</span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          background: dc.bg,
          color: dc.text,
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: 11,
          fontWeight: 600,
        }}>{tradition.difficulty}</span>
        <span style={{ color: regionColor, fontSize: 13, fontWeight: 600 }}>Explore →</span>
      </div>
    </div>
  );
}

function InstrumentCard({ instrument, mounted, delay }) {
  const [hovered, setHovered] = useState(false);
  const regionColor = REGION_COLORS[instrument.region] || C.saffron;

  return (
    <div
      style={{
        background: hovered ? C.elevated : C.surface,
        border: `1px solid ${hovered ? regionColor + "35" : C.border}`,
        borderRadius: 12,
        padding: 14,
        transition: "all 0.2s ease-out",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{FAMILY_ICONS[instrument.family] || "\uD83C\uDFB5"}</span>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{instrument.name}</span>
      </div>
      <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 6px", lineHeight: 1.3 }}>{instrument.role}</p>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <span style={{ color: regionColor, fontSize: 10, fontWeight: 600 }}>{instrument.tradition?.replace(/_/g, " ")}</span>
      </div>
    </div>
  );
}

export default function WorldMusic() {
  const navigate = useNavigate();
  const [traditions, setTraditions] = useState([]);
  const [regions, setRegions] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [activeTab, setActiveTab] = useState("traditions");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tradRes, regRes, instRes] = await Promise.all([
        worldMusicApi.getTraditions(),
        worldMusicApi.getRegions(),
        worldMusicApi.getInstruments(),
      ]);
      setTraditions(tradRes.traditions || []);
      setRegions(regRes.regions || []);
      setInstruments(instRes.instruments || []);
    } catch (err) {
      setError(err.message || "Failed to load world music data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTraditions = useMemo(() => {
    let result = traditions;
    if (regionFilter) result = result.filter((t) => t.region === regionFilter);
    if (difficultyFilter) result = result.filter((t) => t.difficulty === difficultyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.country_or_area || "").toLowerCase().includes(q) ||
        (t.instruments || []).some((i) => i.toLowerCase().includes(q))
      );
    }
    return result;
  }, [traditions, regionFilter, difficultyFilter, search]);

  const filteredInstruments = useMemo(() => {
    let result = instruments;
    if (regionFilter) result = result.filter((i) => i.region === regionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [instruments, regionFilter, search]);

  const traditionsByRegion = useMemo(() => {
    const map = {};
    regions.forEach((r) => { map[r.id] = []; });
    traditions.forEach((t) => {
      if (map[t.region]) map[t.region].push(t);
    });
    return map;
  }, [traditions, regions]);

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      {/* Ambient light */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(232, 168, 56, 0.04), transparent 70%), radial-gradient(ellipse 40% 30% at 20% 20%, rgba(91, 168, 160, 0.03), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>
            World Music
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
            Explore the musical traditions of our world
          </p>
        </div>

        {/* Search + Filters */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 16,
          marginBottom: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <input
            type="text"
            placeholder="Search traditions, instruments, concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1 1 260px",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.ink,
              color: C.text,
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = C.borderFocus;
              e.target.style.boxShadow = "0 0 0 3px rgba(232, 168, 56, 0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = C.border;
              e.target.style.boxShadow = "none";
            }}
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              background: C.ink,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              padding: "10px 14px",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
              minWidth: 140,
            }}
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{
              background: C.ink,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              padding: "10px 14px",
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
              minWidth: 120,
            }}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { id: "traditions", label: "Traditions", icon: "\uD83C\uDFAD" },
            { id: "regions", label: "Regions", icon: "\uD83C\uDF0D" },
            { id: "instruments", label: "Instruments", icon: "\uD83C\uDFB6" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `1px solid ${activeTab === tab.id ? C.saffron + "40" : C.border}`,
                background: activeTab === tab.id ? `${C.saffron}15` : C.surface,
                color: activeTab === tab.id ? C.saffron : C.textSecondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: `${C.error}10`,
            border: `1px solid ${C.error}25`,
            borderRadius: 12,
            padding: 20,
            color: C.error,
            textAlign: "center",
            marginBottom: 24,
          }}>
            <p style={{ margin: "0 0 12px" }}>{error}</p>
            <button onClick={fetchData} style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: C.saffron, color: C.ink, cursor: "pointer", fontWeight: 600, fontSize: 13,
            }}>Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredTraditions.length === 0 && activeTab === "traditions" && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "60px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>\uD83C\uDF0D</div>
            <p style={{ color: C.textSecondary, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
              No traditions found
            </p>
            <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 16px" }}>
              {search ? "Try a different search or clear your filters" : "No traditions available"}
            </p>
            {(search || regionFilter || difficultyFilter) && (
              <button onClick={() => { setSearch(""); setRegionFilter(""); setDifficultyFilter(""); }} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: C.saffron, color: C.ink, cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}>Clear Search</button>
            )}
          </div>
        )}

        {/* Traditions tab */}
        {!loading && !error && activeTab === "traditions" && filteredTraditions.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filteredTraditions.map((tradition, i) => (
              <TraditionCard
                key={tradition.id}
                tradition={tradition}
                onClick={(id) => navigate(`/world-music/${id}`)}
                mounted={mounted}
                delay={Math.min(i * 40, 200)}
              />
            ))}
          </div>
        )}

        {/* Regions tab */}
        {!loading && !error && activeTab === "regions" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
              {regions.map((region, i) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  traditions={traditions}
                  onClick={(id) => { setRegionFilter(id); setActiveTab("traditions"); }}
                  mounted={mounted}
                  delay={Math.min(i * 50, 250)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Instruments tab */}
        {!loading && !error && activeTab === "instruments" && (
          <div>
            {filteredInstruments.length === 0 ? (
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "40px 24px",
                textAlign: "center",
              }}>
                <p style={{ color: C.textSecondary, fontSize: 16, margin: 0 }}>No instruments found</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {filteredInstruments.map((instrument, i) => (
                  <InstrumentCard
                    key={instrument.id}
                    instrument={instrument}
                    mounted={mounted}
                    delay={Math.min(i * 30, 200)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
