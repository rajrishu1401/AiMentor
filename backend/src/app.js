import express from "express";
import cors from "cors";

import learningRoutes from "./routes/learningRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/profile", profileRoutes);


export default app;
