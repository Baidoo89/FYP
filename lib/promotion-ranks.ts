export const ACADEMIC_RANK_OPTIONS = [
  { value: 'ASSISTANT_LECTURER', label: 'Assistant Lecturer' },
  { value: 'LECTURER', label: 'Lecturer' },
  { value: 'SENIOR_LECTURER', label: 'Senior Lecturer' },
  { value: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
  { value: 'PROFESSOR', label: 'Professor' },
] as const;

export type AcademicRankValue = (typeof ACADEMIC_RANK_OPTIONS)[number]['value'];

export const PROMOTION_TARGETS_BY_CURRENT_RANK: Record<AcademicRankValue, AcademicRankValue[]> = {
  ASSISTANT_LECTURER: ['LECTURER'],
  LECTURER: ['SENIOR_LECTURER'],
  SENIOR_LECTURER: ['ASSOCIATE_PROFESSOR'],
  ASSOCIATE_PROFESSOR: ['PROFESSOR'],
  PROFESSOR: [],
};

export function formatAcademicRank(value?: string | null) {
  if (!value) return 'Not set';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export function normalizeAcademicRank(value?: string | null) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_') as AcademicRankValue;
}

export function getPromotionTargetOptions(currentRank?: string | null) {
  const normalized = normalizeAcademicRank(currentRank);
  const allowedTargets = PROMOTION_TARGETS_BY_CURRENT_RANK[normalized] || [];
  return ACADEMIC_RANK_OPTIONS.filter((rank) => allowedTargets.includes(rank.value));
}

export function isValidPromotionTarget(currentRank?: string | null, targetRank?: string | null) {
  const normalizedCurrentRank = normalizeAcademicRank(currentRank);
  const normalizedTargetRank = normalizeAcademicRank(targetRank);
  return Boolean(PROMOTION_TARGETS_BY_CURRENT_RANK[normalizedCurrentRank]?.includes(normalizedTargetRank));
}
