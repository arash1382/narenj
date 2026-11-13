import { demoSeed } from "./data/demo.js";

const STORAGE_KEY = "naranj.demo.v1";
const copy = (value) => JSON.parse(JSON.stringify(value));

export function readStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version === demoSeed.version) return parsed;
      if (parsed.version === 1) {
        const migrated = {
          ...parsed,
          version: demoSeed.version,
          studentAvatarId: null,
          studentTourSeen: false,
          studentTourStatus: "not-started",
        };
        writeStore(migrated);
        return migrated;
      }
    }
  } catch (error) {
    console.warn("Naranj demo state could not be read from local storage.", error);
  }
  const fresh = copy(demoSeed);
  writeStore(fresh);
  return fresh;
}

export function writeStore(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Naranj demo state could not be saved in local storage.", error);
    return false;
  }
}

export function resetStore() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage can be unavailable */ }
  return readStore();
}

export function currentClass(state) {
  return state.classes.find((item) => item.id === state.activeClassId) || state.classes[0];
}

export function findSkill(skills, sourceRow) {
  return skills.find((skill) => skill.sourceRow === Number(sourceRow));
}

export function progressFor(state, sourceRow) {
  return state.skillProgress[String(sourceRow)] || { stage: "not-started", attempts: 0, lastPractisedAt: null };
}

export function markSkillAttempted(state, sourceRow) {
  const key = String(sourceRow);
  const current = progressFor(state, sourceRow);
  state.skillProgress[key] = {
    ...current,
    stage: current.stage === "not-started" ? "attempt" : current.stage,
    attempts: current.attempts + 1,
    lastPractisedAt: new Date().toISOString(),
  };
  writeStore(state);
}

export function assignmentForStudent(assignment, studentId) {
  return assignment.recipientMode === "class" || assignment.recipientIds.includes(studentId);
}
