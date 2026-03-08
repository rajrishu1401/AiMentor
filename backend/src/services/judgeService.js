import axios from "axios";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://13.234.32.75:2358";

export const runCodeOnJudge0 = async (
  sourceCode,
  languageId,
  testCases
) => {
  let passed = 0;
  const testResults = [];

  console.log(`🔗 Using Judge0 at: ${JUDGE0_URL}`);

  for (const test of testCases) {
    try {
      console.log(`\n🧪 Running test case: input="${test.input}", expected="${test.expectedOutput}"`);
      
      // Encode source code, stdin, and expected output in base64
      const sourceCodeBase64 = Buffer.from(sourceCode).toString('base64');
      const stdinBase64 = Buffer.from(test.input).toString('base64');
      const expectedOutputBase64 = Buffer.from(test.expectedOutput).toString('base64');
      
      const res = await axios.post(
        `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
        {
          source_code: sourceCodeBase64,
          stdin: stdinBase64,
          expected_output: expectedOutputBase64,
          language_id: languageId
        },
        {
          timeout: 30000, // 30 second timeout for network requests
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Log the full response for debugging
      console.log("📊 Full Judge0 response:", JSON.stringify(res.data, null, 2));
      console.log("📊 Judge0 response status:", res.data.status?.description);
      console.log("📊 Judge0 stdout:", res.data.stdout);
      console.log("📊 Judge0 stderr:", res.data.stderr);
      console.log("📊 Judge0 compile_output:", res.data.compile_output);
      console.log("📊 Judge0 message:", res.data.message);

      // Check if response is valid
      if (!res.data || !res.data.status) {
        console.error("❌ Invalid Judge0 response - missing status field");
        throw new Error("Invalid response from Judge0 - missing status field");
      }

      const isAccepted = res.data.status?.description === "Accepted";
      if (isAccepted) {
        passed++;
      }

      // Decode base64 outputs if they exist
      const decodeBase64 = (str) => {
        if (!str) return null;
        try {
          return Buffer.from(str, 'base64').toString('utf-8');
        } catch (e) {
          return str; // Return as-is if decoding fails
        }
      };

      const stdout = decodeBase64(res.data.stdout);
      const stderr = decodeBase64(res.data.stderr);
      const compileOutput = decodeBase64(res.data.compile_output);
      const message = res.data.message;

      console.log("📊 Decoded stdout:", stdout);
      console.log("📊 Decoded stderr:", stderr);
      console.log("📊 Decoded compile_output:", compileOutput);

      // Determine actual output - prioritize compilation errors and stderr
      let actualOutput = "No output";
      if (compileOutput) {
        actualOutput = `Compilation Error:\n${compileOutput}`;
      } else if (stderr) {
        actualOutput = `Runtime Error:\n${stderr}`;
      } else if (stdout) {
        actualOutput = stdout;
      } else if (message) {
        actualOutput = `Error: ${message}`;
      }

      // Store detailed result for each test case
      testResults.push({
        input: test.input,
        expectedOutput: test.expectedOutput,
        actualOutput: actualOutput,
        passed: isAccepted,
        status: res.data.status?.description || "Unknown",
        explanation: test.explanation || null,
        // Include additional debug info
        compile_output: compileOutput || null,
        stderr: stderr || null,
        message: message || null
      });
    } catch (error) {
      console.error("❌ Judge0 submission error:", error.message);
      console.error("❌ Error code:", error.code);
      
      // If Judge0 is not reachable, throw a more descriptive error
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Judge0 service is not reachable at ${JUDGE0_URL}. Please ensure Judge0 is running and accessible.`);
      }
      
      if (error.code === 'ETIMEDOUT') {
        throw new Error(`Judge0 service timed out at ${JUDGE0_URL}. The service might be overloaded or not responding.`);
      }
      
      // For other errors, still throw to stop execution
      throw error;
    }
  }

  return {
    passed,
    total: testCases.length,
    testResults
  };
};
