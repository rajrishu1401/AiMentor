/**
 * Topic Mapping Service
 * Maps user-provided topic names to canonical skills from skill graph
 */

import { callSkillMappingAgent } from "../agents/skillMappingAgent.js";
import { validateSkillInGraph } from "./smartPrerequisiteResolver.js";

/**
 * Map user topic input to canonical skill ID
 * @param {string} topicName - User-provided topic name (can be non-standard)
 * @returns {Promise<string|null>} Canonical skill ID or null if unmappable
 */
export async function mapUserTopicToCanonicalSkill(topicName) {
  console.log(`🔄 Mapping user topic to canonical skill: "${topicName}"`);
  
  if (!topicName || typeof topicName !== 'string' || topicName.trim() === '') {
    console.error('❌ Invalid topic name provided');
    return null;
  }
  
  try {
    // Call Skill Mapping Agent with single topic
    console.log(`📤 Calling Skill Mapping Agent with: ${JSON.stringify([topicName])}`);
    
    const response = await callSkillMappingAgent(
      JSON.stringify([topicName]),
      `topic-mapping-${Date.now()}`
    );
    
    console.log(`📥 Skill mapping agent raw response: "${response}"`);
    
    // Parse response
    let parsed;
    try {
      parsed = JSON.parse(response);
      console.log(`📊 Parsed response:`, parsed);
    } catch (parseErr) {
      console.error('❌ Failed to parse skill mapping response:', parseErr.message);
      console.error('Raw response was:', response);
      return null;
    }
    
    // Extract skill ID
    let skillId = null;
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Response is array of skills
      skillId = parsed[0];
      console.log(`📋 Extracted skill from array: "${skillId}"`);
    } else if (typeof parsed === 'string') {
      // Response is single skill string
      skillId = parsed;
      console.log(`📋 Extracted skill from string: "${skillId}"`);
    } else if (parsed && typeof parsed === 'object' && parsed.canonical_skill) {
      // Response is object with canonical_skill field
      skillId = parsed.canonical_skill;
      console.log(`📋 Extracted skill from object: "${skillId}"`);
    }
    
    if (!skillId || typeof skillId !== 'string' || skillId.trim() === '') {
      console.log('⚠️  Skill mapping returned empty or invalid result');
      return null;
    }
    
    // Clean up skill ID (remove spaces, convert to lowercase with underscores)
    skillId = skillId.trim().toLowerCase().replace(/\s+/g, '_');
    console.log(`🧹 Cleaned skill ID: "${skillId}"`);
    
    // Validate skill exists in graph
    const exists = validateSkillInGraph(skillId);
    
    if (!exists) {
      console.log(`⚠️  Mapped skill "${skillId}" not found in skill graph`);
      return null;
    }
    
    console.log(`✅ Successfully mapped "${topicName}" → "${skillId}"`);
    return skillId;
    
  } catch (err) {
    console.error('❌ Skill mapping failed:', err.message);
    console.error('Stack:', err.stack);
    
    // Handle specific error types
    if (err.message && err.message.includes('timeout')) {
      console.error('⏱️  Skill mapping agent timeout');
    } else if (err.message && err.message.includes('network')) {
      console.error('🌐 Network error during skill mapping');
    }
    
    return null;
  }
}

/**
 * Map multiple topics to canonical skills (batch operation)
 * @param {string[]} topicNames - Array of user-provided topic names
 * @returns {Promise<Map<string, string|null>>} Map of topic → skill ID
 */
export async function mapMultipleTopicsToCanonicalSkills(topicNames) {
  console.log(`🔄 Batch mapping ${topicNames.length} topics`);
  
  const results = new Map();
  
  for (const topic of topicNames) {
    const skillId = await mapUserTopicToCanonicalSkill(topic);
    results.set(topic, skillId);
  }
  
  console.log(`✅ Batch mapping complete: ${results.size} topics processed`);
  return results;
}
