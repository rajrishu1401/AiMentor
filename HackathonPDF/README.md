# HackathonPDF — AI Mentor Platform

> Upload a PDF → get personalised **Lessons**, **Study Plans**, **Quizzes**, and **Summaries** powered by **Amazon Bedrock Agent**.

---

## 🏗️ Project Structure

```
HackathonPDF/
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── server.ts         # Express entry point
│   │   ├── config/
│   │   │   └── aws.ts        # AWS SDK client factory
│   │   ├── services/
│   │   │   ├── pdfExtractor.ts       # PDF text extraction
│   │   │   ├── chunkService.ts       # Text chunking (≤1000 chunks)
│   │   │   ├── retrievalService.ts   # Top-K semantic retrieval
│   │   │   ├── s3Service.ts          # S3 upload / delete
│   │   │   ├── agentService.ts       # Bedrock Agent invocation
│   │   │   └── orchestrationService.ts  # Full pipeline coordinator
│   │   ├── shared/
│   │   │   ├── types.ts      # Shared TypeScript types
│   │   │   └── constants.ts  # System constants
│   │   └── utils/
│   │       └── logger.ts     # Structured JSON logger
│   ├── .env                  # ← fill in your credentials
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                 # React + Vite + TypeScript + TailwindCSS
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── Header.tsx        # Gradient hero header
    │   │   ├── FileUpload.tsx    # Drag-and-drop PDF uploader
    │   │   ├── IntentSelector.tsx # Teach / Plan / Quiz / Summary buttons
    │   │   ├── LoadingSpinner.tsx # Step-by-step loading card
    │   │   ├── ErrorBanner.tsx   # Dismissable error banner
    │   │   └── OutputCard.tsx    # Markdown output + metadata
    │   ├── hooks/
    │   │   └── useLearning.ts    # API state hook (Axios)
    │   └── types/
    │       └── index.ts          # Frontend TypeScript types
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Quick Start

### 1. Clone / enter the project

```bash
cd HackathonPDF
```

### 2. Configure AWS credentials

Copy the example env file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your access key>
AWS_SECRET_ACCESS_KEY=<your secret key>
BEDROCK_AGENT_ID=<your Bedrock Agent ID>
BEDROCK_AGENT_ALIAS=<your Bedrock Agent Alias ID>
BEDROCK_KNOWLEDGE_BASE_ID=<optional KB ID>
S3_BUCKET_NAME=<your S3 bucket>
PORT=5006
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Run backend

```bash
cd backend
npm run dev
# → http://localhost:5006
```

### 6. Run frontend (in a new terminal)

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 🌐 API Endpoints

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/api/health`  | Health check                         |
| POST   | `/api/learn`   | Upload PDF and generate AI content   |
| POST   | `/api/cleanup` | Delete a file from S3                |

### POST `/api/learn` — Form Data

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| `file`     | File   | ✅       | PDF file (max 50 MB)                     |
| `prompt`   | string | ✅       | Learning request                         |
| `intent`   | string | ✅       | `teach` / `plan` / `quiz` / `summary`   |
| `userId`   | string | optional | User identifier                          |
| `sessionId`| string | optional | Session identifier                       |

### Response

```json
{
  "requestId": "uuid",
  "type": "teach",
  "content": "## Introduction to ...\n\n...",
  "sourceReferences": [
    { "chunkIndex": 2, "excerpt": "...", "relevanceScore": 0.93 }
  ],
  "generationTimestamp": "2026-03-02T...",
  "metadata": {
    "chunksRetrieved": 5,
    "tokensGenerated": 812,
    "modelVersion": "amazon.nova-pro-v1:0",
    "processingTimeMs": 18420
  }
}
```

---

## ⚙️ Architecture

```
User PDF ──▶ Multer (memory) ──▶ pdfExtractor
                                       │
                                   chunkService  (≤1000 chunks)
                                       │
                                retrievalService (top-5 BM25-style)
                                       │
                                  agentService   (InvokeAgentCommand)
                                       │
                                  ◀ LearningOutput JSON
```

---

## 🔒 Security Notes

- Never commit `.env` — it is in `.gitignore`
- Credentials are read from environment variables; no hardcoded secrets
- Multer enforces a 50 MB file size limit

---

## 🛠️ Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18, Vite 5, TypeScript, TailwindCSS 3, Axios |
| Backend  | Node.js, Express, TypeScript, tsx  |
| AWS      | Bedrock Agent Runtime, S3          |
| PDF      | pdf-parse                          |
| Fonts    | Inter (Google Fonts)               |
