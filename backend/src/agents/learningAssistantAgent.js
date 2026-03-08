import pkg from "@aws-sdk/client-bedrock-agent-runtime";
import { agentClient } from "../services/agentClient.js";

const { InvokeAgentCommand } = pkg;

// Simple memory store (per session)
const chatMemory = {};

/**
 * Learning Assistant Agent - Helps users understand theory and quiz questions
 * @param {string} message - User's question
 * @param {string} sessionId - Unique session identifier
 * @param {object} learningContext - Context about current lesson/quiz
 * @returns {Promise<string>} - AI response
 */
export async function callLearningAssistantAgent(
  message, 
  sessionId = "default", 
  learningContext = null
) {
  // Create memory if not exists
  if (!chatMemory[sessionId]) {
    chatMemory[sessionId] = [];
  }

  // Add user message to memory
  chatMemory[sessionId].push(`User: ${message}`);

  // Keep last 8 messages only (more context for learning)
  const history = chatMemory[sessionId].slice(-8).join("\n");

  // Build context-aware prompt
  let contextPrompt = "";
  
  if (learningContext) {
    const { subtopicTitle, theory, quizzes, currentPage } = learningContext;
    
    contextPrompt = `
Current Learning Context:
- Topic: ${subtopicTitle}
- Page: ${currentPage} (theory or quiz)

`;

    // Add theory context if available
    if (theory && currentPage === 'theory') {
      // Truncate theory to first 1000 chars to avoid token limits
      const truncatedTheory = theory.length > 1000 
        ? theory.substring(0, 1000) + "..." 
        : theory;
      
      contextPrompt += `
Theory Content (summary):
${truncatedTheory}

`;
    }

    // Add quiz context if available
    if (quizzes && quizzes.length > 0 && currentPage === 'quiz') {
      contextPrompt += `
Quiz Questions:
${quizzes.map((q, i) => `
Q${i + 1}: ${q.question}
Options: ${q.options.join(', ')}
`).join('\n')}

`;
    }
  }

  const finalPrompt = `${contextPrompt}Previous conversation:
${history}

User: ${message}
AI:`;

  const command = new InvokeAgentCommand({
    agentId: process.env.LEARNING_ASSISTANT_AGENT_ID,
    agentAliasId: process.env.LEARNING_ASSISTANT_AGENT_ALIAS,
    sessionId: sessionId,
    inputText: finalPrompt,
  });

  const response = await agentClient.send(command);

  let answer = "";
  for await (const event of response.completion) {
    if (event.chunk?.bytes) {
      answer += Buffer.from(event.chunk.bytes).toString("utf-8");
    }
  }

  // Store AI reply
  chatMemory[sessionId].push(`AI: ${answer}`);

  return answer;
}

// Clear memory for a session
export function clearLearningAssistantMemory(sessionId) {
  delete chatMemory[sessionId];
}
