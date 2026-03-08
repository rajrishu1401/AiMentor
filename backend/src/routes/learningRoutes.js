import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createRoadmap,
  createSkillBasedRoadmap,
  setRoadmapLanguage,
  tutorTest,
  curriculumTest,
  evaluationTest,
  submitQuiz,
  submitCode,
  runCode,
  generateSubtopics,
  generateSubtopicContent,
  getMyRoadmaps,
  getMySubtopics,
  deleteRoadmap,
  generateQuizzes,
  generateCodingChallenge,
  decideCodingRequirement,
  chatWithBot,
  chatWithLearningAssistant
} from "../controllers/learningController.js";

const router = express.Router();

router.post("/create-skill-roadmap", protect, createSkillBasedRoadmap);
router.post("/create-roadmap", protect, createRoadmap);
router.post("/set-roadmap-language", protect, setRoadmapLanguage);

router.get("/tutor-test", tutorTest);
router.get("/curriculum-test", curriculumTest);
router.get("/evaluation-test", evaluationTest);
router.post(
  "/decide-coding",
  protect,
  decideCodingRequirement
);
router.post("/run-code", protect, runCode);
router.post("/submit-code", protect, submitCode);
router.post("/submit-quiz", protect, submitQuiz);
router.post("/generate-coding-challenge", protect, generateCodingChallenge);
router.post("/generate-subtopics", protect, generateSubtopics);
router.post("/generate-quizzes", protect, generateQuizzes);
router.post("/generate-subtopic-content", protect, generateSubtopicContent);

router.post("/delete-roadmap", protect, deleteRoadmap);
router.get("/my-roadmaps", protect, getMyRoadmaps);
router.get("/my-subtopics", protect, getMySubtopics);

// Chatbot for coding assistance
router.post("/chat", protect, chatWithBot);

// Learning Assistant for theory and quiz pages
router.post("/learning-chat", protect, chatWithLearningAssistant);

export default router;