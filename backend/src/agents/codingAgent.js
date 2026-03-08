import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import pkg from "@aws-sdk/client-bedrock-agent-runtime";
import { agentClient } from "../services/agentClient.js";

const { InvokeAgentCommand } = pkg;

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

// Use Bedrock Agent for coding challenge generation
export const callCodingAgentWithAgent = async (prompt) => {
  const command = new InvokeAgentCommand({
    agentId: process.env.CODING_AGENT_ID,
    agentAliasId: process.env.CODING_AGENT_ALIAS,
    sessionId: `coding-${Date.now()}`,
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

  // CRITICAL: If agent returns explanatory text instead of JSON, fail immediately
  // Check if output starts with JSON or contains explanatory phrases
  const explanatoryPhrases = [
    'The search results',
    'I will create',
    'I will generate',
    'Here is',
    'Based on',
    'Let me',
    'I have created',
    'I have generated'
  ];
  
  const hasExplanatoryText = explanatoryPhrases.some(phrase => 
    cleanedOutput.substring(0, 200).includes(phrase)
  );
  
  if (hasExplanatoryText && !cleanedOutput.trim().startsWith('{')) {
    console.error("❌ Agent returned explanatory text instead of JSON");
    console.error("First 500 chars:", cleanedOutput.substring(0, 500));
    throw new Error("Agent returned explanatory text instead of JSON. The agent must return ONLY valid JSON with no explanations.");
  }

  // Try to extract JSON if there's extra text
  const jsonMatch = cleanedOutput.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedOutput = jsonMatch[0];
  } else if (!cleanedOutput.trim().startsWith('{')) {
    // No JSON found at all
    console.error("❌ No JSON found in agent response");
    console.error("Full output:", cleanedOutput);
    throw new Error("Agent response does not contain valid JSON");
  }

  // CRITICAL FIX: Replace actual newlines inside string values with \n escape sequences
  // This handles cases where the agent returns literal newlines in code strings
  // We need to process character by character to only fix newlines inside strings
  let fixed = '';
  let inString = false;
  let prevChar = '';
  
  for (let i = 0; i < cleanedOutput.length; i++) {
    const char = cleanedOutput[i];
    
    // Track if we're inside a string (not escaped quote)
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      fixed += char;
    } else if (inString && (char === '\n' || char === '\r')) {
      // Replace actual newlines with \n escape sequence when inside strings
      if (char === '\n') {
        fixed += '\\n';
      }
      // Skip \r characters
    } else if (inString && char === '\t') {
      // Replace actual tabs with \t escape sequence when inside strings
      fixed += '\\t';
    } else {
      fixed += char;
    }
    
    prevChar = char;
  }
  
  cleanedOutput = fixed;

  // Now remove pretty-printing newlines OUTSIDE of string values
  cleanedOutput = cleanedOutput
    .replace(/"\s*\n\s*/g, '"')  // Remove newlines after closing quotes
    .replace(/\n\s*"/g, '"')     // Remove newlines before opening quotes
    .replace(/,\s*\n\s*/g, ',')  // Remove newlines after commas
    .replace(/\{\s*\n\s*/g, '{') // Remove newlines after {
    .replace(/\[\s*\n\s*/g, '[') // Remove newlines after [
    .replace(/\n\s*\}/g, '}')    // Remove newlines before }
    .replace(/\n\s*\]/g, ']');   // Remove newlines before ]

  // Parse the JSON response
  try {
    // Try to parse the cleaned output
    let parsed;
    try {
      parsed = JSON.parse(cleanedOutput);
    } catch (firstError) {
      // If parsing still fails, try to fix unescaped quotes
      console.log("⚠️  First parse failed, attempting to fix quotes...");
      console.log("Parse error:", firstError.message);
      console.log("Problematic JSON snippet:", cleanedOutput.substring(Math.max(0, cleanedOutput.length - 500)));
      
      // Check if JSON is incomplete (missing closing brackets)
      const openBraces = (cleanedOutput.match(/\{/g) || []).length;
      const closeBraces = (cleanedOutput.match(/\}/g) || []).length;
      const openBrackets = (cleanedOutput.match(/\[/g) || []).length;
      const closeBrackets = (cleanedOutput.match(/\]/g) || []).length;
      
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        console.log("⚠️  Detected incomplete JSON - attempting to complete it...");
        console.log(`Braces: ${openBraces} open, ${closeBraces} close`);
        console.log(`Brackets: ${openBrackets} open, ${closeBrackets} close`);
        
        // Try to complete the JSON by adding missing closing brackets
        let completed = cleanedOutput.trim();
        
        // Remove trailing comma if present
        if (completed.endsWith(',')) {
          completed = completed.slice(0, -1);
        }
        
        // If we're in the middle of a string, close it
        const lastQuote = completed.lastIndexOf('"');
        const lastColon = completed.lastIndexOf(':');
        const lastComma = completed.lastIndexOf(',');
        const lastOpenBrace = completed.lastIndexOf('{');
        const lastOpenBracket = completed.lastIndexOf('[');
        
        // Check if we're in an incomplete string value
        if (lastQuote > Math.max(lastColon, lastComma, lastOpenBrace, lastOpenBracket)) {
          // We might be in an incomplete string, close it
          const afterQuote = completed.substring(lastQuote + 1);
          if (!afterQuote.includes('"')) {
            completed += '"';
          }
        }
        
        // Add missing closing brackets for arrays
        for (let i = 0; i < (openBrackets - closeBrackets); i++) {
          completed += ']';
        }
        
        // Add missing closing braces for objects
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          completed += '}';
        }
        
        console.log("Attempting to parse completed JSON...");
        console.log("Last 200 chars of completed JSON:", completed.substring(completed.length - 200));
        try {
          parsed = JSON.parse(completed);
          console.log("✅ Successfully parsed completed JSON!");
        } catch (completionError) {
          console.log("⚠️  Completion failed, trying quote fixing...");
          console.log("Completion error:", completionError.message);
          // Continue to quote fixing below
        }
      }
      
      if (!parsed) {
        // Strategy: More aggressive quote fixing
        let quoteFixed = cleanedOutput
          .replace(/"([^"]+)",\s*"([^"]+)",\s*or\s*"([^"]+)"/g, '$1, $2, or $3')
          .replace(/:\s*"([^"]*)"([^"]+)"([^"]*)"/g, (match, before, middle, after) => {
            return `: "${before}\\"${middle}\\"${after}"`;
          });
        
        console.log("Attempting to parse quote-fixed JSON...");
        try {
          parsed = JSON.parse(quoteFixed);
        } catch (secondError) {
          console.log("⚠️  Second parse failed, trying character-by-character fix...");
          
          // Last resort: character-by-character quote fixing
          let charFixed = '';
          let inString = false;
          let prevChar = '';
          
          for (let i = 0; i < cleanedOutput.length; i++) {
            const char = cleanedOutput[i];
            
            if (char === '"' && prevChar !== '\\') {
              if (!inString) {
                inString = true;
                charFixed += char;
              } else {
                let j = i + 1;
                while (j < cleanedOutput.length && /\s/.test(cleanedOutput[j])) j++;
                
                const nextChar = j < cleanedOutput.length ? cleanedOutput[j] : '';
                
                if (nextChar === ':' || nextChar === ',' || nextChar === '}' || nextChar === ']' || j === cleanedOutput.length) {
                  inString = false;
                  charFixed += char;
                } else {
                  charFixed += '\\"';
                }
              }
            } else {
              charFixed += char;
            }
            
            prevChar = char;
          }
          
          parsed = JSON.parse(charFixed);
        }
      }
    }
    
    // Validate required fields and provide defaults for optional ones
    if (!parsed.problemStatement || !parsed.starterCode) {
      throw new Error("Missing required fields: problemStatement and starterCode are mandatory");
    }
    
    // Provide defaults for optional fields
    if (!parsed.hint) {
      parsed.hint = "Think about the problem step by step.";
    }
    
    if (!parsed.executionType) {
      parsed.executionType = "stdin";
    }
    
    // Validate that we have exactly 3 test cases
    if (!parsed.testCases || !Array.isArray(parsed.testCases) || parsed.testCases.length === 0) {
      console.warn("⚠️  No test cases provided by agent, using placeholder");
      parsed.testCases = [
        { input: "5", expectedOutput: "5", explanation: "Sample test case" },
        { input: "10", expectedOutput: "10", explanation: "Sample test case" },
        { input: "15", expectedOutput: "15", explanation: "Sample test case" }
      ];
    }
    
    if (parsed.testCases.length !== 3) {
      console.warn(`⚠️  Found ${parsed.testCases.length} test cases, expected exactly 3`);
      
      // Ensure we have exactly 3 test cases
      if (parsed.testCases.length < 3) {
        // Pad with placeholder test cases
        while (parsed.testCases.length < 3) {
          parsed.testCases.push({
            input: "0",
            expectedOutput: "0",
            explanation: "Sample test case"
          });
        }
      } else {
        // Take only first 3
        parsed.testCases = parsed.testCases.slice(0, 3);
      }
    }
    
    // Ensure all test cases have explanation
    parsed.testCases.forEach((tc, idx) => {
      if (!tc.explanation) {
        tc.explanation = "Sample test case";
      }
      // Remove isVisible if present (will be set by controller)
      delete tc.isVisible;
    });
    
    return parsed;
  } catch (err) {
    console.error("❌ Failed to parse agent response:");
    console.error("Raw output:", output.substring(0, 1000));
    console.error("Cleaned output:", cleanedOutput.substring(0, 1000));
    console.error("Parse error:", err.message);
    throw new Error("Agent did not return valid JSON: " + err.message);
  }
};

