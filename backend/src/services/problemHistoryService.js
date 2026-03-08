/**
 * Service to manage coding problem history for preventing repetitive questions
 */

/**
 * Get recent coding problems solved by the user
 * @param {Object} user - User document from MongoDB
 * @param {Number} limit - Maximum number of problems to return (default: 15)
 * @returns {Array} Array of problem objects with title and brief description
 */
export const getRecentCodingProblems = (user, limit = 15) => {
  const problems = [];

  // Iterate through all roadmaps
  user.roadmaps.forEach((roadmap) => {
    roadmap.topics.forEach((topic) => {
      topic.subtopics.forEach((subtopic) => {
        // Only include subtopics with coding challenges
        if (subtopic.codingChallenge?.problemStatement) {
          problems.push({
            subtopicTitle: subtopic.title,
            topicTitle: topic.title,
            roadmapSubject: roadmap.subject,
            problemStatement: subtopic.codingChallenge.problemStatement,
            wasSolved: subtopic.codingSubmission?.noOfSubmissions > 0,
            score: subtopic.codingSubmission?.scoreForCode || 0,
            skills: subtopic.codingChallenge.skills || [],
            createdAt: subtopic.codingChallenge.createdAt || new Date()
          });
        }
      });
    });
  });

  // Sort by most recent first (if createdAt exists)
  problems.sort((a, b) => {
    const dateA = a.createdAt || new Date(0);
    const dateB = b.createdAt || new Date(0);
    return dateB - dateA;
  });

  // Return limited number of most recent problems
  return problems.slice(0, limit);
};

/**
 * Format problem history for agent prompt
 * @param {Array} problems - Array of problem objects from getRecentCodingProblems
 * @returns {String} Formatted string for agent prompt
 */
export const formatProblemHistoryForPrompt = (problems) => {
  if (!problems || problems.length === 0) {
    return "No previous coding problems.";
  }

  const formatted = problems.map((p, index) => {
    // Extract first 150 characters of problem statement
    const briefDescription = p.problemStatement.substring(0, 150).trim();
    const status = p.wasSolved ? `✓ Solved (${p.score}%)` : "○ Not solved";
    
    return `${index + 1}. [${p.topicTitle}] ${p.subtopicTitle}
   ${status}
   Problem: ${briefDescription}...
   Skills: ${p.skills.join(', ') || 'N/A'}`;
  }).join('\n\n');

  return formatted;
};

/**
 * Get problem patterns from history to help agent avoid repetition
 * @param {Array} problems - Array of problem objects
 * @returns {Array} Array of detected patterns
 */
export const detectProblemPatterns = (problems) => {
  const patterns = new Set();

  problems.forEach(p => {
    const statement = p.problemStatement.toLowerCase();
    
    // Detect common patterns
    if (statement.includes('fibonacci')) patterns.add('fibonacci');
    if (statement.includes('factorial')) patterns.add('factorial');
    if (statement.includes('tower of hanoi')) patterns.add('tower-of-hanoi');
    if (statement.includes('two sum')) patterns.add('two-sum');
    if (statement.includes('palindrome')) patterns.add('palindrome');
    if (statement.includes('reverse')) patterns.add('reverse');
    if (statement.includes('sort')) patterns.add('sorting');
    if (statement.includes('binary search')) patterns.add('binary-search');
    if (statement.includes('linked list')) patterns.add('linked-list');
    if (statement.includes('tree traversal')) patterns.add('tree-traversal');
  });

  return Array.from(patterns);
};

/**
 * Get problems from same topic/skill area
 * @param {Object} user - User document
 * @param {String} currentTopic - Current topic title
 * @param {Array} currentSkills - Current skills being tested
 * @returns {Array} Problems from similar topics
 */
export const getRelatedProblems = (user, currentTopic, currentSkills = []) => {
  const problems = [];

  user.roadmaps.forEach((roadmap) => {
    roadmap.topics.forEach((topic) => {
      // Check if topic is related
      const isRelatedTopic = topic.title.toLowerCase().includes(currentTopic.toLowerCase()) ||
                            currentTopic.toLowerCase().includes(topic.title.toLowerCase());

      topic.subtopics.forEach((subtopic) => {
        if (subtopic.codingChallenge?.problemStatement) {
          const challengeSkills = subtopic.codingChallenge.skills || [];
          
          // Check if skills overlap
          const hasOverlappingSkills = currentSkills.some(skill => 
            challengeSkills.includes(skill)
          );

          if (isRelatedTopic || hasOverlappingSkills) {
            problems.push({
              subtopicTitle: subtopic.title,
              topicTitle: topic.title,
              problemStatement: subtopic.codingChallenge.problemStatement,
              skills: challengeSkills
            });
          }
        }
      });
    });
  });

  return problems;
};
