/**
 * Builds a learning path based on prerequisites, evaluation, and target skill
 * @param {Object} params - The parameters object
 * @param {Array} params.prereqOrder - Ordered list of prerequisites
 * @param {Object} params.evaluation - User's evaluation results
 * @param {String} params.targetSkill - The target skill to learn
 * @returns {Array} - Ordered array of skills to learn
 */
export const buildLearningPath = ({ prereqOrder, evaluation, targetSkill }) => {
  if (!prereqOrder || !Array.isArray(prereqOrder)) {
    return [targetSkill];
  }

  // Filter out skills the user already knows well
  const unmastered = prereqOrder.filter(skill => {
    const skillEval = evaluation?.skillEvaluations?.[skill];
    return !skillEval || skillEval.confidence < 0.7; // User needs practice if confidence < 70%
  });

  // Ensure the target skill is included
  if (!unmastered.includes(targetSkill)) {
    unmastered.push(targetSkill);
  }

  return unmastered;
};
