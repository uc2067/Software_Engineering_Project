-- =========================
-- Drop tables (for reset)
-- =========================
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS developer_profiles CASCADE;
DROP TABLE IF EXISTS sprints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Developer'
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- =========================
-- DEVELOPER PROFILES TABLE
-- =========================
CREATE TABLE developer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    full_name VARCHAR(255),
    email VARCHAR(255),
    role_title VARCHAR(255),
    department VARCHAR(255),
    bio TEXT,

    skills TEXT,
    interests TEXT,
    experience_level VARCHAR(100),

    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),

    current_workload INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 5,
    availability_status VARCHAR(100)
);

-- =========================
-- SPRINTS TABLE
-- =========================
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    goal TEXT
);

-- =========================
-- TASKS TABLE
-- =========================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'To Do',
    required_skills TEXT,

    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sprint_id INTEGER REFERENCES sprints(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_status ON tasks(status);