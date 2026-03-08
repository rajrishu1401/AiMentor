import pkg from "@aws-sdk/client-bedrock-agent-runtime";

const { BedrockAgentRuntimeClient } = pkg;

export const agentClient = new  BedrockAgentRuntimeClient({
  region: "ap-south-1"
});
