import { callTutorAgent } from "../agents/tutorAgent.js";
import { callCurriculumAgent } from "../agents/curriculumAgent.js";
import { callEvaluationAgent } from "../agents/evaluationAgent.js";
import { callChatbotAgent } from "../agents/chatbotAgent.js";
import { callLearningAssistantAgent } from "../agents/learningAssistantAgent.js";
import User from "../models/UserDynamoDB.js";
import { updateUserSkills } from "../services/skillService.js";
import { generateRoadmapWithAgent } from "../services/curriculumService.js";
import { safeJsonParse } from "../utils/safeJsonParse.js";
import { runCodeOnJudge0 } from "../services/judgeService.js";
import { parseQuizText } from "../utils/parseQuizText.js";
import { callCodingAgentWithAgent } from "../agents/codingAgent.js";
import { callTestCaseGeneratorAgent } from "../agents/testCaseGeneratorAgent.js";
import { mapToCanonicalSkills } from "../services/skillMappingService.js";
import { resolvePrerequisites } from "../services/prerequisiteResolver.js";
import { evaluateSkills } from "../services/skillEvaluator.js";
import { decideRoadmap } from "../services/roadmapDecision.js";
import { buildLearningPath } from "../services/learningPathBuilder.js";
import {
  getRecentCodingProblems,
  formatProblemHistoryForPrompt,
  detectProblemPatterns
} from "../services/problemHistoryService.js";
import { mapUserTopicToCanonicalSkill } from "../services/topicMappingService.js";
import { smartResolvePrerequisites, formatSkillForDisplay } from "../services/smartPrerequisiteResolver.js";








export const createSkillBasedRoadmap = async (req, res) => {
  try {
    const { skillId, level = "Beginner", goals } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: "skillId is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 1️⃣ Resolve prerequisites
    const prereqOrder = resolvePrerequisites(skillId);

    // 2️⃣ Evaluate user confidence
    const evaluation = evaluateSkills(
      prereqOrder,
      user.globalSkills
    );

    // 3️⃣ Decide roadmap type
    const decision = decideRoadmap(evaluation);

    // 4️⃣ Build final skill path
    const skillPath = buildLearningPath({
      prereqOrder,
      evaluation,
      targetSkill: skillId
    });

    // 5️⃣ Convert to roadmap topics
    const topics = skillPath.map((skill, index) => ({
      title: skill.replace(/_/g, " "),
      description: `Learn ${skill}`,
      status: index === 0 ? "unlocked" : "locked",
      subtopics: []
    }));

    const roadmap = {
      subject: skillId,
      level,
      goals,
      progress: 0,
      topics
    };

    user.roadmaps.push(roadmap);
    await user.save();

    res.json({
      decision,
      roadmap
    });

  } catch (err) {
    console.error("❌ Skill roadmap error:", err.message);
    res.status(500).json({ error: "Failed to generate skill roadmap" });
  }
};

