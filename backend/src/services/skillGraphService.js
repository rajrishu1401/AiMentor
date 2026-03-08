import fs from "fs";

const skillGraphPath = new URL(
  "../config/skillGraph.json",
  import.meta.url
);

const raw = JSON.parse(
  fs.readFileSync(skillGraphPath, "utf-8")
);

const skillMap = new Map();
raw.skills.forEach(skill => {
  skillMap.set(skill.id, skill);
});

export const getSkill = (id) => skillMap.get(id);
