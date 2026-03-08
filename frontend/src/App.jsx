import { useState } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Subtopics from "./pages/Subtopics";
import LessonPage from "./pages/LessonPage";
import QuizPage from "./pages/QuizPage";
import Profile from "./pages/ProfilePage";
import CodingPage from "./pages/CodingPage";
import PDFLearningPage from "./pages/PDFLearningPage";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );
  // "landing" | "login" | "signup"
  const [screen, setScreen] = useState("landing");

  const [roadmap, setRoadmap] = useState(null);
  const [roadmapIndex, setRoadmapIndex] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [codingData, setCodingData] = useState(null);
  const [showPDFLearning, setShowPDFLearning] = useState(false);

  // ── Pre-auth screens ─────────────────────────────────
  if (!loggedIn) {
    if (screen === "login") {
      return (
        <Login
          onLogin={() => setLoggedIn(true)}
          goToSignup={() => setScreen("signup")}
          goToLanding={() => setScreen("landing")}
        />
      );
    }
    if (screen === "signup") {
      return (
        <Signup
          goToLogin={() => setScreen("login")}
          goToLanding={() => setScreen("landing")}
        />
      );
    }
    // Default: landing page
    return (
      <Landing
        goToLogin={() => setScreen("login")}
        goToSignup={() => setScreen("signup")}
      />
    );
  }

  // ── Logout ───────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setScreen("landing");
  };

  const handleSelectRoadmap = (selectedRoadmap, index) => {
    setRoadmap(selectedRoadmap);
    setRoadmapIndex(index);
  };

  // 🔥 Profile
  if (showProfile) {
    return <Profile onBack={() => setShowProfile(false)} />;
  }

  // 📄 PDF Learning
  if (showPDFLearning) {
    return <PDFLearningPage onBack={() => setShowPDFLearning(false)} />;
  }

  // 💻 Coding
  if (codingData) {
    return (
      <CodingPage
        codingData={codingData}
        onFinish={() => {
          setCodingData(null);
          setLessonData(null);
        }}
      />
    );
  }

  // 🧠 Quiz
  if (quizData) {
    return (
      <QuizPage
        quizData={quizData}
        onBack={() => setQuizData(null)}
        onFinish={(hasCoding) => {
          setQuizData(null);
          if (hasCoding) setCodingData(quizData);
        }}
      />
    );
  }

  // 📘 Lesson
  if (lessonData) {
    return (
      <LessonPage
        lessonData={lessonData}
        onBack={() => setLessonData(null)}
        onStartQuiz={setQuizData}
      />
    );
  }

  // 📚 Subtopics
  if (activeTopic) {
    return (
      <Subtopics
        topic={activeTopic}
        onBack={() => setActiveTopic(null)}
        onOpenLesson={setLessonData}
      />
    );
  }

  // 🗺️ Roadmap
  if (roadmap) {
    return (
      <Roadmap
        roadmap={roadmap}
        roadmapIndex={roadmapIndex}
        onOpenTopic={(topic) => setActiveTopic(topic)}
        onBack={() => {
          setRoadmap(null);
          setRoadmapIndex(null);
        }}
      />
    );
  }

  // 🏠 Dashboard
  return (
    <Dashboard
      onCreate={handleSelectRoadmap}
      onOpenProfile={() => setShowProfile(true)}
      onOpenPDFLearning={() => setShowPDFLearning(true)}
      onLogout={handleLogout}
    />
  );
}

export default App;