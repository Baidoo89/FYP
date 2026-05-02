import fs from 'fs/promises';
import path from 'path';
import { getRows } from './db';

type LecturerRecord = {
  id: number;
  name: string;
  department: string;
  rank: string;
  is_active?: boolean;
};

type AppraisalRecord = {
  id: number;
  lecturer_id: number;
  teaching_score: number;
  research_score: number;
  service_score: number;
  total_score: number;
  category: 'Excellent' | 'Good' | 'Average' | 'Poor';
  is_promotion_recommended: boolean;
  appraisal_date: string;
  created_at?: string;
  updated_at?: string;
};

type LocalDatabaseShape = {
  lecturers: LecturerRecord[];
  appraisals: AppraisalRecord[];
};

type PromotionCandidate = {
  lecturer_id: number;
  lecturer_name: string;
  department: string;
  rank: string;
  total_score: number;
  previous_score: number | null;
  trend_delta: number;
  category: 'Excellent' | 'Good' | 'Average' | 'Poor';
  appraisal_date: string;
  confidence_score: number;
  risk_flags: string[];
  decision_status: 'Draft' | 'Reviewed' | 'Approved';
  decision_reason: string;
  recommendation: 'Recommended for Promotion' | 'Not Recommended';
};

type DepartmentAnalytics = {
  department: string;
  lecturers: number;
  appraisals: number;
  avg_total_score: number;
  promotion_candidates: number;
};

type TrendPoint = {
  appraisal_date: string;
  appraisals: number;
  avg_total_score: number;
  promotion_candidates: number;
};

export type ReportingData = {
  lecturers: LecturerRecord[];
  appraisals: AppraisalRecord[];
};

export type ReportingFilters = {
  department?: string;
  startDate?: string;
  endDate?: string;
};

const localDatabasePath = path.join(process.cwd(), 'storage', 'local-db.json');

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

async function readLocalDatabase(): Promise<ReportingData> {
  const raw = await fs.readFile(localDatabasePath, 'utf8');
  const parsed = JSON.parse(raw) as LocalDatabaseShape;

  return {
    lecturers: parsed.lecturers || [],
    appraisals: parsed.appraisals || [],
  };
}

export async function loadReportingData(): Promise<ReportingData> {
  try {
    const lecturers = (await getRows(
      'SELECT id, name, department, rank, is_active FROM lecturers ORDER BY id ASC'
    )) as LecturerRecord[];

    const appraisals = (await getRows(
      `SELECT
         id,
         lecturer_id,
         teaching_score,
         research_score,
         service_score,
         total_score,
         category,
         is_promotion_recommended,
         appraisal_date,
         created_at,
         updated_at
       FROM appraisals
       ORDER BY appraisal_date DESC, id DESC`
    )) as AppraisalRecord[];

    return { lecturers, appraisals };
  } catch {
    return readLocalDatabase();
  }
}

export function applyReportingFilters(data: ReportingData, filters: ReportingFilters) {
  const department = (filters.department || '').trim();
  const startDate = (filters.startDate || '').trim();
  const endDate = (filters.endDate || '').trim();

  let lecturers = [...data.lecturers];
  if (department) {
    lecturers = lecturers.filter((lecturer) => lecturer.department === department);
  }

  const allowedLecturer_ids = new Set(lecturers.map((lecturer) => lecturer.id));

  const appraisals = data.appraisals.filter((appraisal) => {
    if (!allowedLecturer_ids.has(appraisal.lecturer_id)) {
      return false;
    }

    if (startDate && appraisal.appraisal_date < startDate) {
      return false;
    }

    if (endDate && appraisal.appraisal_date > endDate) {
      return false;
    }

    return true;
  });

  return { lecturers, appraisals };
}

function getLatestAppraisalsByLecturer(appraisals: AppraisalRecord[]) {
  const latestByLecturer = new Map<number, AppraisalRecord>();

  const sorted = [...appraisals].sort((left, right) => {
    const leftTimestamp = new Date(left.appraisal_date).getTime();
    const rightTimestamp = new Date(right.appraisal_date).getTime();

    if (rightTimestamp !== leftTimestamp) {
      return rightTimestamp - leftTimestamp;
    }

    return right.id - left.id;
  });

  for (const appraisal of sorted) {
    if (!latestByLecturer.has(appraisal.lecturer_id)) {
      latestByLecturer.set(appraisal.lecturer_id, appraisal);
    }
  }

  return latestByLecturer;
}

