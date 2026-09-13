import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
  useParams: () => ({ traditionId: "hindustani" }),
}));

vi.mock("../api/worldMusicApi", () => ({
  worldMusicApi: {
    getOverview: vi.fn(),
    getTraditions: vi.fn(),
    getTradition: vi.fn(),
    getRegions: vi.fn(),
    getInstruments: vi.fn(),
    getScales: vi.fn(),
    getRhythms: vi.fn(),
    getLearningPaths: vi.fn(),
  },
}));

vi.mock("../hooks/useAudioFeedback", () => ({
  useAudioFeedback: () => ({
    buttonClick: vi.fn(), navChime: vi.fn(), completion: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock("../utils/keyboard", () => ({
  onKeyDown: vi.fn(),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import { worldMusicApi } from "../api/worldMusicApi";
import WorldMusic from "../pages/WorldMusic";
import TraditionDetail from "../pages/TraditionDetail";

const mockTraditions = [
  {
    id: "hindustani",
    name: "Hindustani Classical",
    region: "south_asia",
    country_or_area: "North India, Pakistan, Bangladesh",
    description: "One of the world's most sophisticated melodic traditions.",
    characteristics: ["Raga-based melodic improvisation", "Tala rhythmic cycle system"],
    instruments: ["sitar", "tabla", "sarod"],
    scales_or_modes: ["raga_yaman", "raga_bhairav"],
    rhythmic_concepts: ["teentaal", "jhaptaal"],
    vocal_concepts: ["dhrupad", "khayal"],
    terminology: [{ term: "Raga", definition: "A melodic framework" }],
    difficulty: "intermediate",
    related_traditions: ["carnatic"],
    learning_topics: ["raga_recognition", "tala_cycles"],
    available_practice_routes: ["/ragas", "/talas"],
  },
  {
    id: "jazz",
    name: "Jazz",
    region: "north_america",
    country_or_area: "United States",
    description: "Jazz emerged from the convergence of African rhythmic traditions.",
    characteristics: ["Improvisation as central practice", "Swing rhythmic feel"],
    instruments: ["saxophone", "trumpet", "piano"],
    scales_or_modes: ["blues_scale"],
    rhythmic_concepts: ["swing_feel"],
    vocal_concepts: ["scat_singing"],
    terminology: [{ term: "Swing", definition: "A rhythmic feel" }],
    difficulty: "intermediate",
    related_traditions: [],
    learning_topics: ["blues_form"],
    available_practice_routes: ["/piano"],
  },
];

const mockRegions = [
  { id: "south_asia", name: "South Asia", description: "A subcontinent of extraordinary musical diversity.", traditions_count: 3 },
  { id: "north_america", name: "North America", description: "A melting pot of traditions.", traditions_count: 1 },
];

const mockInstruments = [
  { id: "sitar", name: "Sitar", tradition: "hindustani", region: "south_asia", family: "strings", description: "A long-necked plucked string instrument.", role: "Melodic lead instrument" },
  { id: "saxophone", name: "Saxophone", tradition: "jazz", region: "north_america", family: "winds", description: "A single-reed woodwind instrument.", role: "Solo instrument" },
];

const mockTraditionDetail = {
  ...mockTraditions[0],
  instruments_detail: [mockInstruments[0]],
  scales_detail: [
    { id: "raga_yaman", name: "Raga Yaman", tradition: "hindustani", equivalent: "Lydian mode", notes: ["Sa", "Re", "Ga", "Tivra Ma"], description: "An evening raga." },
  ],
  rhythms_detail: [
    { id: "teentaal", name: "Teentaal", tradition: "hindustani", beats: 16, description: "The most common tala." },
  ],
  related_traditions_detail: [{ id: "carnatic", name: "Carnatic Classical", region: "south_asia" }],
};

describe("WorldMusic page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    worldMusicApi.getTraditions.mockResolvedValue({ traditions: mockTraditions, total: 2 });
    worldMusicApi.getRegions.mockResolvedValue({ regions: mockRegions });
    worldMusicApi.getInstruments.mockResolvedValue({ instruments: mockInstruments, total: 2 });
  });

  it("renders loading state initially", () => {
    worldMusicApi.getTraditions.mockReturnValue(new Promise(() => {}));
    worldMusicApi.getRegions.mockReturnValue(new Promise(() => {}));
    worldMusicApi.getInstruments.mockReturnValue(new Promise(() => {}));
    render(<WorldMusic />);
    expect(screen.getByText("World Music")).toBeTruthy();
  });

  it("renders traditions after loading", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
      expect(screen.getByText("Jazz")).toBeTruthy();
    });
  });

  it("displays region information", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("South Asia")).toBeTruthy();
      expect(screen.getByText("North America")).toBeTruthy();
    });
  });

  it("searches traditions by name", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
    const searchInput = screen.getByPlaceholderText(/Search traditions/);
    fireEvent.change(searchInput, { target: { value: "jazz" } });
    await waitFor(() => {
      expect(screen.queryByText("Hindustani Classical")).toBeNull();
      expect(screen.getByText("Jazz")).toBeTruthy();
    });
  });

  it("filters by region", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
    const regionSelect = screen.getByDisplayValue("All Regions");
    fireEvent.change(regionSelect, { target: { value: "south_asia" } });
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
      expect(screen.queryByText("Jazz")).toBeNull();
    });
  });

  it("filters by difficulty", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
    const diffSelect = screen.getByDisplayValue("All Levels");
    fireEvent.change(diffSelect, { target: { value: "beginner" } });
    await waitFor(() => {
      expect(screen.queryByText("Hindustani Classical")).toBeNull();
      expect(screen.queryByText("Jazz")).toBeNull();
    });
  });

  it("displays instruments tab", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
    const instrumentsTab = screen.getByText("Instruments");
    fireEvent.click(instrumentsTab);
    await waitFor(() => {
      expect(screen.getByText("Sitar")).toBeTruthy();
      expect(screen.getByText("Saxophone")).toBeTruthy();
    });
  });

  it("navigates to tradition detail on click", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
    const hindustaniCard = screen.getByText("Hindustani Classical");
    fireEvent.click(hindustaniCard);
    expect(mockNavigate).toHaveBeenCalledWith("/world-music/hindustani");
  });

  it("shows empty state when no results match search", async () => {
    worldMusicApi.getTraditions.mockResolvedValue({ traditions: [], total: 0 });
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("No traditions found")).toBeTruthy();
    });
  });

  it("shows error state", async () => {
    worldMusicApi.getTraditions.mockRejectedValue(new Error("Network error"));
    worldMusicApi.getRegions.mockRejectedValue(new Error("Network error"));
    worldMusicApi.getInstruments.mockRejectedValue(new Error("Network error"));
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeTruthy();
    });
  });

  it("has no fake data - all traditions come from API", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      const allText = document.body.textContent;
      expect(allText).toContain("Hindustani Classical");
      expect(allText).toContain("Jazz");
      expect(allText).not.toContain("Fake Tradition");
      expect(allText).not.toContain("Lorem ipsum");
    });
  });

  it("search filters traditions correctly", async () => {
    render(<WorldMusic />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
    const searchInput = screen.getByPlaceholderText(/Search traditions/);
    fireEvent.change(searchInput, { target: { value: "jazz" } });
    await waitFor(() => {
      expect(screen.queryByText("Hindustani Classical")).toBeNull();
      expect(screen.getByText("Jazz")).toBeTruthy();
    });
    fireEvent.change(searchInput, { target: { value: "" } });
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
    });
  });
});

