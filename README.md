# HackVeda AI - AI-Powered Learning Platform

An intelligent learning platform that combines personalized roadmaps, AI mentorship, coding challenges, and PDF-based learning to create a comprehensive educational experience.

## 🌟 Features

### 1. **Personalized Learning Roadmaps**
- AI-generated custom learning paths based on your goals and skill level
- Topic-by-topic breakdown with subtopics
- Progress tracking and completion status
- Interactive lessons with theory and practical examples

### 2. **AI-Powered Coding Challenges**
- Real-time code execution using Judge0
- Support for multiple programming languages (Python, C++, Java, JavaScript)
- AI-generated test cases and problem descriptions
- Instant feedback and evaluation
- Code editor with syntax highlighting

### 3. **Interactive Quizzes**
- AI-generated quizzes based on learning content
- Multiple-choice questions with instant feedback
- Score tracking and performance analytics
- AI Assistant available after quiz submission

### 4. **AI Mentor & Chatbot**
- 24/7 AI assistant powered by AWS Bedrock
- Context-aware responses
- Available in Dashboard and Sandbox modes
- Helps with coding questions, debugging, and learning guidance

### 5. **PDF Learning Assistant**
- Upload any PDF document for AI-powered learning
- Four learning modes:
  - **Teach**: Get detailed explanations of concepts
  - **Plan**: Generate structured learning roadmaps
  - **Quiz**: Create practice quizzes from content
  - **Summary**: Get concise summaries
- Powered by AWS Bedrock Knowledge Base

### 6. **Knowledge Graph Visualization**
- Interactive skill dependency graph
- Visual representation of learning paths
- Prerequisite tracking
- Skill proficiency levels

### 7. **User Dashboard**
- Track learning progress
- View completed and ongoing roadmaps
- Access all features from a unified interface
- Personalized recommendations

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **Lucide React** - Icon library
- **Monaco Editor** - Code editor component

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **AWS Bedrock** - AI/ML services (8 specialized agents)
- **AWS DynamoDB** - NoSQL database for user data
- **AWS S3** - PDF storage and static hosting
- **Judge0** - Code execution engine
- **JWT** - Authentication
- **bcrypt** - Password hashing

### AI Agents (AWS Bedrock)
1. **Tutor Agent** - Personalized teaching
2. **Curriculum Agent** - Learning path generation
3. **Evaluation Agent** - Assessment and feedback
4. **Skill Mapping Agent** - Skill analysis
5. **Coding Agent** - Coding challenge generation
6. **Test Case Generator** - Automated test creation
7. **Chatbot Agent** - Conversational AI
8. **Learning Assistant** - PDF-based learning

### Infrastructure
- **AWS EC2** - Backend hosting (t3.medium)
- **AWS S3** - Frontend hosting (static website)
- **Nginx** - Reverse proxy
- **PM2** - Process management
- **IAM Roles** - Secure AWS access

## 📁 Project Structure

```
AiMentor/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── config/          # Configuration files
│   └── dist/                # Production build
│
├── backend/                  # Main Express backend
│   ├── src/
│   │   ├── agents/          # AI agent integrations
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── config/          # Backend configuration
│   └── .env                 # Environment variables
│
├── chatbotAWS/              # Chatbot backend service
│   └── backend.js           # Standalone chatbot server
│
└── HackathonPDF/            # PDF learning backend
    └── backend/
        └── src/             # TypeScript source
```

## 🚀 Live Deployment

- **Frontend**: http://aimentor-frontend.s3-website.ap-south-1.amazonaws.com
- **Backend API**: http://13.232.0.142/api/
- **Chatbot API**: http://13.232.0.142/chatbot/
- **PDF API**: http://13.232.0.142/pdf/

## 🔧 Local Development

### Prerequisites
- Node.js 18+ (20+ recommended)
- AWS Account with Bedrock access
- Judge0 instance (for code execution)
- DynamoDB table

### Environment Variables