// Legacy Converse API with tool calling (keeping for reference)
export const callCodingAgentWithTool = async (prompt) => {
  const toolConfig = {
    tools: [
      {
        toolSpec: {
          name: "generate_coding_challenge",
          description: "Generate structured coding challenge",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                problemStatement: { type: "string" },
                starterCode: { type: "string" },
                hint: { type: "string" },
                executionType: { type: "string" },
                testCases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      input: { type: "string" },
                      expectedOutput: { type: "string" }
                    },
                    required: ["input", "expectedOutput"]
                  }
                }
              },
              required: [
                "problemStatement",
                "starterCode",
                "hint",
                "executionType",
                "testCases"
              ]
            }
          }
        }
      }
    ]
  };

  const command = new ConverseCommand({
  modelId: "arn:aws:bedrock:ap-south-1:678484358827:inference-profile/apac.amazon.nova-pro-v1:0",
  messages: [
    {
      role: "user",
      content: [{ text: prompt }]
    }
  ],
  toolConfig,
  toolChoice: {
    tool: {
      name: "generate_coding_challenge"
    }
  }
});

  const response = await client.send(command);

  const toolCall = response.output?.message?.toolCalls?.[0];

  if (!toolCall || !toolCall.input) {
    throw new Error("Model did not return structured tool output");
  }

  return toolCall.input;
};