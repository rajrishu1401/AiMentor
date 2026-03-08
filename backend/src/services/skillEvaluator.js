const STRONG = 70;
const WEAK = 40;

export function evaluateSkills(prereqs, userSkills) {
  const userMap = new Map(
    userSkills.map(s => [s.skill, s.confidence])
  );

  const mastered = [];
  const weak = [];
  const missing = [];

  for (const skill of prereqs) {
    const confidence = userMap.get(skill);

    if (confidence === undefined) {
      missing.push(skill);
    } else if (confidence >= STRONG) {
      mastered.push(skill);
    } else if (confidence >= WEAK) {
      weak.push(skill);
    } else {
      weak.push(skill);
    }
  }

  return { mastered, weak, missing };
}
