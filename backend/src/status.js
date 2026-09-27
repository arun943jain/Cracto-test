const STEPS = [
  'Code freeze',
  'Run automated tests',
  'Review pull requests',
  'Build production bundle',
  'Update documentation',
  'Run database migrations',
  'Deploy to staging',
  'Deploy to production',
];

const TOTAL_STEPS = 8;

function calculateStatus(completedSteps) {
  const count = Array.isArray(completedSteps)
    ? new Set(completedSteps).size
    : 0;
  if (count <= 0) return 'planned';
  if (count >= TOTAL_STEPS) return 'done';
  return 'ongoing';
}

function normalizeSteps(completedSteps) {
  if (!Array.isArray(completedSteps)) return [];
  const set = new Set();
  for (const s of completedSteps) {
    if (Number.isInteger(s) && s >= 0 && s < TOTAL_STEPS) set.add(s);
  }
  return [...set].sort((a, b) => a - b);
}

function validateStepIndex(stepIndex) {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= TOTAL_STEPS) {
    const err = new Error(`Invalid stepIndex. Must be an integer between 0 and ${TOTAL_STEPS - 1}.`);
    err.code = 'BAD_USER_INPUT';
    throw err;
  }
}

function toReleaseDTO(release) {
  if (!release) return null;
  const completedSteps = normalizeSteps(release.completedSteps);
  return {
    id: release.id,
    name: release.name,
    date: release.date instanceof Date ? release.date.toISOString() : release.date,
    additionalInfo: release.additionalInfo ?? null,
    completedSteps,
    status: calculateStatus(completedSteps),
    createdAt: release.createdAt instanceof Date ? release.createdAt.toISOString() : release.createdAt,
    updatedAt: release.updatedAt instanceof Date ? release.updatedAt.toISOString() : release.updatedAt,
  };
}

module.exports = { STEPS, TOTAL_STEPS, calculateStatus, normalizeSteps, validateStepIndex, toReleaseDTO };
