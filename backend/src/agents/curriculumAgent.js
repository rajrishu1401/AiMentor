import pkg from "@aws-sdk/client-bedrock-agent-runtime";
import { agentClient } from "../services/agentClient.js";

const { InvokeAgentCommand } = pkg;

export async function callCurriculumAgent(input, sessionId) {
  const command = new InvokeAgentCommand({
    agentId: process.env.CURRICULUM_AGENT_ID,
    agentAliasId: process.env.CURRICULUM_AGENT_ALIAS,
    sessionId,
    inputText: input
  });

  const response = await agentClient.send(command);

  let output = "";
  for await (const event of response.completion) {
    if (event.chunk?.bytes) {
      output += Buffer.from(event.chunk.bytes).toString("utf-8");
    }
  }

  return output;
}