export function computeDashboardMetrics(data: ReportingData) {
  const activeLecturers = data.lecturers.filter((lecturer) => lecturer.is_active !== false);
  const latestByLecturer = getLatestAppraisalsByLecturer(data.appraisals);
  const latestAppraisals = Array.from(latestByLecturer.values());

  const average =
    latestAppraisals.length === 0
      ? 0
      : roundToTwoDecimals(
          latestAppraisals.reduce((sum, appraisal) => sum + Number(appraisal.total_score || 0), 0) /
            latestAppraisals.length
        );

  const excellentCount = latestAppraisals.filter((appraisal) => appraisal.category === 'Excellent').length;
  const goodCount = latestAppraisals.filter((appraisal) => appraisal.category === 'Good').length;
  const averageCount = latestAppraisals.filter((appraisal) => appraisal.category === 'Average').length;
  const poorCount = latestAppraisals.filter((appraisal) => appraisal.category === 'Poor').length;

  const promotionCandidates = latestAppraisals.filter((appraisal) => Number(appraisal.total_score) >= 80).length;

  return {
    total_lecturers: activeLecturers.length,
    average_performance_score: average,
    excellent_count: excellentCount,
    good_count: goodCount,
    average_count: averageCount,
    poor_count: poorCount,
    promotion_candidates: promotionCandidates,
  };
}

export function computePromotionCandidates(data: ReportingData): PromotionCandidate[] {
  const lecturerById = new Map(data.lecturers.map((lecturer) => [lecturer.id, lecturer]));
  const latestByLecturer = getLatestAppraisalsByLecturer(data.appraisals);
  const historyByLecturer = new Map<number, AppraisalRecord[]>();

  for (const appraisal of data.appraisals) {
    const bucket = historyByLecturer.get(appraisal.lecturer_id) || [];
    bucket.push(appraisal);
    historyByLecturer.set(appraisal.lecturer_id, bucket);
  }

  for (const [lecturer_id, history] of historyByLecturer.entries()) {
    history.sort((left, right) => {
      const leftDate = new Date(left.appraisal_date).getTime();
      const rightDate = new Date(right.appraisal_date).getTime();

      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }

      return right.id - left.id;
    });

    historyByLecturer.set(lecturer_id, history);
  }

  return Array.from(latestByLecturer.values())
    .map((appraisal) => {
      const lecturer = lecturerById.get(appraisal.lecturer_id);
      if (!lecturer) {
        return null;
      }

      const history = historyByLecturer.get(appraisal.lecturer_id) || [appraisal];
      const previousScore = history.length > 1 ? Number(history[1].total_score) : null;
      const currentScore = Number(appraisal.total_score);
      const trendDelta = previousScore === null ? 0 : roundToTwoDecimals(currentScore - previousScore);
      const recentScores = history.slice(0, 4).map((record) => Number(record.total_score));
      const volatility = standardDeviation(recentScores);
      const recommended = currentScore >= 80;

      const riskFlags: string[] = [];

      if (trendDelta <= -5) {
        riskFlags.push('Declining Trend');
      }

      if (volatility >= 8) {
        riskFlags.push('High Volatility');
      }

      if (Number(appraisal.research_score) < 60) {
        riskFlags.push('Low Research Evidence');
      }

      if (currentScore >= 75 && currentScore < 83) {
        riskFlags.push('Borderline Threshold');
      }

      let confidenceScore = 85;
      if (history.length < 2) {
        confidenceScore -= 15;
      }
      confidenceScore -= Math.min(riskFlags.length * 8, 24);
      if (trendDelta > 0) {
        confidenceScore += 6;
      }
      confidenceScore = Math.max(45, Math.min(98, confidenceScore));

      const decisionStatus: 'Draft' | 'Reviewed' | 'Approved' =
        recommended && confidenceScore >= 75 ? 'Approved' : confidenceScore >= 60 ? 'Reviewed' : 'Draft';

      const decisionReason = recommended
        ? trendDelta >= 0
          ? 'Consistent high performance with stable or improving trend.'
          : 'High score achieved, but monitor recent decline before final action.'
        : trendDelta > 0
        ? 'Not yet at promotion threshold; progression is positive and should be tracked.'
        : 'Below promotion threshold with limited momentum; development plan is advised.';

      return {
        lecturer_id: lecturer.id,
        lecturer_name: lecturer.name,
        department: lecturer.department,
        rank: lecturer.rank,
        total_score: currentScore,
        previous_score: previousScore,
        trend_delta: trendDelta,
        category: appraisal.category,
        appraisal_date: appraisal.appraisal_date,
        confidence_score: confidenceScore,
        risk_flags: riskFlags,
        decision_status: decisionStatus,
        decision_reason: decisionReason,
        recommendation: recommended ? 'Recommended for Promotion' : 'Not Recommended',
      } as PromotionCandidate;
    })
    .filter((candidate): candidate is PromotionCandidate => Boolean(candidate))
    .sort((left, right) => right.total_score - left.total_score);
}

