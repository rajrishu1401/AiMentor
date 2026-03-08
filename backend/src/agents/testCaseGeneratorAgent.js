import pkg from "@aws-sdk/client-bedrock-agent-runtime";
import { agentClient } from "../services/agentClient.js";

const { InvokeAgentCommand } = pkg;

/**
 * Test Case Generator Agent
 * Generates 7-10 hidden test cases for coding challenges
 * These test cases are compact (no explanations) to save tokens
 */
export const callTestCaseGeneratorAgent = async (prompt) => {
  const command = new InvokeAgentCommand({
    agentId: process.env.TEST_CASE_GENERATOR_AGENT_ID,
    agentAliasId: process.env.TEST_CASE_GENERATOR_AGENT_ALIAS,
    sessionId: `testcase-gen-${Date.now()}`,
    inputText: prompt
  });

  const response = await agentClient.send(command);

  let output = "";
  for await (const event of response.completion) {
    if (event.chunk?.bytes) {
      output += Buffer.from(event.chunk.bytes).toString("utf-8");
    }
  }

  // Clean up the output - remove markdown code blocks if present
  let cleanedOutput = output.trim();
  
  // Remove markdown code blocks
  if (cleanedOutput.startsWith('```json')) {
    cleanedOutput = cleanedOutput.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanedOutput.startsWith('```')) {
    cleanedOutput = cleanedOutput.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  // Try to extract JSON if there's extra text
  const jsonMatch = cleanedOutput.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedOutput = jsonMatch[0];
  }

  // Parse the JSON response
  try {
    // First attempt: try to parse as-is
    let parsed;
    try {
      parsed = JSON.parse(cleanedOutput);
    } catch (firstErr) {
      // Second attempt: fix unescaped newlines in JSON strings
      console.warn("⚠️  First parse failed, attempting to fix newlines...");
      
      // Replace actual newlines within JSON string values with \\n
      // This regex finds strings and replaces newlines within them
      const fixedOutput = cleanedOutput.replace(
        /"(input|expectedOutput)"\s*:\s*"([^"]*)"/g,
        (match, key, value) => {
          // Replace actual newlines with escaped newlines
          const fixedValue = value.replace(/\n/g, '\\n').replace(/\r/g, '');
          return `"${key}": "${fixedValue}"`;
        }
      );
      
      console.log("Fixed output sample:", fixedOutput.substring(0, 500));
      parsed = JSON.parse(fixedOutput);
    }
    
    // Validate structure
    if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
      console.error("❌ Invalid response structure:", cleanedOutput.substring(0, 500));
      throw new Error("Invalid response: testCases array is required");
    }

    // Validate each test case
    for (const tc of parsed.testCases) {
      if (typeof tc.input !== "string" || typeof tc.expectedOutput !== "string") {
        console.error("❌ Invalid test case structure:", tc);
        throw new Error("Invalid test case: input and expectedOutput must be strings");
      }
      
      // Remove any fields that shouldn't be here
      delete tc.isVisible;
      delete tc.explanation;
    }

    // Ensure we have 7-10 test cases
    if (parsed.testCases.length < 7 || parsed.testCases.length > 10) {
      console.warn(`⚠️  Expected 7-10 test cases, got ${parsed.testCases.length}`);
    }

    console.log(`✅ Successfully parsed ${parsed.testCases.length} hidden test cases`);
    return parsed.testCases;
  } catch (err) {
    console.error("❌ Failed to parse test case generator response:");
    console.error("Raw output (first 1000 chars):", output.substring(0, 1000));
    console.error("Cleaned output (first 1000 chars):", cleanedOutput.substring(0, 1000));
    console.error("Parse error:", err.message);
    throw new Error("Test case generator did not return valid JSON: " + err.message);
  }
};
