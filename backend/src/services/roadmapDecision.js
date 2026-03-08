export function decideRoadmap({ mastered, weak, missing }) {
  if (weak.length === 0 && missing.length === 0) {
    return "READY";
  }
  if (mastered.length === 0 && weak.length === 0) {
    return "FOUNDATION_REQUIRED";
  }
  return "REMEDIAL";
}
