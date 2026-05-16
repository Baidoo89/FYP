import { DocumentCategory, EligibilityStatus, VerificationStatus } from '@prisma/client';

export const REQUIRED_CATEGORIES = [DocumentCategory.RESEARCH, DocumentCategory.TEACHING, DocumentCategory.SERVICE] as const;

export const CATEGORY_WEIGHTS: Record<DocumentCategory, number> = {
  [DocumentCategory.RESEARCH]: 40,
  [DocumentCategory.TEACHING]: 40,
  [DocumentCategory.SERVICE]: 20,
};

export type PromotionDocumentView = {
  category: DocumentCategory;
  verificationStatus: VerificationStatus;
};

export type EligibilityResult = {
  totalScore: number;
  eligibilityStatus: EligibilityStatus;
  readyForFinalDecision: boolean;
  allRequiredVerified: boolean;
};

export function evaluateEligibility(documents: PromotionDocumentView[]): EligibilityResult {
  const verifiedCategories = new Set<DocumentCategory>();
  const hasRejectedDocument = documents.some((document) => document.verificationStatus === VerificationStatus.REJECTED);

  for (const document of documents) {
    if (document.verificationStatus === VerificationStatus.VERIFIED) {
      verifiedCategories.add(document.category);
    }
  }

  const totalScore = REQUIRED_CATEGORIES.reduce((score, category) => {
    return verifiedCategories.has(category) ? score + CATEGORY_WEIGHTS[category] : score;
  }, 0);

  const allRequiredVerified = REQUIRED_CATEGORIES.every((category) => verifiedCategories.has(category));

  if (hasRejectedDocument) {
    return {
      totalScore,
      eligibilityStatus: EligibilityStatus.NOT_ELIGIBLE,
      readyForFinalDecision: true,
      allRequiredVerified,
    };
  }

  if (!allRequiredVerified) {
    return {
      totalScore,
      eligibilityStatus: EligibilityStatus.NEEDS_REVIEW,
      readyForFinalDecision: false,
      allRequiredVerified,
    };
  }

  if (totalScore >= 80) {
    return {
      totalScore,
      eligibilityStatus: EligibilityStatus.ELIGIBLE,
      readyForFinalDecision: true,
      allRequiredVerified,
    };
  }

  return {
    totalScore,
    eligibilityStatus: EligibilityStatus.NOT_ELIGIBLE,
    readyForFinalDecision: true,
    allRequiredVerified,
  };
}
