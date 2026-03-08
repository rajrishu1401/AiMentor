import pkg from "@aws-sdk/client-bedrock-agent-runtime";
import { agentClient } from "../services/agentClient.js";

const { InvokeAgentCommand } = pkg;

export async function callTutorAgent(input, sessionId) {
  const command = new InvokeAgentCommand({
    agentId: process.env.TUTOR_AGENT_ID,
    agentAliasId: process.env.TUTOR_AGENT_ALIAS,
    sessionId,
    inputText: input
  });

  const response = await agentClient.send(command);

  let completion = "";
  for await (const event of response.completion) {
    if (event.chunk?.bytes) {
      completion += Buffer.from(event.chunk.bytes).toString("utf-8");
    }
  }

  return completion;
}
