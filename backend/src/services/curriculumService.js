import { callCurriculumAgent } from "../agents/curriculumAgent.js";

/**
 * Generates a roadmap using Curriculum Agent
 * Returns structured topics array
 */
export const generateRoadmapWithAgent = async (
  subject,
  level,
  goals = ""
) => {
  const prompt = `
You are an expert curriculum designer.

TASK: GENERATE_ROADMAP

Subject: "${subject}"
Level: "${level}"
${goals ? `User Goals / Focus: "${goals}"` : ""}

STRICT RULES:
- Return ONLY a numbered list of topics
- 8–12 topics
- No explanations
- No markdown
- One topic per line
`;

  return await callCurriculumAgent(prompt, "curriculum-roadmap");
};
