import pkg from "@aws-sdk/client-bedrock-agent-runtime";
import { agentClient } from "../services/agentClient.js";

const { InvokeAgentCommand } = pkg;

// Simple memory store (per session)
const chatMemory = {};

export async function callChatbotAgent(message, sessionId = "default", problemContext = null, userCode = null) {
  // Create memory if not exists
  if (!chatMemory[sessionId]) {
    chatMemory[sessionId] = [];
  }

  // Add user message to memory
  chatMemory[sessionId].push(`User: ${message}`);

  // Keep last 6 messages only
  const history = chatMemory[sessionId].slice(-6).join("\n");

  // Build context-aware prompt
  let contextPrompt = "";
  if (problemContext) {
    contextPrompt = `
Current Problem Context:
- Title: ${problemContext.title}
- Description: ${problemContext.description}
- Hint: ${problemContext.hint || 'No hint available'}

`;
  }

  // Add user's current code to context
  let codeContext = "";
  if (userCode && userCode.trim()) {
    codeContext = `
User's Current Code:
\`\`\`
${userCode}
\`\`\`

`;
  }

  const finalPrompt = `${contextPrompt}${codeContext}Previous conversation:
${history}

User: ${message}
AI:`;

  const command = new InvokeAgentCommand({
    agentId: process.env.CHATBOT_AGENT_ID,
    agentAliasId: process.env.CHATBOT_AGENT_ALIAS,
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
export function clearChatMemory(sessionId) {
  delete chatMemory[sessionId];
}