describe("TraditionDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    worldMusicApi.getTradition.mockResolvedValue(mockTraditionDetail);
  });

  it("renders tradition detail after loading", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Hindustani Classical")).toBeTruthy();
      expect(screen.getByText("North India, Pakistan, Bangladesh")).toBeTruthy();
    });
  });

  it("displays overview section", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeTruthy();
      expect(screen.getByText(/One of the world's most sophisticated/)).toBeTruthy();
    });
  });

  it("displays instruments", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Instruments")).toBeTruthy();
      expect(screen.getByText("Sitar")).toBeTruthy();
    });
  });

  it("displays scales", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Scales & Modes")).toBeTruthy();
      expect(screen.getByText("Raga Yaman")).toBeTruthy();
    });
  });

  it("displays rhythms", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Rhythm")).toBeTruthy();
      expect(screen.getByText("Teentaal")).toBeTruthy();
    });
  });

  it("displays terminology", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Musical Vocabulary")).toBeTruthy();
      expect(screen.getByText("Raga")).toBeTruthy();
    });
  });

  it("displays related traditions", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Related Traditions")).toBeTruthy();
      expect(screen.getByText("Carnatic Classical")).toBeTruthy();
    });
  });

  it("displays practice routes", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Practice This Tradition")).toBeTruthy();
    });
  });

  it("navigates to related tradition on click", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Carnatic Classical")).toBeTruthy();
    });
    const carnatLink = screen.getByText("Carnatic Classical");
    fireEvent.click(carnatLink);
    expect(mockNavigate).toHaveBeenCalledWith("/world-music/carnatic");
  });

  it("navigates to practice route on click", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Explore Ragas")).toBeTruthy();
    });
    const ragaLink = screen.getByText("Explore Ragas");
    fireEvent.click(ragaLink);
    expect(mockNavigate).toHaveBeenCalledWith("/ragas");
  });

  it("navigates back to world music", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("← Back to World Music")).toBeTruthy();
    });
    const backBtn = screen.getByText("← Back to World Music");
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/world-music");
  });

  it("shows AI Coach CTA", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Want personalized guidance?")).toBeTruthy();
      expect(screen.getByText("Open AI Coach")).toBeTruthy();
    });
  });

  it("navigates to AI Coach on click", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Open AI Coach")).toBeTruthy();
    });
    const coachBtn = screen.getByText("Open AI Coach");
    fireEvent.click(coachBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/ai-coach");
  });

  it("shows error state for invalid tradition", async () => {
    worldMusicApi.getTradition.mockRejectedValue(new Error("Tradition not found"));
    render(<TraditionDetail />);
    await waitFor(() => {
      expect(screen.getByText("Tradition not found")).toBeTruthy();
      expect(screen.getByText("Back to World Music")).toBeTruthy();
    });
  });

  it("has no fake statistics or completion percentages", async () => {
    render(<TraditionDetail />);
    await waitFor(() => {
      const allText = document.body.textContent;
      expect(allText).not.toMatch(/\d+%/);
      expect(allText).not.toContain("100%");
      expect(allText).not.toContain("Complete");
    });
  });
});
