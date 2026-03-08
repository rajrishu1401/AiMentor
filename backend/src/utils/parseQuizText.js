/**
 * Robust quiz text parser.
 * Handles multiple formats that the Tutor Agent may return:
 *
 *  Format A (strict):
 *    Q1: question text
 *    A) option A
 *    ANSWER: A
 *
 *  Format B (numbered with dot):
 *    1. question text
 *    a) option A
 *    Answer: A
 *
 *  Format C (Question: prefix):
 *    Question 1: question text
 *    (A) option A
 *    Correct Answer: A
 *
 *  Format D (JSON array):
 *    [{ "question": "...", "options": [...], "correctAnswer": 0 }]
 */
export const parseQuizText = (text) => {
  if (!text || text.trim().length === 0) {
    throw new Error("No valid quiz questions generated");
  }

  // ── Try JSON first ─────────────────────────────────────────────────────────
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const quizzes = parsed
          .map(q => {
            if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) return null;
            const idx =
              typeof q.correctAnswer === "number"
                ? q.correctAnswer
                : typeof q.correctAnswer === "string"
                  ? ["A", "B", "C", "D"].indexOf(q.correctAnswer.toUpperCase())
                  : q.correctOptionIndex ?? 0;
            return {
              question: q.question,
              options: q.options,
              correctOptionIndex: idx,
              explanation: q.explanation || "Explanation unavailable.",
              skillsTested: Array.isArray(q.skills) ? q.skills : []
            };
          })
          .filter(Boolean);
        if (quizzes.length > 0) return quizzes;
      }
    }
  } catch (_) { /* fall through to text parsing */ }

  // ── Normalise text ─────────────────────────────────────────────────────────
  // Strip markdown code fences and clean up
  const cleaned = text
    .replace(/```[\w]*\n?/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();

  // ── Detect question boundaries ────────────────────────────────────────────
  // Matches: Q1:  |  Q1.  |  1.  |  1)  |  Question 1:  |  Question 1.
  const questionBoundary = /(?:^|\n)(?:Q\s*\d+[:.)]|Question\s*\d+[:.)]|\d+[.)]\s)/gi;
  const boundaryMatches = [...cleaned.matchAll(questionBoundary)];

  if (boundaryMatches.length === 0) {
    console.warn("⚠️ No questions found in text. Raw response snippet:", text.substring(0, 200));
    throw new Error("No valid quiz questions generated");
  }

  const quizzes = [];

  for (let i = 0; i < boundaryMatches.length; i++) {
    const startIndex = boundaryMatches[i].index;
    const endIndex = i < boundaryMatches.length - 1 ? boundaryMatches[i + 1].index : cleaned.length;
    const block = cleaned.substring(startIndex, endIndex).trim();
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    if (lines.length < 3) continue; // too short to be a real question

    // ─── Extract question text ───────────────────────────────────────────────
    // Remove the leading Q1: / 1. / Question 1: prefix
    const firstLine = lines[0];
    const questionRaw = firstLine
      .replace(/^(?:Q\s*\d+[:.)]|Question\s*\d+[:.)]|\d+[.)]\s*)/i, "")
      .trim();

    if (!questionRaw) continue;

    // ─── Extract CODE line (optional) ────────────────────────────────────────
    const codeLine = lines.find(l => /^CODE:/i.test(l));
    const codeSnippet = codeLine ? codeLine.replace(/^CODE:\s*/i, "").trim() : "";

    let question = questionRaw;
    if (codeSnippet) {
      question += `\n\n\`\`\`\n${codeSnippet}\n\`\`\``;
    }

    // ─── Extract options ─────────────────────────────────────────────────────
    // Accepts: A) B) C) D)  |  (A) (B)  |  A. B.  |  a. b.
    const optionLines = lines.filter(l =>
      /^[A-Da-d][).]\s/.test(l) || /^\([A-Da-d]\)\s/.test(l)
    );

    if (optionLines.length < 4) {
      console.warn("⚠️ Skipping block — only", optionLines.length, "options found:", block.substring(0, 80));
      continue;
    }

    const options = optionLines.slice(0, 4).map(l =>
      l.replace(/^[(\s]*[A-Da-d][).]\s*/i, "").trim()
    );

    // ─── Extract ANSWER ───────────────────────────────────────────────────────
    // Accepts: ANSWER: A  |  Correct Answer: A  |  Answer: A  |  Correct: A
    const answerLine = lines.find(l =>
      /^(?:correct\s*answer|answer|correct)[:\s]+[A-Da-d]/i.test(l)
    );

    if (!answerLine) {
      console.warn("⚠️ Skipping block — no answer line found:", block.substring(0, 80));
      continue;
    }

    const correctLetter = answerLine
      .replace(/^(?:correct\s*answer|answer|correct)[:\s]+/i, "")
      .trim()
      .charAt(0)
      .toUpperCase();

    const correctOptionIndex = ["A", "B", "C", "D"].indexOf(correctLetter);
    if (correctOptionIndex === -1) {
      console.warn("⚠️ Invalid answer letter:", correctLetter);
      continue;
    }

    // ─── Extract EXPLANATION (optional) ──────────────────────────────────────
    const explanationLine = lines.find(l => /^EXPLANATION:/i.test(l));
    const explanation = explanationLine
      ? explanationLine.replace(/^EXPLANATION:\s*/i, "").trim()
      : "Review the correct answer above.";

    // ─── Extract SKILLS (optional) ───────────────────────────────────────────
    const skillsLine = lines.find(l => /^SKILLS:/i.test(l));
    const skillsTested = skillsLine
      ? skillsLine.replace(/^SKILLS:\s*/i, "").split(",").map(s => s.trim()).filter(Boolean)
      : [];

    quizzes.push({ question, options, correctOptionIndex, explanation, skillsTested });
  }

  if (quizzes.length === 0) {
    console.warn("⚠️ parseQuizText: all blocks were malformed. Raw text:\n", text.substring(0, 500));
    throw new Error("No valid quiz questions generated");
  }

  return quizzes;
};
