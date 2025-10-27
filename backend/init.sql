-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Manager', 'Employé')),
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    work_start_time TIME DEFAULT '08:00:00',
    work_end_time TIME DEFAULT '17:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for manager
ALTER TABLE teams
    ADD CONSTRAINT fk_teams_manager
    FOREIGN KEY (manager_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

-- Create clocks table for time tracking
CREATE TABLE IF NOT EXISTS clocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clock_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('check-in', 'check-out', 'absent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create absences table
CREATE TABLE IF NOT EXISTS absences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'other',
  reason TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_clocks_user_id ON clocks(user_id);
CREATE INDEX IF NOT EXISTS idx_clocks_clock_time ON clocks(clock_time);
CREATE INDEX IF NOT EXISTS idx_clocks_user_time ON clocks(user_id, clock_time DESC);
CREATE INDEX IF NOT EXISTS idx_clocks_status ON clocks(status);
CREATE INDEX IF NOT EXISTS idx_absences_user_id ON absences(user_id);
CREATE INDEX IF NOT EXISTS idx_absences_date ON absences(date);
CREATE INDEX IF NOT EXISTS idx_absences_user_date ON absences(user_id, date);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE users TO dev;
GRANT ALL PRIVILEGES ON TABLE teams TO dev;
GRANT ALL PRIVILEGES ON TABLE clocks TO dev;
GRANT ALL PRIVILEGES ON TABLE absences TO dev;
GRANT ALL PRIVILEGES ON TABLE password_reset_tokens TO dev;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO dev;
GRANT USAGE, SELECT ON SEQUENCE teams_id_seq TO dev;
GRANT USAGE, SELECT ON SEQUENCE clocks_id_seq TO dev;
GRANT USAGE, SELECT ON SEQUENCE absences_id_seq TO dev;
GRANT USAGE, SELECT ON SEQUENCE password_reset_tokens_id_seq TO dev;

-- Insert sample data
-- Note: password is 'password123' hashed with bcrypt (10 rounds)
-- Hash generated with: bcrypt.hash('password123', 10)

-- Insert managers (without team_id initially)
INSERT INTO users (email, password_hash, first_name, last_name, role, team_id) VALUES
('manager1@timeflow.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Alice', 'Dubois', 'Manager', NULL),
('manager2@timeflow.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Marc', 'Martin', 'Manager', NULL),
('manager3@timeflow.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Sophie', 'Bernard', 'Manager', NULL);

-- Insert teams with managers
INSERT INTO teams (name, description, manager_id) VALUES
('Équipe Développement', 'Équipe en charge du développement', 1),
('Équipe Marketing', 'Équipe en charge des campagnes marketing', 2),
('Équipe Support', 'Équipe en charge du support client', 3);

-- Update managers with their team_id
UPDATE users SET team_id = 1 WHERE id = 1;
UPDATE users SET team_id = 2 WHERE id = 2;
UPDATE users SET team_id = 3 WHERE id = 3;

-- Insert employees
INSERT INTO users (email, password_hash, first_name, last_name, role, team_id) VALUES
-- Dev team
('dev1@timeflow.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Jean', 'Dupont', 'Employé', 1),
-- Marketing team
('marketing1@timeflow.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Julie', 'Petit', 'Employé', 2),
-- Support team
('support1@timeflow.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Emma', 'Simon', 'Employé', 3);

-- Insert clock data for the last 30 days
-- Jean Dupont (ID 4) - Dev team
INSERT INTO clocks (user_id, clock_time, status) VALUES
-- This week
(4, CURRENT_DATE - INTERVAL '2 days' + TIME '08:00:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '2 days' + TIME '17:00:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '1 day' + TIME '08:15:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '1 day' + TIME '17:20:00', 'check-out');
