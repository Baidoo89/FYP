-- ============================================================
-- LECTURER PERFORMANCE ANALYSIS SYSTEM - DATABASE SCHEMA
-- ============================================================
-- This schema defines the core tables for the system
-- ============================================================

-- Create database
CREATE DATABASE IF NOT EXISTS lecturer_performance_db;
USE lecturer_performance_db;

-- ============================================================
-- TABLE: lecturers
-- Purpose: Store lecturer information
-- ============================================================
CREATE TABLE IF NOT EXISTS lecturers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    rank VARCHAR(50) NOT NULL,
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_department (department),
    INDEX idx_rank (rank),
    INDEX idx_active (is_active)
);

-- ============================================================
-- TABLE: appraisals
-- Purpose: Store performance appraisal records
-- ============================================================
CREATE TABLE IF NOT EXISTS appraisals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecturer_id INT NOT NULL,
    
    -- Performance scores (0-100)
    teaching_score DECIMAL(3, 1) NOT NULL CHECK (teaching_score >= 0 AND teaching_score <= 100),
    research_score DECIMAL(3, 1) NOT NULL CHECK (research_score >= 0 AND research_score <= 100),
    service_score DECIMAL(3, 1) NOT NULL CHECK (service_score >= 0 AND service_score <= 100),
    
    -- Computed fields
    total_score DECIMAL(5, 2) NOT NULL,
    category VARCHAR(20) NOT NULL,
    is_promotion_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata
    appraisal_date DATE NOT NULL,
    reviewed_by VARCHAR(255),
    comments TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
    
    -- Indexes for better query performance
    INDEX idx_lecturer_id (lecturer_id),
    INDEX idx_appraisal_date (appraisal_date),
    INDEX idx_category (category),
    INDEX idx_promotion (is_promotion_recommended),
    INDEX idx_lecturer_date (lecturer_id, appraisal_date DESC)
);

-- ============================================================
-- TABLE: performance_trends (for analytics)
-- Purpose: Track historical performance data by quarter/year
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecturer_id INT NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL,
    avg_teaching_score DECIMAL(5, 2),
    avg_research_score DECIMAL(5, 2),
    avg_service_score DECIMAL(5, 2),
    avg_total_score DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_lecturer_period (lecturer_id, year, quarter),
    INDEX idx_lecturer_year (lecturer_id, year)
);

-- ============================================================
-- TABLE: promotion_history
-- Purpose: Track promotion recommendations and actions
-- ============================================================
CREATE TABLE IF NOT EXISTS promotion_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lecturer_id INT NOT NULL,
    appraisal_id INT NOT NULL,
    recommended BOOLEAN NOT NULL,
    recommendation_date DATE NOT NULL,
    promotion_approved BOOLEAN DEFAULT NULL,
    approval_date DATE,
    action_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
    FOREIGN KEY (appraisal_id) REFERENCES appraisals(id) ON DELETE CASCADE,
    INDEX idx_lecturer_id (lecturer_id),
    INDEX idx_recommended (recommended),
    INDEX idx_approved (promotion_approved)
);

-- ============================================================
-- TABLE: admin_accounts
-- Purpose: Store admin user accounts for system access
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- ============================================================
-- Sample Data for Testing
-- ============================================================

-- Insert sample lecturers
INSERT INTO lecturers (name, email, department, rank, hire_date) VALUES
('Dr. John Smith', 'john.smith@university.edu', 'Computer Science', 'Associate Professor', '2015-09-01'),
('Dr. Sarah Johnson', 'sarah.johnson@university.edu', 'Computer Science', 'Lecturer', '2018-08-15'),
('Prof. Michael Brown', 'michael.brown@university.edu', 'Computer Science', 'Professor', '2010-01-10'),
('Dr. Emily Davis', 'emily.davis@university.edu', 'Information Systems', 'Lecturer', '2019-07-01'),
('Dr. Robert Wilson', 'robert.wilson@university.edu', 'Information Systems', 'Senior Lecturer', '2016-06-15');

-- Insert sample appraisals
INSERT INTO appraisals (
    lecturer_id, teaching_score, research_score, service_score,
    total_score, category, is_promotion_recommended, appraisal_date, reviewed_by
) VALUES
(1, 85.5, 78.0, 82.0, 82.35, 'Excellent', TRUE, '2026-03-15', 'Department Head'),
(2, 75.0, 68.5, 70.0, 71.45, 'Good', FALSE, '2026-03-15', 'Department Head'),
(3, 92.0, 88.0, 90.0, 89.60, 'Excellent', TRUE, '2026-03-15', 'Department Head'),
(4, 72.0, 65.0, 68.5, 68.95, 'Average', FALSE, '2026-03-15', 'Department Head'),
(5, 80.5, 75.0, 79.5, 78.65, 'Good', FALSE, '2026-03-15', 'Department Head');

-- ============================================================
-- Views for Dashboard Analytics
-- ============================================================

-- View: Latest appraisals for each lecturer
CREATE OR REPLACE VIEW latest_appraisals AS
SELECT 
    l.id,
    l.name,
    l.department,
    l.rank,
    a.id as appraisal_id,
    a.teaching_score,
    a.research_score,
    a.service_score,
    a.total_score,
    a.category,
    a.is_promotion_recommended,
    a.appraisal_date
FROM lecturers l
LEFT JOIN appraisals a ON l.id = a.lecturer_id
WHERE a.appraisal_date = (
    SELECT MAX(appraisal_date) 
    FROM appraisals 
    WHERE lecturer_id = l.id
)
ORDER BY l.id;

-- View: Promotion candidates
CREATE OR REPLACE VIEW promotion_candidates AS
SELECT 
    l.id,
    l.name,
    l.email,
    l.department,
    l.rank,
    a.total_score,
    a.category,
    a.appraisal_date,
    CASE 
        WHEN a.total_score >= 80 THEN 'Recommended'
        ELSE 'Not Recommended'
    END as promotion_status
FROM lecturers l
INNER JOIN appraisals a ON l.id = a.lecturer_id
WHERE a.appraisal_date = (
    SELECT MAX(appraisal_date) 
    FROM appraisals 
    WHERE lecturer_id = l.id
) AND a.total_score >= 80;

-- ============================================================
-- End of Schema
-- ============================================================
