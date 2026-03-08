import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

// Load environment variables
dotenv.config();

// simple memory store (per session)
const chatMemory = {};

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local development
    'http://localhost:5010', // Local production
    'http://aimentor-frontend.s3-website.ap-south-1.amazonaws.com', // S3 frontend
    'http://13.232.0.142' // EC2 public IP
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

/* =========================================
   🔥 CONFIGURATION FROM ENVIRONMENT VARIABLES
========================================= */

const REGION = process.env.AWS_REGION || "ap-south-1";
const AGENT_ID = process.env.BEDROCK_AGENT_ID || "OKPUEODEZC";
const AGENT_ALIAS = process.env.BEDROCK_AGENT_ALIAS || "3KNCV8OBXZ";
const PORT = process.env.PORT || 5005;

/* =========================================
   AWS CLIENT
========================================= */

// AWS SDK will automatically use credentials from:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. AWS CLI configuration (~/.aws/credentials)
// 3. IAM role (when deployed on EC2/ECS)
const client = new BedrockAgentRuntimeClient({
  region: REGION,
});

/* =========================================
   TALK TO AGENT
========================================= */

async function askAgent(message, sessionId = "user-session") {
  // create memory if not exists
  if (!chatMemory[sessionId]) {
    chatMemory[sessionId] = [];
  }

  // add user message to memory
  chatMemory[sessionId].push(`User: ${message}`);

  // keep last 6 messages only
  const history = chatMemory[sessionId].slice(-6).join("\n");

  const finalPrompt = `
Previous conversation:
${history}

User: ${message}
AI:
`;

  const command = new InvokeAgentCommand({
    agentId: AGENT_ID,
    agentAliasId: AGENT_ALIAS,
    sessionId: sessionId,
    inputText: finalPrompt,
  });

  const response = await client.send(command);

  let answer = "";

  for await (const event of response.completion) {
    if (event.chunk?.bytes) {
      answer += Buffer.from(event.chunk.bytes).toString("utf-8");
    }
  }

  // store AI reply also
  chatMemory[sessionId].push(`AI: ${answer}`);

  return answer;
}

/* =========================================
   ROUTES
========================================= */

// health check
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

// chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const reply = await askAgent(message, sessionId || "default");
    res.json({ reply });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: "Agent failed" });
  }
});

/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📍 Region: ${REGION}`);
  console.log(`🤖 Agent ID: ${AGENT_ID}`);
});