export function computeAnalyticsSummary(data: ReportingData) {
  const metrics = computeDashboardMetrics(data);
  const promotionCandidates = computePromotionCandidates(data);

  const lecturerById = new Map(data.lecturers.map((lecturer) => [lecturer.id, lecturer]));
  const departmentMap = new Map<string, { scores: number[]; lecturers: Set<number>; promotions: number; appraisals: number }>();

  for (const appraisal of data.appraisals) {
    const lecturer = lecturerById.get(appraisal.lecturer_id);
    if (!lecturer) {
      continue;
    }

    const bucket = departmentMap.get(lecturer.department) || {
      scores: [],
      lecturers: new Set<number>(),
      promotions: 0,
      appraisals: 0,
    };

    bucket.scores.push(Number(appraisal.total_score));
    bucket.lecturers.add(lecturer.id);
    bucket.appraisals += 1;

    if (Number(appraisal.total_score) >= 80) {
      bucket.promotions += 1;
    }

    departmentMap.set(lecturer.department, bucket);
  }

  const departments: DepartmentAnalytics[] = Array.from(departmentMap.entries())
    .map(([department, bucket]) => ({
      department,
      lecturers: bucket.lecturers.size,
      appraisals: bucket.appraisals,
      avg_total_score:
        bucket.scores.length === 0 ? 0 : roundToTwoDecimals(bucket.scores.reduce((sum, score) => sum + score, 0) / bucket.scores.length),
      promotion_candidates: bucket.promotions,
    }))
    .sort((left, right) => right.avg_total_score - left.avg_total_score);

  const trendMap = new Map<string, { scores: number[]; appraisals: number; promotions: number }>();

  for (const appraisal of data.appraisals) {
    const dateKey = appraisal.appraisal_date;
    const bucket = trendMap.get(dateKey) || {
      scores: [],
      appraisals: 0,
      promotions: 0,
    };

    bucket.scores.push(Number(appraisal.total_score));
    bucket.appraisals += 1;

    if (Number(appraisal.total_score) >= 80) {
      bucket.promotions += 1;
    }

    trendMap.set(dateKey, bucket);
  }

  const trends: TrendPoint[] = Array.from(trendMap.entries())
    .map(([appraisal_date, bucket]) => ({
      appraisal_date,
      appraisals: bucket.appraisals,
      avg_total_score:
        bucket.scores.length === 0 ? 0 : roundToTwoDecimals(bucket.scores.reduce((sum, score) => sum + score, 0) / bucket.scores.length),
      promotion_candidates: bucket.promotions,
    }))
    .sort((left, right) => {
      const leftDate = new Date(left.appraisal_date).getTime();
      const rightDate = new Date(right.appraisal_date).getTime();
      return leftDate - rightDate;
    });

  return {
    kpis: metrics,
    promotion_candidates: promotionCandidates,
    departments,
    trends,
  };
}
