// ============================================================
// TypeScript Type Definitions for the System
// ============================================================

export interface Lecturer {
  id?: number;
  name: string;
  email: string;
  department: string;
  rank: string;
  hire_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppraisalInput {
  lecturer_id: number;
  teaching_score: number;
  research_score: number;
  service_score: number;
  appraisal_date: string;
  reviewed_by?: string;
  comments?: string;
}

export interface Appraisal extends AppraisalInput {
  id?: number;
  total_score: number;
  category: 'Excellent' | 'Good' | 'Average' | 'Poor';
  is_promotion_recommended: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceMetrics {
  total_lecturers: number;
  average_performance_score: number;
  excellent_count: number;
  good_count: number;
  average_count: number;
  poor_count: number;
  promotion_candidates: number;
}

export interface PromotionRecommendation {
  lecturer_id: number;
  lecturer_name: string;
  department?: string;
  rank?: string;
  total_score: number;
  previous_score?: number | null;
  trend_delta?: number;
  category: string;
  recommendation?: 'Recommended for Promotion' | 'Not Recommended';
  is_recommended?: boolean;
  confidence_score?: number;
  risk_flags?: string[];
  decision_status?: 'Draft' | 'Reviewed' | 'Approved';
  reason: string;
  appraisal_date?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
