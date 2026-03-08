import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION
});

export const callSkillMappingAgent = async (input, sessionId) => {
  const command = new InvokeAgentCommand({
    agentId: process.env.SKILL_MAPPING_AGENT_ID,
    agentAliasId: process.env.SKILL_MAPPING_AGENT_ALIAS,
    sessionId,
    inputText: input
  });

  const response = await client.send(command);

  let output = "";
  for await (const chunk of response.completion) {
    output += chunk.chunk?.bytes
      ? Buffer.from(chunk.chunk.bytes).toString("utf-8")
      : "";
  }

  return output.trim();
};
