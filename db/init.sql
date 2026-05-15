-- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Assignment Status
CREATE TYPE assignment_status AS ENUM (
    'upcoming',
    'in_progress',
    'complete',
    'overdue'
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_uuid        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name        TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    password         TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    course_uuid      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid        UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    colour           TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    assignment_uuid  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid        UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    course_uuid      UUID NOT NULL REFERENCES courses(course_uuid) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    weight           DECIMAL(5,2),
    grade            DECIMAL(5,2),
    due_date         TIMESTAMPTZ,
    status           assignment_status NOT NULL DEFAULT 'upcoming',
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hobbies Table
CREATE TABLE IF NOT EXISTS hobbies (
    hobby_uuid      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid       UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    days_of_week    JSONB,
    days_of_month   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hobby Completions Table
CREATE TABLE IF NOT EXISTS hobby_completions (
    completion_uuid  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hobby_uuid       UUID NOT NULL REFERENCES hobbies(hobby_uuid) ON DELETE CASCADE,
    user_uuid        UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
    completed_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (hobby_uuid, completed_date)
);

-- Indexes
CREATE INDEX idx_assignments_user     ON assignments(user_uuid);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_status   ON assignments(status);
CREATE INDEX idx_courses_user         ON courses(user_uuid);
CREATE INDEX idx_hobbies_user         ON hobbies(user_uuid);
CREATE INDEX idx_completions_hobby    ON hobby_completions(hobby_uuid);
CREATE INDEX idx_completions_date     ON hobby_completions(completed_date);