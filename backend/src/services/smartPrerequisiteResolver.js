/**
 * Smart Prerequisite Resolver
 * Recursively resolves prerequisites based on user proficiency
 * Skips prerequisites user already knows
 */

import { getSkill } from "./skillGraphService.js";
import { checkUserProficiency } from "./userProficiencyChecker.js";

// Maximum recursion depth to prevent infinite loops
const MAX_DEPTH = 5;

/**
 * Smart prerequisite resolution with proficiency checking
 * @param {string} targetSkillId - Target skill to learn
 * @param {Object} user - User document with globalSkills
 * @returns {Object} Resolution result with ordered skills
 */
export function smartResolvePrerequisites(targetSkillId, user) {
  console.log(`🎯 Smart prerequisite resolution for: ${targetSkillId}`);
  
  const visited = new Set();
  const ordered = [];
  const skipped = [];
  const proficiencyMap = new Map();
  
  /**
   * Depth-first search with proficiency checking
   * @param {string} skillId - Current skill to process
   * @param {number} depth - Current recursion depth
   */
  function dfs(skillId, depth = 0) {
    // Prevent infinite recursion
    if (depth > MAX_DEPTH) {
      console.warn(`⚠️  Max depth (${MAX_DEPTH}) reached for ${skillId}`);
      return;
    }
    
    // Avoid cycles
    if (visited.has(skillId)) {
      console.log(`  ↩️  Already visited: ${skillId}`);
      return;
    }
    
    visited.add(skillId);
    
    // Get skill from graph
    const skill = getSkill(skillId);
    if (!skill) {
      console.warn(`⚠️  Skill not found in graph: ${skillId}`);
      return;
    }
    
    console.log(`  📍 Processing: ${skillId} (depth: ${depth})`);
    
    // Check user proficiency
    const proficiency = checkUserProficiency(user, skillId);
    proficiencyMap.set(skillId, proficiency.isProficient);
    
    if (proficiency.isProficient) {
      // User knows this skill - skip its prerequisites
      skipped.push(skillId);
      console.log(`  ✅ User proficient in ${skillId}, skipping prerequisites`);
      return;
    }
    
    // User doesn't know this skill - check its prerequisites
    console.log(`  ❌ User NOT proficient in ${skillId}, checking prerequisites`);
    
    if (skill.prerequisites && Array.isArray(skill.prerequisites)) {
      console.log(`  📋 Prerequisites for ${skillId}: [${skill.prerequisites.join(', ')}]`);
      
      for (const prereqId of skill.prerequisites) {
        dfs(prereqId, depth + 1);
      }
    } else {
      console.log(`  📋 No prerequisites for ${skillId}`);
    }
    
    // Add this skill to ordered list (after its prerequisites)
    ordered.push(skillId);
    console.log(`  ➕ Added ${skillId} to ordered list`);
  }
  
  // Start DFS from target skill
  dfs(targetSkillId);
  
  // Filter out target skill from included skills (it's always last)
  const includedSkills = ordered.filter(id => id !== targetSkillId);
  
  console.log(`\n📊 Resolution Summary:`);
  console.log(`  🎯 Target: ${targetSkillId}`);
  console.log(`  📚 Ordered skills: [${ordered.join(', ')}]`);
  console.log(`  ✅ Skipped (proficient): [${skipped.join(', ')}]`);
  console.log(`  📖 Included (need to learn): [${includedSkills.join(', ')}]`);
  
  return {
    orderedSkills: ordered,
    skippedSkills: skipped,
    includedSkills,
    proficiencyMap,
    targetSkill: targetSkillId
  };
}

/**
 * Validate if skill exists in skill graph
 * @param {string} skillId - Skill ID to validate
 * @returns {boolean} True if skill exists
 */
export function validateSkillInGraph(skillId) {
  const skill = getSkill(skillId);
  const exists = skill !== undefined && skill !== null;
  
  if (exists) {
    console.log(`✅ Skill "${skillId}" exists in graph`);
  } else {
    console.log(`❌ Skill "${skillId}" NOT found in graph`);
  }
  
  return exists;
}

/**
 * Format skill ID for display (snake_case → Title Case)
 * @param {string} skillId - Skill ID in snake_case
 * @returns {string} Formatted skill name
 */
export function formatSkillForDisplay(skillId) {
  if (!skillId || typeof skillId !== 'string') {
    return '';
  }
  
  return skillId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
