import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SubscriptionProvider } from "./hooks/useSubscription.jsx";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Lesson = lazy(() => import("./pages/Lesson"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Profile = lazy(() => import("./pages/Profile"));
const VocalGuru = lazy(() => import("./pages/VocalGuru"));
const SpeechAnalysis = lazy(() => import("./pages/SpeechAnalysis"));
const PracticeHistory = lazy(() => import("./pages/PracticeHistory"));
const Lyrics = lazy(() => import("./pages/Lyrics"));
const Metronome = lazy(() => import("./pages/Metronome"));
const Piano = lazy(() => import("./pages/Piano"));
const Drums = lazy(() => import("./pages/Drums"));
const Ragas = lazy(() => import("./pages/Ragas"));
const RagaLearning = lazy(() => import("./pages/RagaLearning"));
const Talas = lazy(() => import("./pages/Talas"));
const Sargam = lazy(() => import("./pages/Sargam"));
const PracticeStudio = lazy(() => import("./pages/PracticeStudio"));
const AICoach = lazy(() => import("./pages/AICoach"));
const AiLessons = lazy(() => import("./pages/AiLessons"));
const WorldMusic = lazy(() => import("./pages/WorldMusic"));
const TraditionDetail = lazy(() => import("./pages/TraditionDetail"));
const WorldMusicComparison = lazy(() => import("./pages/WorldMusicComparison"));
const NoteRecognition = lazy(() => import("./pages/NoteRecognition"));
const IntervalTraining = lazy(() => import("./pages/IntervalTraining"));
const RhythmTraining = lazy(() => import("./pages/RhythmTraining"));
const MelodyRecognition = lazy(() => import("./pages/MelodyRecognition"));
const MusicalMemory = lazy(() => import("./pages/MusicalMemory"));
const WorldMusicListening = lazy(() => import("./pages/WorldMusicListening"));
const ProgressDashboard = lazy(() => import("./pages/ProgressDashboard"));
const Gamification = lazy(() => import("./pages/Gamification"));
const Community = lazy(() => import("./pages/Community"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Subscription = lazy(() => import("./pages/Subscription"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0F0F23",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48,
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#6C63FF",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ color: "#6B6B8D", fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/home" replace />} />
                  <Route path="home" element={<Home />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="courses/:id" element={<CourseDetail />} />
                  <Route path="lessons/:id" element={<Lesson />} />
                  <Route path="lessons/:id/quiz" element={<Quiz />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="vocal-guru" element={<VocalGuru />} />
                  <Route path="speech-analysis" element={<SpeechAnalysis />} />
                  <Route path="practice" element={<PracticeStudio />} />
                  <Route path="ai-coach" element={<AICoach />} />
                  <Route path="practice-history" element={<PracticeHistory />} />
                  <Route path="lyrics" element={<Lyrics />} />
                  <Route path="metronome" element={<Metronome />} />
                  <Route path="piano" element={<Piano />} />
                  <Route path="drums" element={<Drums />} />
                  <Route path="ragas" element={<Ragas />} />
                  <Route path="ragas/:ragaId/learn" element={<RagaLearning />} />
                  <Route path="talas" element={<Talas />} />
                  <Route path="sargam" element={<Sargam />} />
                  <Route path="ai-lessons" element={<AiLessons />} />
                  <Route path="ai-lessons/:courseId" element={<AiLessons />} />
                  <Route path="world-music" element={<WorldMusic />} />
                  <Route path="world-music/:traditionId" element={<TraditionDetail />} />
                  <Route path="world-music/compare" element={<WorldMusicComparison />} />
                  <Route path="music-lab" element={<NoteRecognition />} />
                  <Route path="music-lab/notes" element={<NoteRecognition />} />
                  <Route path="music-lab/intervals" element={<IntervalTraining />} />
                  <Route path="music-lab/rhythm" element={<RhythmTraining />} />
                  <Route path="music-lab/melody" element={<MelodyRecognition />} />
                  <Route path="music-lab/memory" element={<MusicalMemory />} />
                  <Route path="music-lab/world" element={<WorldMusicListening />} />
                  <Route path="progress" element={<ProgressDashboard />} />
                  <Route path="gamification" element={<Gamification />} />
                  <Route path="community" element={<Community />} />
                  <Route path="profile/:username" element={<PublicProfile />} />
                  <Route path="community/groups/:groupId" element={<GroupDetail />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="subscription" element={<Subscription />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ToastProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
