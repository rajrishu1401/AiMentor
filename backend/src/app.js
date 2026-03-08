import express from "express";
import cors from "cors";

import learningRoutes from "./routes/learningRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/profile", profileRoutes);


export default app;
