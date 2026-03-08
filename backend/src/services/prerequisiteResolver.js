import { getSkill } from "./skillGraphService.js";

export function resolvePrerequisites(targetSkillId) {
  console.log("🔍 Resolving for:", targetSkillId);

  const visited = new Set();
  const ordered = [];

  function dfs(skillId) {
    const skill = getSkill(skillId);
    console.log("➡ Skill lookup:", skillId, skill);

    if (!skill || visited.has(skillId)) return;

    visited.add(skillId);

    for (const pre of skill.prerequisites) {
      dfs(pre);
    }

    ordered.push(skillId);
  }

  dfs(targetSkillId);

  return ordered.filter(id => id !== targetSkillId);
}

