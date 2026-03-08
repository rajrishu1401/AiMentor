import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMySkills } from "../controllers/profileController.js";

const router = express.Router();

router.get("/my-skills", protect, getMySkills);

export default router;