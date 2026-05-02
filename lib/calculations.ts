// ============================================================
// Performance Calculation Logic
// ============================================================

import type { Appraisal } from '../types';

/**
 * Weights for performance calculation
 */
export const PERFORMANCE_WEIGHTS = {
  teaching: 0.5,    // 50%
  research: 0.3,    // 30%
  service: 0.2,     // 20%
};

/**
 * Performance category thresholds
 */
export const PERFORMANCE_CATEGORIES = {
  EXCELLENT: { min: 80, max: 100, label: 'Excellent' },
  GOOD: { min: 70, max: 79, label: 'Good' },
  AVERAGE: { min: 50, max: 69, label: 'Average' },
  POOR: { min: 0, max: 49, label: 'Poor' },
} as const;

/**
 * Calculate total performance score using weighted average
 * Formula: (Teaching × 0.5) + (Research × 0.3) + (Service × 0.2)
 */
export function calculateTotalScore(
  teachingScore: number,
  researchScore: number,
  serviceScore: number
): number {
  const total =
    teachingScore * PERFORMANCE_WEIGHTS.teaching +
    researchScore * PERFORMANCE_WEIGHTS.research +
    serviceScore * PERFORMANCE_WEIGHTS.service;

  return Math.round(total * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine performance category based on total score
 */
export function determineCategory(
  totalScore: number
): 'Excellent' | 'Good' | 'Average' | 'Poor' {
  if (totalScore >= 80) return 'Excellent';
  if (totalScore >= 70) return 'Good';
  if (totalScore >= 50) return 'Average';
  return 'Poor';
}

/**
 * Determine if promotion is recommended
 * Rule: Total score >= 80
 */
export function isPromotionRecommended(totalScore: number): boolean {
  return totalScore >= 80;
}

/**
 * Process appraisal data and compute all derived fields
 */
export function computeAppraisalMetrics(
  teachingScore: number,
  researchScore: number,
  serviceScore: number
) {
  // Validate input scores
  const scores = [teachingScore, researchScore, serviceScore];
  if (scores.some((score) => score < 0 || score > 100)) {
    throw new Error('Performance scores must be between 0 and 100');
  }

  const totalScore = calculateTotalScore(teachingScore, researchScore, serviceScore);
  const category = determineCategory(totalScore);
  const promotionRecommended = isPromotionRecommended(totalScore);

  return {
    total_score: totalScore,
    category,
    is_promotion_recommended: promotionRecommended,
  };
}

/**
 * Get promotion recommendation reason
 */
export function getPromotionReason(
  totalScore: number,
  category: string
): string {
  if (totalScore >= 80) {
    return `Score of ${totalScore} meets the promotion threshold (≥80). Performance category: ${category}`;
  }
  return `Score of ${totalScore} does not meet the promotion threshold (≥80). Performance category: ${category}`;
}

/**
 * Calculate performance improvement needed to reach a target
 */
export function calculateImprovementNeeded(
  currentScore: number,
  targetScore: number
): number {
  return Math.max(0, targetScore - currentScore);
}

/**
 * Generate performance summary statistics
 */
export function generatePerformanceSummary(appraisals: Appraisal[]) {
  if (appraisals.length === 0) {
    return {
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      excellent_count: 0,
      good_count: 0,
      average_count: 0,
      poor_count: 0,
    };
  }

  const scores = appraisals.map((a) => a.total_score);
  const categories = appraisals.map((a) => a.category);

  return {
    average_score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
    highest_score: Math.max(...scores),
    lowest_score: Math.min(...scores),
    excellent_count: categories.filter((c) => c === 'Excellent').length,
    good_count: categories.filter((c) => c === 'Good').length,
    average_count: categories.filter((c) => c === 'Average').length,
    poor_count: categories.filter((c) => c === 'Poor').length,
  };
}

export default {
  calculateTotalScore,
  determineCategory,
  isPromotionRecommended,
  computeAppraisalMetrics,
  getPromotionReason,
  calculateImprovementNeeded,
  generatePerformanceSummary,
};