**Backend (.env)**
```env
PORT=5012
AWS_REGION=ap-south-1
DYNAMODB_USERS_TABLE=hackveda-users
JWT_SECRET=your_jwt_secret
JUDGE0_URL=http://your-judge0-url:2358

# Bedrock Agent IDs
TUTOR_AGENT_ID=your_agent_id
CURRICULUM_AGENT_ID=your_agent_id
EVALUATION_AGENT_ID=your_agent_id
SKILL_MAPPING_AGENT_ID=your_agent_id
CODING_AGENT_ID=your_agent_id
TEST_CASE_GENERATOR_AGENT_ID=your_agent_id
CHATBOT_AGENT_ID=your_agent_id
LEARNING_ASSISTANT_AGENT_ID=your_agent_id
```

**Chatbot Backend (.env)**
```env
AWS_REGION=ap-south-1
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS=your_alias_id
PORT=5005
```

**PDF Backend (.env)**
```env
AWS_REGION=ap-south-1
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS=your_alias_id
BEDROCK_KNOWLEDGE_BASE_ID=your_kb_id
S3_BUCKET_NAME=your_bucket_name
PORT=5006
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rajrishu1401/AiMentor.git
cd AiMentor
```

2. **Install backend dependencies**
```bash
cd backend
npm install

cd ../chatbotAWS
npm install

cd ../HackathonPDF/backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../../frontend
npm install
```

4. **Configure AWS credentials**
```bash
aws configure
```

5. **Start development servers**

Backend:
```bash
cd backend
npm start
```

Chatbot:
```bash
cd chatbotAWS
node backend.js
```

PDF Backend:
```bash
cd HackathonPDF/backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## 📦 Production Deployment

### Backend Deployment (EC2)

1. **Launch EC2 instance** (t3.medium recommended)
2. **Install dependencies**
```bash
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git nginx
sudo npm install -g pm2
```

3. **Clone and setup**
```bash
git clone https://github.com/rajrishu1401/AiMentor.git
cd AiMentor
```

4. **Deploy backends with PM2**
```bash
cd backend
npm install
pm2 start server.js --name aiMentor-backend

cd ../chatbotAWS
npm install
pm2 start backend.js --name aiMentor-chatbot

cd ../HackathonPDF/backend
npm install
npm run build
pm2 start dist/server.js --name aiMentor-pdf

pm2 save
pm2 startup
```

5. **Configure Nginx**
```bash
sudo nano /etc/nginx/conf.d/aimentor.conf
```

Add reverse proxy configuration for ports 5012, 5005, 5006.

6. **Start Nginx**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Frontend Deployment (S3)

1. **Build frontend**
```bash
cd frontend
npm run build
```

2. **Create S3 bucket**
- Enable static website hosting
- Make bucket public
- Upload `dist/` contents

3. **Configure bucket policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket/*"
  }]
}
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- IAM roles for AWS service access
- CORS configuration for cross-origin requests
- Environment variable management
- Secure credential handling

## 🎯 Key Integrations

### AWS Bedrock Agents
- 8 specialized AI agents for different learning tasks
- Custom knowledge bases for domain-specific content
- Real-time streaming responses

### Judge0 Code Execution
- Secure sandboxed code execution
- Support for 50+ programming languages
- Base64 encoding for special characters
- Timeout and resource limits

### DynamoDB
- User authentication and profiles
- Learning progress tracking
- Roadmap storage

## 📊 Performance

- **Backend**: 3 Node.js services managed by PM2
- **Frontend**: Static hosting on S3 with CDN-ready setup
- **Database**: DynamoDB with on-demand capacity
- **Caching**: Nginx reverse proxy
- **Auto-restart**: PM2 process management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Raj Rishu** - [GitHub](https://github.com/rajrishu1401)

## 🙏 Acknowledgments

- AWS Bedrock for AI capabilities
- Judge0 for code execution
- React community for excellent tools
- All open-source contributors

---

**Built with ❤️ using AI and modern web technologies**
