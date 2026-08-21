import { PromotionStage, PromotionTrackType } from '@prisma/client';

function addCalendarMonths(value: Date, months: number) {
  const result = new Date(value);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export function stageDueAt(stage: PromotionStage, trackType: PromotionTrackType, startedAt: Date) {
  if (stage === PromotionStage.DEPARTMENT) return addCalendarMonths(startedAt, 1);
  if (stage === PromotionStage.FACULTY && trackType === PromotionTrackType.SCHEDULE_J) return addCalendarMonths(startedAt, 2);
  if (stage === PromotionStage.RAPC && trackType === PromotionTrackType.SCHEDULE_K) return addCalendarMonths(startedAt, 1);
  if (stage === PromotionStage.FINAL_NOTIFICATION) return addDays(startedAt, 5);
  return null;
}

export function promotionCaseTiming(input: {
  trackType: PromotionTrackType;
  targetRankCode?: string | null;
  submittedAt: Date;
}) {
  let targetMonths: number | null = null;
  if (input.trackType === PromotionTrackType.SCHEDULE_J) {
    const target = input.targetRankCode || '';
    if (target === 'LECTURER' || target === 'RESEARCH_FELLOW') targetMonths = 6;
    if (target === 'SENIOR_LECTURER' || target === 'SENIOR_RESEARCH_FELLOW') targetMonths = 10;
    if (target === 'ASSOCIATE_PROFESSOR') targetMonths = 15;
    if (target === 'PROFESSOR') targetMonths = 18;
  } else if (input.trackType === PromotionTrackType.SCHEDULE_K) {
    targetMonths = 12;
  }

  return {
    caseDueAt: targetMonths ? addCalendarMonths(input.submittedAt, targetMonths) : null,
    nextApplicantUpdateDueAt: input.trackType === PromotionTrackType.SCHEDULE_J
      ? addCalendarMonths(input.submittedAt, 3)
      : null,
  };
}
