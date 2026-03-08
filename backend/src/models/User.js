import mongoose from "mongoose";

/* ---------- SUBTOPIC ---------- */
const SubtopicSchema = new mongoose.Schema({
  title: { type: String, required: true },

  status: {
    type: String,
    enum: ["locked", "unlocked", "completed"],
    default: "locked"
  },

  content: {
    theory: String,
    youtubeQuery: String,
    skills: [String]
  },

  quizzes: [{
    question: String,
    options: [String],
    correctOptionIndex: Number,
    explanation: String,
    skillsTested: [String]
  }],

  quizAttempts: [{
    quizIndex: Number,
    selectedOptionIndex: Number,
    isCorrect: Boolean,
    score: Number,
    attemptedAt: Date
  }],

  isCoding: {
    type: Boolean,
    default: false
  },

  codingChallenge: {
    problemStatement: String,
    starterCode: String,
    hint: String,
    executionType: String,
    testCases: [{
      input: String,
      expectedOutput: String,
      isVisible: Boolean,
      explanation: String
    }],
    skills: [String], // Skills tested by this coding challenge
    languageId: Number,
    createdAt: { type: Date, default: Date.now } // Track when problem was generated
  },

  codingSubmission: {
    recentCode: String,
    noOfSubmissions: { type: Number, default: 0 },
    lastResult: {
      passed: Boolean,
      failedTestCases: Number
    },
    codingScore: { type: Number, default: 0 }
  },

  
  score: { type: Number, default: 0 }
});

/* ---------- TOPIC ---------- */
const TopicSchema = new mongoose.Schema({
  title: String,
  description: String,

  status: {
    type: String,
    enum: ["locked", "unlocked", "completed"],
    default: "locked"
  },

  score: { type: Number, default: 0 },
  subtopics: [SubtopicSchema],
  progress: { type: Number, default: 0 }

});

/* ---------- USER ---------- */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  googleId: String,

  roadmaps: [{
  subject: String,
  level: String,
  goals: String,
  language: { type: String, default: null },   // 👈 ADD THIS
  languageId: { type: Number, default: null }, // 👈 ADD THIS
  dateCreated: { type: Date, default: Date.now },
  progress: { type: Number, default: 0 },
  topics: [TopicSchema]
}],

  globalSkills: [{
    skill: String,
    confidence: { type: Number, default: 0 },
    quizAttempts: { type: Number, default: 0 },
    codeAttempts: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    confidenceHistory: [{
      value: Number,
      date: Date
    }]
  }]
});

export default mongoose.model("User", UserSchema);
