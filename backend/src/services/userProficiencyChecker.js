/**
 * User Proficiency Checker
 * Checks if a user is proficient in a given skill based on:
 * - Quiz attempts >= 10
 * - Code attempts >= 3
 * - Confidence >= 60%
 */

// Proficiency criteria constants
const PROFICIENCY_CRITERIA = {
  MIN_QUIZ_ATTEMPTS: 10,
  MIN_CODE_ATTEMPTS: 3,
  MIN_CONFIDENCE: 60  // percentage
};

/**
 * Get user's skill data from globalSkills array
 * @param {Object} user - User document
 * @param {string} skillId - Canonical skill ID
 * @returns {Object} Skill data or default values
 */
function getUserSkillData(user, skillId) {
  if (!user || !user.globalSkills || !Array.isArray(user.globalSkills)) {
    return {
      skill: skillId,
      confidence: 0,
      quizAttempts: 0,
      codeAttempts: 0
    };
  }

  const userSkill = user.globalSkills.find(s => s.skill === skillId);
  
  if (!userSkill) {
    return {
      skill: skillId,
      confidence: 0,
      quizAttempts: 0,
      codeAttempts: 0
    };
  }

  // Handle missing or invalid fields
  return {
    skill: skillId,
    confidence: typeof userSkill.confidence === 'number' && !isNaN(userSkill.confidence) 
      ? userSkill.confidence 
      : 0,
    quizAttempts: typeof userSkill.quizAttempts === 'number' && !isNaN(userSkill.quizAttempts)
      ? userSkill.quizAttempts
      : 0,
    codeAttempts: typeof userSkill.codeAttempts === 'number' && !isNaN(userSkill.codeAttempts)
      ? userSkill.codeAttempts
      : 0
  };
}

/**
 * Check if user is proficient in a given skill
 * @param {Object} user - User document with globalSkills
 * @param {string} skillId - Canonical skill ID to check
 * @returns {Object} Proficiency status with details
 */
export function checkUserProficiency(user, skillId) {
  console.log(`🔍 Checking proficiency for skill: ${skillId}`);

  // Get user's skill data
  const skillData = getUserSkillData(user, skillId);

  // Check each criterion
  const meetsQuizCriteria = skillData.quizAttempts >= PROFICIENCY_CRITERIA.MIN_QUIZ_ATTEMPTS;
  const meetsCodeCriteria = skillData.codeAttempts >= PROFICIENCY_CRITERIA.MIN_CODE_ATTEMPTS;
  const meetsConfidenceCriteria = skillData.confidence >= PROFICIENCY_CRITERIA.MIN_CONFIDENCE;

  // User is proficient only if ALL criteria are met
  const isProficient = meetsQuizCriteria && meetsCodeCriteria && meetsConfidenceCriteria;

  const result = {
    isProficient,
    details: {
      quizAttempts: skillData.quizAttempts,
      codeAttempts: skillData.codeAttempts,
      confidence: skillData.confidence,
      meetsQuizCriteria,
      meetsCodeCriteria,
      meetsConfidenceCriteria
    }
  };

  // Log result
  if (isProficient) {
    console.log(`  ✅ User proficient in ${skillId}`);
    console.log(`     Quizzes: ${skillData.quizAttempts}, Coding: ${skillData.codeAttempts}, Confidence: ${skillData.confidence}%`);
  } else {
    console.log(`  ❌ User NOT proficient in ${skillId}`);
    console.log(`     Quizzes: ${skillData.quizAttempts}/${PROFICIENCY_CRITERIA.MIN_QUIZ_ATTEMPTS} ${meetsQuizCriteria ? '✅' : '❌'}`);
    console.log(`     Coding: ${skillData.codeAttempts}/${PROFICIENCY_CRITERIA.MIN_CODE_ATTEMPTS} ${meetsCodeCriteria ? '✅' : '❌'}`);
    console.log(`     Confidence: ${skillData.confidence}%/${PROFICIENCY_CRITERIA.MIN_CONFIDENCE}% ${meetsConfidenceCriteria ? '✅' : '❌'}`);
  }

  return result;
}

/**
 * Get proficiency criteria (for external use)
 * @returns {Object} Proficiency criteria constants
 */
export function getProficiencyCriteria() {
  return { ...PROFICIENCY_CRITERIA };
}
