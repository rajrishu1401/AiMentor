import User from "../models/UserDynamoDB.js";

export const getMySkills = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      skills: user.globalSkills
    });
  } catch (err) {
    console.error("❌ Fetch skills error:", err.message);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};
