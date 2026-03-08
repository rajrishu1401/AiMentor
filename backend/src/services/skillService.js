import User from "../models/UserDynamoDB.js";

export const updateUserSkills = async ({
  userId,
  skills,
  score,        // MUST be 0–100
  isCoding = false
}) => {
  if (!skills || skills.length === 0) return;

  const user = await User.findById(userId);

  // Group skills and calculate average score if multiple raw skills map to same canonical skill
  const skillScores = {};
  for (const skillId of skills) {
    if (!skillScores[skillId]) {
      skillScores[skillId] = [];
    }
    skillScores[skillId].push(score);
  }

  // Calculate average score for each unique skill
  const uniqueSkills = Object.keys(skillScores);
  
  for (const skillId of uniqueSkills) {
    const scores = skillScores[skillId];
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    
    let skill = user.globalSkills.find(s => s.skill === skillId);

    // Weight for new score:
    // - Coding has 5x impact compared to quiz
    // - Quiz: 0.4 weight (40% new, 60% old)
    // - Coding: 0.67 weight (67% new, 33% old) - approximately 5x relative impact
    const NEW_WEIGHT = isCoding ? 0.67 : 0.4;
    const OLD_WEIGHT = 1 - NEW_WEIGHT;

    if (!skill) {
      // New skill: start with the average score directly
      user.globalSkills.push({
        skill: skillId,
        confidence: Math.max(0, Math.min(100, Math.round(avgScore))),
        quizAttempts: isCoding ? 0 : 1,
        codeAttempts: isCoding ? 1 : 0,
        lastUpdated: new Date(),
        confidenceHistory: [{
          value: Math.max(0, Math.min(100, Math.round(avgScore))),
          date: new Date()
        }]
      });
      
      console.log(`✅ Created new skill: ${skillId} with confidence ${Math.round(avgScore)} (${isCoding ? 'coding' : 'quiz'})`);
    } else {
      // Existing skill: use weighted moving average
      // This allows confidence to go UP or DOWN based on performance
      const newConfidence = Math.round(
        skill.confidence * OLD_WEIGHT + avgScore * NEW_WEIGHT
      );
      
      skill.confidence = Math.max(0, Math.min(100, newConfidence));

      // Track confidence history
      if (!skill.confidenceHistory) {
        skill.confidenceHistory = [];
      }
      skill.confidenceHistory.push({
        value: skill.confidence,
        date: new Date()
      });

      // Keep only last 20 history entries
      if (skill.confidenceHistory.length > 20) {
        skill.confidenceHistory = skill.confidenceHistory.slice(-20);
      }

      if (isCoding) skill.codeAttempts += 1;
      else skill.quizAttempts += 1;

      skill.lastUpdated = new Date();
      
      console.log(`✅ Updated skill: ${skillId} confidence ${skill.confidence} (${isCoding ? 'coding' : 'quiz'})`);
    }
  }

  await user.save();
  console.log(`💾 Saved ${uniqueSkills.length} unique skills to globalSkills`);
};
