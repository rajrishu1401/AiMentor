# HackVeda - AI Learning Platform

AI-powered learning platform for Computer Science education.

## Quick Deploy to AWS EC2

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/hackveda.git
cd hackveda
```

### 2. Install Dependencies

**Main Backend:**
```bash
cd backend
npm install
node server.js
```

**Chatbot Backend:**
```bash
cd chatbotAWS
npm install
node backend.js
```

**PDF Backend:**
```bash
cd HackathonPDF/backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: AWS DynamoDB
- AI: AWS Bedrock Agents
- Code Execution: Judge0

## Ports

- Frontend: 5010
- Main Backend: 5012
- Chatbot Backend: 5005
- PDF Backend: 5006
