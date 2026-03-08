import { callSkillMappingAgent } from "../agents/skillMappingAgent.js";

export const mapToCanonicalSkills = async (rawSkills) => {
  if (!rawSkills || rawSkills.length === 0) {
    console.log("⚠️  mapToCanonicalSkills: No raw skills provided");
    return [];
  }

  try {
    console.log(`🔄 Mapping skills: ${rawSkills.join(', ')}`);
    
    const response = await callSkillMappingAgent(
      JSON.stringify(rawSkills),
      "skill-mapping-session"
    );

    console.log(`📥 Skill mapping agent response: ${response}`);

    const parsed = JSON.parse(response);
    const result = Array.isArray(parsed) ? parsed : [];
    
    console.log(`✅ Mapped to canonical skills: ${result.join(', ')}`);
    
    // CRITICAL: Only return skills that are actually canonical
    // If mapping returns empty or non-canonical skills, return empty array
    if (result.length === 0) {
      console.log("⚠️  Skill mapping returned empty - no canonical skills found");
      return [];
    }
    
    // Filter out any non-canonical skills (vague ones)
    const validSkills = result.filter(skill => {
      // Canonical skills use underscore format: arrays, linked_lists, dynamic_programming
      // Vague skills use spaces: "image processing", "matrix operations"
      const isCanonical = !skill.includes(' ') && skill.length > 0;
      if (!isCanonical) {
        console.log(`⚠️  Filtering out non-canonical skill: "${skill}"`);
      }
      return isCanonical;
    });
    
    console.log(`✅ Valid canonical skills: ${validSkills.join(', ')}`);
    return validSkills;
    
  } catch (err) {
    console.error("❌ Skill mapping failed:", err.message);
    console.error("Stack:", err.stack);
    
    // CRITICAL: Return empty array if mapping fails
    // Do NOT use raw skills as fallback
    console.log("⚠️  Returning empty array due to mapping error");
    return [];
  }
};