export const generateCodingChallenge = async (req, res) => {
  try {
    const { roadmapIndex, topicIndex, subtopicIndex } = req.body;

    if (
      roadmapIndex === undefined ||
      topicIndex === undefined ||
      subtopicIndex === undefined
    ) {
      return res.status(400).json({ error: "Missing indexes" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const roadmap = user.roadmaps[roadmapIndex];
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    if (!roadmap.language || !roadmap.languageId) {
      return res.status(400).json({
        error: "Programming language not set for this roadmap"
      });
    }

    const subtopic =
      roadmap?.topics[topicIndex]?.subtopics[subtopicIndex];

    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // ⛔ Already exists
    if (subtopic.codingChallenge?.problemStatement) {
      return res.json({
        isCoding: true,
        codingChallenge: subtopic.codingChallenge
      });
    }

    // Check if coding is needed (decision made during content generation)
    if (!subtopic.isCoding) {
      return res.json({ isCoding: false });
    }

    // -----------------------------
    // STEP 1 — Get Problem History
    // -----------------------------
    const recentProblems = getRecentCodingProblems(user, 15);
    const problemHistory = formatProblemHistoryForPrompt(recentProblems);
    const usedPatterns = detectProblemPatterns(recentProblems);

    console.log(`📚 User has ${recentProblems.length} previous coding problems`);
    console.log(`🔍 Detected patterns: ${usedPatterns.join(', ') || 'none'}`);

    // -----------------------------
    // STEP 2 — Generate problem + 3 visible test cases (Coding Agent)
    // -----------------------------
    const codingPrompt = `CRITICAL: RETURN ONLY VALID JSON. NO EXPLANATIONS. NO TEXT BEFORE OR AFTER JSON.

Generate a coding challenge for ${roadmap.language}:

Topic: "${subtopic.title}"
Parent Topic: "${roadmap.topics[topicIndex].title}"

PREVIOUS PROBLEMS (avoid these):
${problemHistory}

PATTERNS USED (avoid these):
${usedPatterns.length > 0 ? usedPatterns.join(', ') : 'None yet'}

RETURN THIS JSON STRUCTURE ONLY:
{
  "problemStatement": "**Problem: [Title]**\\n\\n**Description:**\\n[2-3 sentences]\\n\\n**Input:** [format]\\n**Output:** [format]\\n**Constraints:** [list]",
  "starterCode": "Minimal ${roadmap.language} code with \\\\n for newlines",
  "hint": "Short hint",
  "executionType": "stdin",
  "testCases": [
    {"input": "val", "expectedOutput": "result", "isVisible": true, "explanation": "why"},
    {"input": "val2", "expectedOutput": "result2", "isVisible": true, "explanation": "why"},
    {"input": "val3", "expectedOutput": "result3", "isVisible": true, "explanation": "why"}
  ],
  "skills": ["skill1", "skill2"]
}

CRITICAL RULES:
1. START response with { and END with }
2. NO text before { or after }
3. NO markdown code blocks
4. NO explanations like "Here is..." or "The search results..."
5. EXACTLY 3 test cases with isVisible:true and explanation
6. Use \\\\n for newlines in starterCode
7. Keep problemStatement under 500 chars
8. Generate UNIQUE problem different from history above

RETURN ONLY THE JSON NOW:`;

    let parsed;
    try {
      parsed = await callCodingAgentWithAgent(codingPrompt);
      console.log("✅ Coding Agent Response:", parsed);
    } catch (err) {
      console.error("❌ Coding agent invocation failed:", err.message);
      return res.status(500).json({
        error: "Failed to invoke coding agent"
      });
    }

    // -----------------------------
    // STEP 3 — Validate coding agent response
    // -----------------------------
    const {
      problemStatement,
      starterCode,
      hint,
      executionType,
      testCases: visibleTestCases,
      skills
    } = parsed;

    if (
      typeof problemStatement !== "string" ||
      typeof starterCode !== "string" ||
      !Array.isArray(visibleTestCases)
    ) {
      return res.status(500).json({
        error: "Invalid coding challenge structure from coding agent"
      });
    }

    // Validate visible test cases
    if (visibleTestCases.length !== 3) {
      return res.status(500).json({
        error: "Coding agent must return exactly 3 test cases"
      });
    }

    for (const tc of visibleTestCases) {
      if (
        typeof tc.input !== "string" ||
        typeof tc.expectedOutput !== "string"
      ) {
        return res.status(500).json({
          error: "Malformed test cases: input and expectedOutput must be strings"
        });
      }

      // Check for empty values
      if (tc.input.trim() === "" || tc.expectedOutput.trim() === "") {
        return res.status(500).json({
          error: "Test case input and output cannot be empty"
        });
      }

      // Check for placeholder syntax
      if (tc.input.includes("<") || tc.input.includes(">") ||
        tc.expectedOutput.includes("<") || tc.expectedOutput.includes(">")) {
        return res.status(500).json({
          error: "Test cases contain placeholder syntax (angle brackets)"
        });
      }

      // Set isVisible=true for coding agent test cases (shown to users)
      tc.isVisible = true;

      // Ensure explanation exists
      if (!tc.explanation) {
        return res.status(500).json({
          error: "Test cases from coding agent must have an explanation"
        });
      }
    }

    // -----------------------------
    // STEP 4 — Generate 7-10 additional test cases (Test Case Generator Agent)
    // -----------------------------
    const testCasePrompt = `Generate 7-10 additional test cases for this coding problem:

PROBLEM STATEMENT:
${problemStatement}

PROGRAMMING LANGUAGE: ${roadmap.language}

EXISTING TEST CASES (for reference):
${visibleTestCases.map((tc, i) => `Test ${i + 1}:\nInput: ${tc.input}\nOutput: ${tc.expectedOutput}`).join('\n\n')}

REQUIREMENTS:
1. Generate 7-10 additional test cases
2. Cover edge cases, boundary conditions, and complex scenarios
3. Ensure diversity in test inputs
4. NO explanations needed
5. Return ONLY valid JSON with testCases array

Generate the test cases now.`;

    let hiddenTestCases = [];
    try {
      hiddenTestCases = await callTestCaseGeneratorAgent(testCasePrompt);
      console.log(`✅ Test Case Generator Response: ${hiddenTestCases.length} test cases`);

      // Set isVisible=false for test case generator test cases (not shown to users)
      hiddenTestCases.forEach(tc => {
        tc.isVisible = false;
        // Remove explanation if present (not needed for hidden test cases)
        delete tc.explanation;
      });
    } catch (err) {
      console.error("❌ Test case generator invocation failed:", err.message);
      console.warn("⚠️  Proceeding with only visible test cases");
      // Don't fail the entire request - we can proceed with just visible test cases
    }

    // -----------------------------
    // STEP 5 — Merge test cases
    // -----------------------------
    const allTestCases = [...visibleTestCases, ...hiddenTestCases];
    console.log(`📊 Total test cases: ${allTestCases.length} (${visibleTestCases.length} visible + ${hiddenTestCases.length} hidden)`);

    // Validate merged test cases
    for (const tc of allTestCases) {
      if (
        typeof tc.input !== "string" ||
        typeof tc.expectedOutput !== "string" ||
        typeof tc.isVisible !== "boolean"
      ) {
        return res.status(500).json({
          error: "Malformed test cases after merge"
        });
      }
    }

    // -----------------------------
    // STEP 6 — Format problem statement with examples from test cases
    // -----------------------------
    // Add sample inputs/outputs from visible test cases to problem statement
    let formattedProblemStatement = problemStatement;

    visibleTestCases.forEach((tc, index) => {
      formattedProblemStatement += `\n\n**Sample Input ${index}:**\n\`\`\`\n${tc.input}\n\`\`\`\n**Sample Output ${index}:**\n\`\`\`\n${tc.expectedOutput}\n\`\`\`\n**Explanation ${index}:**\n${tc.explanation}`;
    });

    // -----------------------------
    // STEP 7 — Save
    // -----------------------------
    subtopic.isCoding = true;

    subtopic.codingChallenge = {
      problemStatement: formattedProblemStatement,
      starterCode,
      hint,
      executionType: executionType || "stdin",
      testCases: allTestCases,
      languageId: roadmap.languageId,
      skills: skills || [] // Store skills from coding agent
    };

    await user.save();

    return res.json({
      isCoding: true,
      codingChallenge: subtopic.codingChallenge
    });

  } catch (err) {
    console.error("❌ Coding generation error:", err.message);
    return res.status(500).json({
      error: "Failed to generate coding challenge"
    });
  }
};

export const setRoadmapLanguage = async (req, res) => {
  try {
    const { roadmapIndex, language, languageId } = req.body;

    if (
      roadmapIndex === undefined ||
      !language ||
      !languageId
    ) {
      return res.status(400).json({
        error: "Missing roadmapIndex or language"
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const roadmap = user.roadmaps[roadmapIndex];
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    roadmap.language = language;
    roadmap.languageId = languageId;

    await user.save();

    res.json({
      message: "Language set successfully"
    });

  } catch (err) {
    console.error("❌ Set language error:", err.message);
    res.status(500).json({
      error: "Failed to set language"
    });
  }
};
export const runCode = async (req, res) => {
  try {
    console.log("🔍 runCode called with body:", JSON.stringify(req.body, null, 2));
    
    const { roadmapIndex, topicIndex, subtopicIndex, code } = req.body;
    
    console.log("🔍 Indexes:", { roadmapIndex, topicIndex, subtopicIndex });
    console.log("🔍 User ID:", req.userId);
    
    const user = await User.findById(req.userId);

    if (!user) {
      console.error("❌ User not found:", req.userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ User found:", user.email);
    console.log("📊 User has", user.roadmaps?.length || 0, "roadmaps");

    const roadmap = user.roadmaps[roadmapIndex];
    if (!roadmap) {
      console.error("❌ Roadmap not found at index:", roadmapIndex);
      return res.status(404).json({ error: "Roadmap not found" });
    }

    console.log("✅ Roadmap found:", roadmap.subject);
    console.log("📊 Roadmap has", roadmap.topics?.length || 0, "topics");

    const topic = roadmap.topics[topicIndex];
    if (!topic) {
      console.error("❌ Topic not found at index:", topicIndex);
      return res.status(404).json({ error: "Topic not found" });
    }

    console.log("✅ Topic found:", topic.title);
    console.log("📊 Topic has", topic.subtopics?.length || 0, "subtopics");

    const subtopic = topic.subtopics[subtopicIndex];
    if (!subtopic) {
      console.error("❌ Subtopic not found at index:", subtopicIndex);
      return res.status(404).json({ error: "Subtopic not found" });
    }

    console.log("✅ Subtopic found:", subtopic.title);
    console.log("📊 Has coding challenge:", !!subtopic.codingChallenge);

    if (!subtopic?.codingChallenge?.problemStatement) {
      console.error("❌ No coding challenge found");
      return res.status(400).json({ error: "No coding challenge" });
    }

    console.log("✅ Coding challenge found");
    console.log("📊 Total test cases:", subtopic.codingChallenge.testCases?.length || 0);

    // Run code ONLY on visible test cases (first 3)
    const visibleTestCases = subtopic.codingChallenge.testCases.filter(tc => tc.isVisible === true);

    console.log(`📋 Running code on ${visibleTestCases.length} visible test cases`);
    console.log("Visible test cases:", JSON.stringify(visibleTestCases, null, 2));

    if (visibleTestCases.length === 0) {
      console.warn("⚠️  No visible test cases found! Total test cases:", subtopic.codingChallenge.testCases.length);
      return res.status(400).json({
        error: "No visible test cases found",
        totalTestCases: subtopic.codingChallenge.testCases.length
      });
    }

    console.log("🚀 Calling Judge0 with language ID:", subtopic.codingChallenge.languageId);

    const { passed, total, outputs, testResults } = await runCodeOnJudge0(
      code,
      subtopic.codingChallenge.languageId,
      visibleTestCases
    );

    console.log("✅ Judge0 execution complete:", { passed, total });

    // Return execution results with detailed test case information
    res.json({
      executionOutput: `${passed}/${total} test cases passed`,
      passed,
      total,
      testResults: testResults || [], // Array of {input, expectedOutput, actualOutput, passed}
      visibleTestCases // Send back the visible test cases for display
    });

  } catch (err) {
    console.error("❌ Run Code Error:", err.message);
    console.error("❌ Full error:", err);
    console.error("❌ Stack trace:", err.stack);
    res.status(500).json({ 
      error: "Code execution failed",
      details: err.message,
      hint: "Check server logs for more details"
    });
  }
};

export const submitCode = async (req, res) => {
  try {
    const { roadmapIndex, topicIndex, subtopicIndex, code } = req.body;
    const user = await User.findById(req.userId);

    const subtopic =
      user.roadmaps[roadmapIndex]
        ?.topics[topicIndex]
        ?.subtopics[subtopicIndex];

    if (!subtopic?.codingChallenge?.problemStatement) {
      return res.status(400).json({ error: "No coding challenge" });
    }

    // Run code on ALL test cases (visible + hidden)
    const { passed, total } = await runCodeOnJudge0(
      code,
      subtopic.codingChallenge.languageId,
      subtopic.codingChallenge.testCases
    );

    // Calculate score for this submission
    const currentScore = Math.round((passed / total) * 60); // coding = 60%

    // Initialize or update submission data
    if (!subtopic.codingSubmission) {
      subtopic.codingSubmission = {
        recentCode: code,
        noOfSubmissions: 0,
        scoreForCode: 0,
        totalScore: 0,
        submissions: []
      };
    }

    // Ensure numeric fields are valid numbers
    if (typeof subtopic.codingSubmission.noOfSubmissions !== 'number' || isNaN(subtopic.codingSubmission.noOfSubmissions)) {
      subtopic.codingSubmission.noOfSubmissions = 0;
    }
    if (typeof subtopic.codingSubmission.totalScore !== 'number' || isNaN(subtopic.codingSubmission.totalScore)) {
      subtopic.codingSubmission.totalScore = 0;
    }
    if (typeof subtopic.codingSubmission.scoreForCode !== 'number' || isNaN(subtopic.codingSubmission.scoreForCode)) {
      subtopic.codingSubmission.scoreForCode = 0;
    }

    // Add this submission to history
    subtopic.codingSubmission.submissions = subtopic.codingSubmission.submissions || [];
    subtopic.codingSubmission.submissions.push({
      score: currentScore,
      passed,
      total,
      timestamp: new Date()
    });

    // Update submission count and calculate average
    subtopic.codingSubmission.noOfSubmissions += 1;
    subtopic.codingSubmission.totalScore += currentScore;
    subtopic.codingSubmission.scoreForCode = Math.round(
      subtopic.codingSubmission.totalScore / subtopic.codingSubmission.noOfSubmissions
    );
    subtopic.codingSubmission.recentCode = code;
    subtopic.codingSubmission.lastResult = {
      passed: passed === total,
      failedTestCases: total - passed
    };

    // Update subtopic score (use average score)
    const averageScore = subtopic.codingSubmission.scoreForCode;

    // Validate averageScore is a valid number
    if (typeof averageScore !== 'number' || isNaN(averageScore)) {
      console.error("❌ Invalid averageScore calculated:", averageScore);
      console.error("totalScore:", subtopic.codingSubmission.totalScore);
      console.error("noOfSubmissions:", subtopic.codingSubmission.noOfSubmissions);
      subtopic.score = 0;
    } else {
      subtopic.score = averageScore;
    }

    subtopic.status = "completed";

    // 🧠 Evaluation Agent
    const evaluation = await callEvaluationAgent(
      JSON.stringify({
        type: "code",
        problem: subtopic.codingChallenge.problemStatement,
        passed,
        total,
        attemptCount: subtopic.codingSubmission.noOfSubmissions
      }),
      "code-eval"
    );

    // Save coding results FIRST before updating skills
    await user.save();

    // 🎯 Track skills from coding challenge (only on first submission)
    if (subtopic.codingSubmission.noOfSubmissions === 1) {
      const rawSkills = subtopic.codingChallenge?.skills || [];

      console.log(`📊 Raw skills from coding challenge: ${rawSkills.join(', ')}`);

      if (rawSkills.length > 0) {
        const canonicalSkills = await mapToCanonicalSkills(rawSkills);

        if (canonicalSkills.length > 0) {
          const roadmap = user.roadmaps[roadmapIndex];
          await updateUserSkills({
            userId: req.userId,
            skills: canonicalSkills,
            score: averageScore,
            isCoding: true,
            level: roadmap.level || 'Beginner'
          });

          console.log(`✅ Updated ${canonicalSkills.length} skills for coding at ${roadmap.level} level: ${canonicalSkills.join(', ')}`);
        } else {
          console.log("⚠️  No canonical skills mapped from coding challenge");
        }
      } else {
        console.log("⚠️  No skills found in coding challenge");
      }
    }

    res.json({
      score: currentScore,
      averageScore: averageScore,
      submissionNumber: subtopic.codingSubmission.noOfSubmissions,
      feedback: evaluation.feedback,
      executionOutput: `${passed}/${total} test cases passed`,
      passed,
      total
    });

  } catch (err) {
    console.error("❌ Submit Code Error:", err.message);
    res.status(500).json({ error: "Code submission failed" });
  }
};

// Tutor
export const tutorTest = async (req, res) => {
  try {
    const message = req.query.message || "Explain arrays";
    const response = await callTutorAgent(message, "tutor-session");
    res.json({ agent: "Tutor Agent", response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const generateSubtopicContent = async (req, res) => {
  try {
    const userId = req.userId;
    const { roadmapIndex, topicIndex, subtopicIndex } = req.body;

    if (
      roadmapIndex === undefined ||
      topicIndex === undefined ||
      subtopicIndex === undefined
    ) {
      return res.status(400).json({ error: "Missing indices" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const roadmap = user.roadmaps[roadmapIndex];
    const topic = roadmap?.topics[topicIndex];
    const subtopic = topic?.subtopics[subtopicIndex];

    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // ⛔ Prevent regeneration
    if (subtopic.content?.theory) {
      return res.json({
        message: "Content already exists",
        content: subtopic.content,
        isCoding: subtopic.isCoding
      });
    }

    const prompt = `
You are an expert tutor creating clear, focused learning content.

TASK: GENERATE_SUBTOPIC_CONTENT

Subtopic: "${subtopic.title}"
Topic: "${topic.title}"
Level: "${roadmap.level}"

CRITICAL: Return your response in this EXACT format with these markers:

---THEORY---
[Your markdown content here - use actual newlines, not \\n]

## Overview
[1-2 sentence introduction]

## Key Concepts
- Concept 1: brief explanation
- Concept 2: brief explanation
- Concept 3: brief explanation

## Explanation
[2-3 paragraphs with clear examples]

## Example
\`\`\`
code example here
\`\`\`
Brief explanation of the example.

## Important Points
- Point 1
- Point 2
- Point 3

---YOUTUBE---
[YouTube search query - one line only]

---SKILLS---
[Comma-separated skills, e.g., recursion, iteration, algorithms]

---ISCODING---
[true or false - one word only]

REQUIREMENTS:
1. Keep content CONCISE (250-350 words)
2. Use actual newlines (not \\n)
3. Include 1-2 code examples maximum
4. Use markdown formatting (##, -, \`\`\`)

CODING DECISION:
- true: implementing algorithms, writing functions, coding exercises, practical tasks
- false: theoretical concepts, explanations, overviews, comparisons, history

EXAMPLE OUTPUT:

---THEORY---
## Overview
If statements allow programs to make decisions based on conditions.

## Key Concepts
- Conditional execution: code runs only when condition is true
- Boolean expressions: conditions that evaluate to true/false
- Code blocks: indented code that runs conditionally

## Explanation
An if statement evaluates a condition and executes code only if the condition is true. This is fundamental for creating dynamic programs that respond to different inputs.

## Example
\`\`\`python
age = 18
if age >= 18:
    print('Adult')
\`\`\`
This checks if age is 18 or more and prints 'Adult' if true.

## Important Points
- Conditions must be boolean
- Indentation matters in Python
- Use comparison operators (==, !=, <, >, <=, >=)

---YOUTUBE---
if statements programming tutorial

---SKILLS---
conditionals, control_flow, boolean_logic

---ISCODING---
true
`;

    const agentResponse = await callTutorAgent(
      prompt,
      "tutor-content-session"
    );

    console.log("📝 Tutor Agent Response:", agentResponse);

    // Parse structured text format instead of JSON
    let parsed;
    try {
      // Extract sections using markers
      const theoryMatch = agentResponse.match(/---THEORY---([\s\S]*?)---YOUTUBE---/);
      const youtubeMatch = agentResponse.match(/---YOUTUBE---([\s\S]*?)---SKILLS---/);
      const skillsMatch = agentResponse.match(/---SKILLS---([\s\S]*?)---ISCODING---/);
      const isCodingMatch = agentResponse.match(/---ISCODING---([\s\S]*?)$/);

      if (!theoryMatch || !youtubeMatch || !skillsMatch || !isCodingMatch) {
        throw new Error("Could not find all required sections in response");
      }

      // Extract and clean content
      const theory = theoryMatch[1].trim();
      const youtubeQuery = youtubeMatch[1].trim();
      const skillsText = skillsMatch[1].trim();
      const isCodingText = isCodingMatch[1].trim().toLowerCase();

      // Parse skills (comma-separated)
      const skills = skillsText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse isCoding (true/false)
      const isCoding = isCodingText === 'true';

      parsed = {
        theory,
        youtubeQuery,
        skills,
        isCoding
      };

      console.log("✅ Parsed structured text response");
      console.log(`   Theory length: ${theory.length} chars`);
      console.log(`   YouTube query: ${youtubeQuery}`);
      console.log(`   Skills: ${skills.join(', ')}`);
      console.log(`   isCoding: ${isCoding}`);

    } catch (err) {
      console.error("❌ Failed to parse structured text:", err.message);

      // Fallback: try to extract what we can
      try {
        console.log("🔧 Attempting fallback extraction...");

        // Try to find theory section
        let theory = "";
        const theoryStart = agentResponse.indexOf("---THEORY---");
        if (theoryStart !== -1) {
          const theoryContent = agentResponse.substring(theoryStart + 12);
          const theoryEnd = theoryContent.search(/---[A-Z]+---/);
          theory = theoryEnd !== -1 ? theoryContent.substring(0, theoryEnd).trim() : theoryContent.trim();
        }

        // Try to find youtube query
        let youtubeQuery = `${subtopic.title} tutorial`;
        const youtubeStart = agentResponse.indexOf("---YOUTUBE---");
        if (youtubeStart !== -1) {
          const youtubeContent = agentResponse.substring(youtubeStart + 13);
          const youtubeEnd = youtubeContent.search(/---[A-Z]+---/);
          const extracted = youtubeEnd !== -1 ? youtubeContent.substring(0, youtubeEnd).trim() : youtubeContent.trim();
          if (extracted) youtubeQuery = extracted;
        }

        // Try to find skills
        let skills = [];
        const skillsStart = agentResponse.indexOf("---SKILLS---");
        if (skillsStart !== -1) {
          const skillsContent = agentResponse.substring(skillsStart + 12);
          const skillsEnd = skillsContent.search(/---[A-Z]+---/);
          const extracted = skillsEnd !== -1 ? skillsContent.substring(0, skillsEnd).trim() : skillsContent.trim();
          if (extracted) {
            skills = extracted.split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        }

        // Try to find isCoding
        let isCoding = false;
        const isCodingStart = agentResponse.indexOf("---ISCODING---");
        if (isCodingStart !== -1) {
          const isCodingContent = agentResponse.substring(isCodingStart + 14).trim().toLowerCase();
          isCoding = isCodingContent.startsWith('true');
        }

        if (theory) {
          parsed = { theory, youtubeQuery, skills, isCoding };
          console.log("✅ Fallback extraction successful");
        } else {
          throw new Error("Could not extract theory content");
        }

      } catch (fallbackErr) {
        console.error("❌ Fallback extraction failed:", fallbackErr.message);
        return res.status(500).json({
          error: "Failed to parse agent response"
        });
      }
    }

    // Determine isCoding with keyword detection (primary method)
    const implementationKeywords = [
      'implement',
      'build',
      'write',
      'algorithm',
      'function',
      'program',
      'code',
      'create',
      'develop',
      // DSA-specific keywords
      'array',
      'linked list',
      'stack',
      'queue',
      'tree',
      'graph',
      'hash',
      'sort',
      'search',
      'recursion',
      'dynamic programming',
      'greedy',
      'backtrack',
      'heap',
      'trie',
      'binary',
      'dsa',
      'data structure'
    ];

    const lowerTitle = subtopic.title.toLowerCase();
    const lowerTopic = topic.title.toLowerCase();
    const combinedText = `${lowerTitle} ${lowerTopic}`;

    // Check keywords in both subtopic and topic titles
    const hasKeyword = implementationKeywords.some(k => combinedText.includes(k));

    let isCoding;
    if (hasKeyword) {
      // Keyword detection takes priority
      isCoding = true;
      console.log(`🔍 Keyword detection: "${subtopic.title}" (Topic: "${topic.title}") → isCoding=true`);
    } else {
      // Fall back to agent decision
      isCoding = parsed.isCoding === true;
      console.log(`🤖 Agent decision: "${subtopic.title}" → isCoding=${isCoding}`);
    }

    // Store isCoding flag
    subtopic.isCoding = isCoding;

    subtopic.content = {
      theory: parsed.theory,
      youtubeQuery: parsed.youtubeQuery,
      skills: parsed.skills || []
    };

    await user.save();

    res.json({
      message: "Subtopic content generated",
      content: subtopic.content,
      isCoding: subtopic.isCoding
    });

  } catch (err) {
    console.error("❌ Subtopic Content Error:", err.message);
    res.status(500).json({ error: "Failed to generate content" });
  }
};
export const decideCodingRequirement = async (req, res) => {
  try {
    const { roadmapIndex, topicIndex, subtopicIndex } = req.body;

    const user = await User.findById(req.userId);

    const subtopic =
      user.roadmaps[roadmapIndex]
        ?.topics[topicIndex]
        ?.subtopics[subtopicIndex];

    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // 🔥 Deterministic rule first
    const alwaysCodingKeywords = [
      "implement",
      "build",
      "write",
      "algorithm",
      "function",
      "program"
    ];

    const lowerTitle = subtopic.title.toLowerCase();

    if (alwaysCodingKeywords.some(k => lowerTitle.includes(k))) {
      subtopic.isCoding = true;
      await user.save();
      return res.json({ isCoding: true });
    }

    // 🧠 Ask Agent
    const prompt = `
You are an expert programming tutor.

Subtopic: "${subtopic.title}"

Return ONLY valid JSON:

{
  "requiresCoding": true | false
}
`;

    const response = await callTutorAgent(prompt, "coding-decision");

    const parsed = JSON.parse(response);

    subtopic.isCoding = parsed.requiresCoding === true;

    await user.save();

    res.json({ isCoding: subtopic.isCoding });

  } catch (err) {
    res.status(500).json({ error: "Failed to decide coding requirement" });
  }
};
// 🗑️ DELETE ROADMAP
export const deleteRoadmap = async (req, res) => {
  try {
    const userId = req.userId;
    const { roadmapIndex } = req.body;

    if (roadmapIndex === undefined) {
      return res.status(400).json({ error: "roadmapIndex is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.roadmaps[roadmapIndex]) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    // 🧹 Remove roadmap
    user.roadmaps.splice(roadmapIndex, 1);

    await user.save();

    res.json({
      message: "Roadmap deleted successfully"
    });
  } catch (err) {
    console.error("❌ Delete Roadmap Error:", err.message);
    res.status(500).json({ error: "Failed to delete roadmap" });
  }
};


export const getMySkills = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      skills: user.globalSkills
    });
  } catch (err) {
    console.error("❌ Fetch skills error:", err.message);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};


/* ---------------- GENERATE SUBTOPICS ---------------- */
export const generateSubtopics = async (req, res) => {
  try {
    const userId = req.userId;
    const { roadmapIndex, topicIndex } = req.body;


    if (roadmapIndex === undefined || topicIndex === undefined) {
      return res.status(400).json({ error: "Missing roadmapIndex or topicIndex" });
    }


    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const roadmap = user.roadmaps[roadmapIndex];
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    const topic = roadmap.topics[topicIndex];
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }


    // ⛔ Prevent regeneration
    if (topic.subtopics.length > 0) {
      return res.json({
        message: "Subtopics already exist",
        subtopics: topic.subtopics
      });
    }

    // 🧠 Ask Tutor Agent
    const prompt = `
    You are an expert tutor.

    TASK: GENERATE_SUBTOPICS

    Topic: "${topic.title}"
    Level: "${roadmap.level}"

    STRICT RULES:
    - Return ONLY a numbered list
    - 6 to 10 subtopics
    - One subtopic per line
    - NO explanations
    - NO markdown
    - NO headings
    - NO extra text

    Example output format:
    1. Introduction to arrays
    2. Memory layout of arrays
    3. Array traversal techniques
    4. Common array operations
    5. Time complexity of array operations
    `;

    const agentResponse = await callTutorAgent(
      prompt,
      "tutor-subtopic-session"
    );


    // 🧼 Convert text → array
    const lines = agentResponse
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const subtopics = lines.map((line, index) => ({
      title: line.replace(/^\d+[\).\s]*/, ""),
      status: index === 0 ? "unlocked" : "locked",
      content: {},
      quizzes: [],
      quizAttempts: [],
      isCoding: false,
      score: 0
    }));

    topic.subtopics = subtopics;
    await user.save();

    res.json({
      message: "Subtopics generated",
      subtopics: topic.subtopics
    });


  } catch (err) {
    console.error("❌ Generate Subtopics Error:", err.message);
    res.status(500).json({ error: "Failed to generate subtopics" });
  }
};
// GET USER ROADMAPS
/* ---------------- GET MY SUBTOPICS ---------------- */
export const getMySubtopics = async (req, res) => {
  try {
    const userId = req.userId;
    const { roadmapIndex, topicIndex } = req.query;

    if (roadmapIndex === undefined || topicIndex === undefined) {
      return res.status(400).json({
        error: "Missing roadmapIndex or topicIndex"
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const roadmap = user.roadmaps[roadmapIndex];
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    const topic = roadmap.topics[topicIndex];
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    res.json({
      subtopics: topic.subtopics || []
    });

  } catch (err) {
    console.error("❌ Get Subtopics Error:", err.message);
    res.status(500).json({ error: "Failed to fetch subtopics" });
  }
};

export const getMyRoadmaps = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      roadmaps: user.roadmaps
    });
  } catch (err) {
    console.error("❌ Fetch Roadmaps Error:", err.message);
    res.status(500).json({ error: "Failed to fetch roadmaps" });
  }
};


export const submitQuiz = async (req, res) => {
  try {
    const userId = req.userId;
    const { roadmapIndex, topicIndex, subtopicIndex, answers } = req.body;
    const user = await User.findById(userId);

    const subtopic =
      user.roadmaps[roadmapIndex]
        ?.topics[topicIndex]
        ?.subtopics[subtopicIndex];

    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // Initialize quizAttempts if undefined
    if (!subtopic.quizAttempts) {
      subtopic.quizAttempts = [];
    }

    if (subtopic.quizAttempts.length > 0) {
      return res.status(403).json({ error: "Quiz already attempted" });
    }

    let totalScore = 0;
    const attempts = [];

    for (let i = 0; i < subtopic.quizzes.length; i++) {
      const quiz = subtopic.quizzes[i];
      const selected = answers[i];
      const isCorrect = selected === quiz.correctOptionIndex;

      const score = isCorrect ? 10 : 0;
      totalScore += score;

      attempts.push({
        quizIndex: i,
        selectedOptionIndex: selected,
        isCorrect,
        score,
        attemptedAt: new Date()
      });
    }

    // ✅ Normalize AFTER loop
    const maxScore = subtopic.quizzes.length * 10;
    const normalizedScore = Math.round(
      (totalScore / maxScore) * 100
    );

    const evaluation = await callEvaluationAgent(
      JSON.stringify({
        type: "quiz",
        subtopic: subtopic.title,
        totalQuestions: subtopic.quizzes.length,
        correct: attempts.filter(a => a.isCorrect).length,
        attempts
      }),
      "quiz-eval"
    );

    subtopic.quizAttempts = attempts;
    subtopic.score = normalizedScore;

    // Save quiz results FIRST before updating skills
    await user.save();

    const rawSkills = subtopic.quizzes.flatMap(
      q => q.skillsTested || []
    );

    console.log(`📊 Raw skills from quizzes: ${rawSkills.join(', ')}`);

    const canonicalSkills = await mapToCanonicalSkills(rawSkills);

    console.log(`📊 Canonical skills: ${canonicalSkills.join(', ')}`);

    if (canonicalSkills.length > 0) {
      const roadmap = user.roadmaps[roadmapIndex];
      await updateUserSkills({
        userId,
        skills: canonicalSkills,
        score: normalizedScore,
        isCoding: false,
        level: roadmap.level || 'Beginner' // Pass roadmap level
      });

      console.log(`✅ Updated skills for quiz at ${roadmap.level} level: ${canonicalSkills.join(', ')}`);
    } else {
      console.log("⚠️  No skills found in quizzes");
    }

    res.json({
      score: normalizedScore,
      feedback: evaluation.feedback
    });

  } catch (err) {
    console.error("❌ Quiz submission error:", err.message);
    res.status(500).json({ error: "Quiz submission failed" });
  }
};



/* ---------------- SUBMIT CODE ---------------- */



// Curriculum
export const curriculumTest = async (req, res) => {
  try {
    const subject = req.query.subject || "Data Structures";
    const level = req.query.level || "Beginner";

    const response = await callCurriculumAgent(
      JSON.stringify({
        task: "GENERATE_ROADMAP",
        subject,
        level
      }),
      "curriculum-session"
    );


    res.json({
      agent: "Curriculum Agent",
      roadmap: response
    });
  } catch (err) {
    console.error("Curriculum Agent Error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const createRoadmap = async (req, res) => {
  try {
    const { subject: userTopicInput, level, goals } = req.body;
    const user = await User.findById(req.userId);

    console.log(`\n🎯 Creating roadmap for: "${userTopicInput}"`);
    console.log(`📊 User: ${user.email || user.userId}`);
    console.log(`📈 Level: ${level}`);
    console.log(`🎯 Goals: ${goals}`);

    // 🔹 Detect language from subject
    const languageMap = {
      python: { name: "Python", id: 71 },
      javascript: { name: "JavaScript", id: 63 },
      java: { name: "Java", id: 62 },
      "c++": { name: "C++", id: 54 },
      c: { name: "C", id: 50 }
    };

    let detectedLanguage = null;
    let detectedLanguageId = null;

    const lower = userTopicInput.toLowerCase();

    for (const key in languageMap) {
      if (lower.includes(key)) {
        detectedLanguage = languageMap[key].name;
        detectedLanguageId = languageMap[key].id;
        break;
      }
    }

    // 1️⃣ Map user topic to canonical skill
    console.log(`\n🔄 Step 1: Mapping topic to canonical skill...`);
    const mappedSkillId = await mapUserTopicToCanonicalSkill(userTopicInput);

    let skillPath = [];
    let metadata = {
      userInput: userTopicInput,
      mappedSkill: mappedSkillId,
      prerequisitesIncluded: [],
      prerequisitesSkipped: [],
      usedSmartResolution: false,
      reasoning: ""
    };

    if (!mappedSkillId) {
      // ❌ Could not map to canonical skill - generate basic curriculum
      console.log(`\n⚠️  Could not map "${userTopicInput}" to canonical skill`);
      console.log(`📝 Generating basic curriculum without prerequisites (6-8 topics)`);

      metadata.reasoning = "Topic could not be mapped to skill graph. Generated basic curriculum without prerequisite checking.";

      // Generate 6-8 topics using Curriculum Agent
      try {
        const curriculumPrompt = `
You are an expert curriculum designer.

TASK: GENERATE_TOPIC_LIST

Subject: "${userTopicInput}"
Level: "${level}"
Goals: "${goals || 'General learning'}"

STRICT RULES:
- Return ONLY a numbered list
- Generate 6 to 8 topics
- One topic per line
- NO explanations
- NO markdown
- NO headings
- NO extra text
- Topics should progress from basics to advanced

Example output format:
1. Introduction to ${userTopicInput}
2. Core concepts
3. Practical applications
4. Advanced techniques
`;

        const agentResponse = await callTutorAgent(curriculumPrompt, "curriculum-generation");

        // Parse response into topic names
        const lines = agentResponse
          .split("\n")
          .map(l => l.trim())
          .filter(Boolean);

        skillPath = lines.map(line => line.replace(/^\d+[\).\s]*/, ""));

        console.log(`✅ Generated ${skillPath.length} topics from Curriculum Agent`);

      } catch (err) {
        console.error("❌ Failed to generate curriculum:", err.message);
        // Fallback: use user input as single topic
        skillPath = [userTopicInput];
      }

    } else {
      // ✅ Successfully mapped - use smart prerequisite resolution
      console.log(`\n✅ Mapped to canonical skill: "${mappedSkillId}"`);
      console.log(`\n🔄 Step 2: Smart prerequisite resolution...`);

      const resolution = smartResolvePrerequisites(mappedSkillId, user);

      skillPath = resolution.orderedSkills;
      metadata.mappedSkill = mappedSkillId;
      metadata.prerequisitesIncluded = resolution.includedSkills;
      metadata.prerequisitesSkipped = resolution.skippedSkills;
      metadata.usedSmartResolution = true;

      if (resolution.skippedSkills.length > 0) {
        metadata.reasoning = `User is proficient in ${resolution.skippedSkills.length} prerequisite(s): ${resolution.skippedSkills.map(formatSkillForDisplay).join(', ')}. These were skipped.`;
      } else if (resolution.includedSkills.length > 0) {
        metadata.reasoning = `User needs to learn ${resolution.includedSkills.length} prerequisite(s) before ${formatSkillForDisplay(mappedSkillId)}.`;
      } else {
        metadata.reasoning = `User can start learning ${formatSkillForDisplay(mappedSkillId)} directly (no prerequisites needed).`;
      }

      console.log(`\n📊 Resolution Summary:`);
      console.log(`  📚 Total skills in path: ${skillPath.length}`);
      console.log(`  ✅ Prerequisites skipped: ${resolution.skippedSkills.length}`);
      console.log(`  📖 Prerequisites included: ${resolution.includedSkills.length}`);
    }

    // 2️⃣ Convert skills → topics
    console.log(`\n🔄 Step 3: Converting skills to topics...`);
    const topics = skillPath.map((skill, i) => ({
      title: formatSkillForDisplay(skill),
      description: `Learn ${formatSkillForDisplay(skill)}`,
      status: i === 0 ? "unlocked" : "locked",
      subtopics: []
    }));

    console.log(`✅ Created ${topics.length} topics`);

    // 3️⃣ Create roadmap
    const roadmap = {
      subject: userTopicInput,
      level,
      goals,
      language: detectedLanguage,
      languageId: detectedLanguageId,
      progress: 0,
      topics,
      metadata // Store metadata for debugging/display
    };

    user.roadmaps.push(roadmap);
    await user.save();

    console.log(`\n✅ Roadmap created successfully!`);
    console.log(`📋 Reasoning: ${metadata.reasoning}\n`);

    res.json({
      roadmap: user.roadmaps.at(-1),
      metadata
    });

  } catch (err) {
    console.error("❌ Create roadmap error:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Failed to create adaptive roadmap" });
  }
};


export const generateQuizzes = async (req, res) => {
  try {
    const { roadmapIndex, topicIndex, subtopicIndex } = req.body;

    // 🔒 Validate input
    if (
      roadmapIndex === undefined ||
      topicIndex === undefined ||
      subtopicIndex === undefined
    ) {
      return res.status(400).json({ error: "Missing indexes" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subtopic =
      user.roadmaps[roadmapIndex]
        ?.topics[topicIndex]
        ?.subtopics[subtopicIndex];

    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found" });
    }

    // ⛔ Prevent regeneration
    if (subtopic.quizzes.length > 0) {
      return res.json({ quizzes: subtopic.quizzes });
    }

    // 🧠 Tutor Agent Prompt
    const prompt = `
You are an expert tutor.

TASK: GENERATE_QUIZ

Subtopic: "${subtopic.title}"

STRICT OUTPUT FORMAT (MANDATORY):

Q<number>: <question text>
CODE: <code snippet if question asks about code output, otherwise leave blank>
A) <option A>
B) <option B>
C) <option C>
D) <option D>
ANSWER: <A|B|C|D>
EXPLANATION: <single sentence>
SKILLS: <comma separated skills>

CRITICAL RULES:
- Generate 3 to 5 questions
- Questions must test understanding, not recall
- If question asks "What will be the output of the following code snippet?", you MUST include the actual code snippet on the CODE: line
- If you cannot provide a code snippet, DO NOT create questions that reference code
- Code snippets should be simple, clear, and relevant to the subtopic (1-5 lines maximum)
- Leave CODE: line blank if question doesn't involve code
- NEVER reference "the following code snippet" without providing actual code
- Do NOT add any extra text
- Do NOT use JSON
- Do NOT use markdown code blocks
- Separate questions with ONE blank line

EXAMPLE WITH CODE:
Q1: What will be the output of the following code snippet?
CODE: x = 5; y = 2; print(x % y)
A) 0
B) 1
C) 2
D) 5
ANSWER: B
EXPLANATION: The modulo operator returns the remainder of division, 5 % 2 = 1
SKILLS: operators, modulo

EXAMPLE WITHOUT CODE:
Q2: What is the time complexity of binary search?
CODE: 
A) O(n)
B) O(log n)
C) O(n^2)
D) O(1)
ANSWER: B
EXPLANATION: Binary search divides the search space in half each time
SKILLS: time_complexity, binary_search

BAD EXAMPLE (DO NOT DO THIS):
Q1: What will be the output of the following code snippet?
CODE: 
A) 0
B) 1
ANSWER: B
EXPLANATION: Wrong
SKILLS: operators

^ BAD: Question references code but CODE: line is empty!
`;

    const agentResponse = await callTutorAgent(
      prompt,
      "quiz-generation"
    );

    if (!agentResponse || agentResponse.length < 10) {
      throw new Error("Empty or invalid response from Tutor Agent");
    }

    console.log("📄 Raw quiz agent response (first 400 chars):", agentResponse.substring(0, 400));

    // 🔍 Deterministic parsing
    const quizzes = parseQuizText(agentResponse);

    subtopic.quizzes = quizzes;
    await user.save();


    res.json({ quizzes });

  } catch (err) {
    console.error("❌ Quiz generation error:", err.message);
    res.status(500).json({ error: "Failed to generate quizzes" });
  }
};


// Evaluation
export const evaluationTest = async (req, res) => {
  try {
    const answer = req.query.answer || "User answer here";
    const response = await callEvaluationAgent(
      `Evaluate this answer: ${answer}`,
      "evaluation-session"
    );
    res.json({ agent: "Evaluation Agent", response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Chatbot for coding assistance
export const chatWithBot = async (req, res) => {
  try {
    const { message, sessionId, problemContext, userCode } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const reply = await callChatbotAgent(
      message,
      sessionId || `chat-${Date.now()}`,
      problemContext,
      userCode || null
    );

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chatbot error:", err.message);
    res.status(500).json({ error: "Chatbot failed" });
  }
};

// Learning Assistant for theory and quiz pages
export const chatWithLearningAssistant = async (req, res) => {
  try {
    const { message, sessionId, learningContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Validate learning context
    if (!learningContext || !learningContext.subtopicTitle || !learningContext.currentPage) {
      return res.status(400).json({
        error: "Learning context required (subtopicTitle, currentPage)"
      });
    }

    const reply = await callLearningAssistantAgent(
      message,
      sessionId || `learning-${Date.now()}`,
      learningContext
    );

    res.json({ reply });
  } catch (err) {
    console.error("❌ Learning Assistant error:", err.message);
    res.status(500).json({ error: "Learning Assistant failed" });
  }
};
