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
    status VARCHAR(20) NOT NULL CHECK (status IN ('check-in', 'check-out')),
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

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE users TO postgres;
GRANT ALL PRIVILEGES ON TABLE teams TO postgres;
GRANT ALL PRIVILEGES ON TABLE clocks TO postgres;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE teams_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE clocks_id_seq TO postgres;

-- Insert sample data
-- Note: password is 'password123' hashed with bcrypt (10 rounds)
-- Hash generated with: bcrypt.hash('password123', 10)

-- Insert managers (without team_id initially)
INSERT INTO users (email, password_hash, first_name, last_name, role, team_id) VALUES
('manager1@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Alice', 'Dubois', 'Manager', NULL),
('manager2@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Marc', 'Martin', 'Manager', NULL),
('manager3@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Sophie', 'Bernard', 'Manager', NULL);

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
('dev1@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Jean', 'Dupont', 'Employé', 1),
('dev2@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Marie', 'Leroy', 'Employé', 1),
('dev3@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Pierre', 'Moreau', 'Employé', 1),
-- Marketing team
('marketing1@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Julie', 'Petit', 'Employé', 2),
('marketing2@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Thomas', 'Roux', 'Employé', 2),
-- Support team
('support1@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Emma', 'Simon', 'Employé', 3),
('support2@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Lucas', 'Laurent', 'Employé', 3),
('support3@timemanager.com', '$2b$10$ip5lEofDeFSdQAp.InXseeVRAa//8ygEIUfemWlyFVb4ub91w43Am', 'Chloé', 'Michel', 'Employé', 3);

-- Insert clock data for the last 30 days
-- Jean Dupont (ID 4) - Dev team
INSERT INTO clocks (user_id, clock_time, status) VALUES
-- Week -4 (4 weeks ago)
(4, CURRENT_DATE - INTERVAL '28 days' + TIME '08:15:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '28 days' + TIME '17:30:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '27 days' + TIME '08:00:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '27 days' + TIME '17:00:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '26 days' + TIME '08:30:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '26 days' + TIME '17:45:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '25 days' + TIME '08:10:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '25 days' + TIME '17:15:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '24 days' + TIME '08:20:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '24 days' + TIME '17:20:00', 'check-out'),

-- Week -3 (3 weeks ago)
(4, CURRENT_DATE - INTERVAL '21 days' + TIME '08:05:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '21 days' + TIME '17:10:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '20 days' + TIME '08:25:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '20 days' + TIME '17:35:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '19 days' + TIME '08:00:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '19 days' + TIME '17:00:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '18 days' + TIME '08:15:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '18 days' + TIME '18:00:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '17 days' + TIME '08:30:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '17 days' + TIME '17:25:00', 'check-out'),

-- Week -2 (2 weeks ago)
(4, CURRENT_DATE - INTERVAL '14 days' + TIME '08:10:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '14 days' + TIME '17:15:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '13 days' + TIME '08:00:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '13 days' + TIME '17:30:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '12 days' + TIME '08:20:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '12 days' + TIME '17:20:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '11 days' + TIME '08:15:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '11 days' + TIME '17:40:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '10 days' + TIME '08:25:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '10 days' + TIME '17:30:00', 'check-out'),

-- Week -1 (last week)
(4, CURRENT_DATE - INTERVAL '7 days' + TIME '08:00:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '7 days' + TIME '17:05:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '6 days' + TIME '08:10:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '6 days' + TIME '17:15:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '5 days' + TIME '08:15:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '5 days' + TIME '17:30:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '4 days' + TIME '08:05:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '4 days' + TIME '17:10:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '3 days' + TIME '08:20:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '3 days' + TIME '17:25:00', 'check-out'),

-- This week
(4, CURRENT_DATE - INTERVAL '2 days' + TIME '08:00:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '2 days' + TIME '17:00:00', 'check-out'),
(4, CURRENT_DATE - INTERVAL '1 day' + TIME '08:15:00', 'check-in'),
(4, CURRENT_DATE - INTERVAL '1 day' + TIME '17:20:00', 'check-out');

-- Marie Leroy (ID 5) - Dev team
INSERT INTO clocks (user_id, clock_time, status) VALUES
-- Last 4 weeks with varied hours
(5, CURRENT_DATE - INTERVAL '28 days' + TIME '08:30:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '28 days' + TIME '17:45:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '27 days' + TIME '08:15:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '27 days' + TIME '17:30:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '26 days' + TIME '08:00:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '26 days' + TIME '17:00:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '25 days' + TIME '08:20:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '25 days' + TIME '17:35:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '21 days' + TIME '08:10:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '21 days' + TIME '17:15:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '20 days' + TIME '08:25:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '20 days' + TIME '17:40:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '19 days' + TIME '08:05:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '19 days' + TIME '17:10:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '18 days' + TIME '08:30:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '18 days' + TIME '18:00:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '14 days' + TIME '08:00:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '14 days' + TIME '17:00:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '13 days' + TIME '08:15:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '13 days' + TIME '17:25:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '12 days' + TIME '08:10:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '12 days' + TIME '17:15:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '11 days' + TIME '08:20:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '11 days' + TIME '17:30:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '7 days' + TIME '08:15:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '7 days' + TIME '17:20:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '6 days' + TIME '08:00:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '6 days' + TIME '17:00:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '5 days' + TIME '08:30:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '5 days' + TIME '17:45:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '4 days' + TIME '08:10:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '4 days' + TIME '17:15:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '2 days' + TIME '08:20:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '2 days' + TIME '17:30:00', 'check-out'),
(5, CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00', 'check-in'),
(5, CURRENT_DATE - INTERVAL '1 day' + TIME '17:10:00', 'check-out');

-- Pierre Moreau (ID 6) - Dev team
INSERT INTO clocks (user_id, clock_time, status) VALUES
(6, CURRENT_DATE - INTERVAL '28 days' + TIME '08:45:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '28 days' + TIME '17:50:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '27 days' + TIME '08:20:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '27 days' + TIME '17:25:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '26 days' + TIME '08:10:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '26 days' + TIME '17:15:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '21 days' + TIME '08:30:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '21 days' + TIME '17:40:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '20 days' + TIME '08:00:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '20 days' + TIME '17:00:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '19 days' + TIME '08:15:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '19 days' + TIME '17:30:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '18 days' + TIME '08:25:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '18 days' + TIME '17:35:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '14 days' + TIME '08:05:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '14 days' + TIME '17:10:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '13 days' + TIME '08:30:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '13 days' + TIME '17:45:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '12 days' + TIME '08:15:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '12 days' + TIME '17:20:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '7 days' + TIME '08:00:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '7 days' + TIME '17:00:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '6 days' + TIME '08:20:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '6 days' + TIME '17:30:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '5 days' + TIME '08:10:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '5 days' + TIME '17:15:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '4 days' + TIME '08:25:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '4 days' + TIME '17:40:00', 'check-out'),
(6, CURRENT_DATE - INTERVAL '1 day' + TIME '08:15:00', 'check-in'),
(6, CURRENT_DATE - INTERVAL '1 day' + TIME '17:25:00', 'check-out');

-- Julie Petit (ID 7) - Marketing team
INSERT INTO clocks (user_id, clock_time, status) VALUES
(7, CURRENT_DATE - INTERVAL '28 days' + TIME '09:00:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '28 days' + TIME '18:00:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '27 days' + TIME '08:45:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '27 days' + TIME '17:50:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '26 days' + TIME '08:30:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '26 days' + TIME '17:35:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '25 days' + TIME '09:15:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '25 days' + TIME '18:15:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '21 days' + TIME '08:50:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '21 days' + TIME '17:55:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '20 days' + TIME '08:30:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '20 days' + TIME '17:40:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '19 days' + TIME '09:00:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '19 days' + TIME '18:00:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '14 days' + TIME '08:40:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '14 days' + TIME '17:45:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '13 days' + TIME '09:10:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '13 days' + TIME '18:10:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '12 days' + TIME '08:55:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '12 days' + TIME '17:55:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '7 days' + TIME '08:30:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '7 days' + TIME '17:35:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '6 days' + TIME '09:00:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '6 days' + TIME '18:00:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '5 days' + TIME '08:45:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '5 days' + TIME '17:50:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '2 days' + TIME '08:30:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '2 days' + TIME '17:40:00', 'check-out'),
(7, CURRENT_DATE - INTERVAL '1 day' + TIME '09:00:00', 'check-in'),
(7, CURRENT_DATE - INTERVAL '1 day' + TIME '18:00:00', 'check-out');

-- Thomas Roux (ID 8) - Marketing team
INSERT INTO clocks (user_id, clock_time, status) VALUES
(8, CURRENT_DATE - INTERVAL '28 days' + TIME '08:20:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '28 days' + TIME '17:25:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '27 days' + TIME '08:10:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '27 days' + TIME '17:15:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '26 days' + TIME '08:35:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '26 days' + TIME '17:40:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '21 days' + TIME '08:15:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '21 days' + TIME '17:20:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '20 days' + TIME '08:40:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '20 days' + TIME '17:50:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '19 days' + TIME '08:25:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '19 days' + TIME '17:30:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '14 days' + TIME '08:30:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '14 days' + TIME '17:35:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '13 days' + TIME '08:00:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '13 days' + TIME '17:05:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '12 days' + TIME '08:45:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '12 days' + TIME '17:50:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '7 days' + TIME '08:20:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '7 days' + TIME '17:25:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '6 days' + TIME '08:10:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '6 days' + TIME '17:15:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '5 days' + TIME '08:30:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '5 days' + TIME '17:40:00', 'check-out'),
(8, CURRENT_DATE - INTERVAL '1 day' + TIME '08:15:00', 'check-in'),
(8, CURRENT_DATE - INTERVAL '1 day' + TIME '17:20:00', 'check-out');

-- Emma Simon (ID 9) - Support team
INSERT INTO clocks (user_id, clock_time, status) VALUES
(9, CURRENT_DATE - INTERVAL '28 days' + TIME '07:50:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '28 days' + TIME '16:55:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '27 days' + TIME '08:00:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '27 days' + TIME '17:00:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '26 days' + TIME '07:55:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '26 days' + TIME '17:05:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '25 days' + TIME '08:10:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '25 days' + TIME '17:15:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '21 days' + TIME '08:00:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '21 days' + TIME '17:00:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '20 days' + TIME '07:45:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '20 days' + TIME '16:50:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '19 days' + TIME '08:05:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '19 days' + TIME '17:10:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '18 days' + TIME '08:00:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '18 days' + TIME '17:00:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '14 days' + TIME '07:55:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '14 days' + TIME '16:55:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '13 days' + TIME '08:10:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '13 days' + TIME '17:15:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '12 days' + TIME '08:00:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '12 days' + TIME '17:00:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '7 days' + TIME '07:50:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '7 days' + TIME '16:55:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '6 days' + TIME '08:00:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '6 days' + TIME '17:05:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '5 days' + TIME '08:05:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '5 days' + TIME '17:10:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '4 days' + TIME '07:55:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '4 days' + TIME '17:00:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '2 days' + TIME '08:00:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '2 days' + TIME '17:00:00', 'check-out'),
(9, CURRENT_DATE - INTERVAL '1 day' + TIME '07:50:00', 'check-in'),
(9, CURRENT_DATE - INTERVAL '1 day' + TIME '16:55:00', 'check-out');

-- Lucas Laurent (ID 10) - Support team
INSERT INTO clocks (user_id, clock_time, status) VALUES
(10, CURRENT_DATE - INTERVAL '28 days' + TIME '08:25:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '28 days' + TIME '17:30:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '27 days' + TIME '08:15:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '27 days' + TIME '17:20:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '26 days' + TIME '08:30:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '26 days' + TIME '17:35:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '21 days' + TIME '08:20:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '21 days' + TIME '17:25:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '20 days' + TIME '08:10:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '20 days' + TIME '17:15:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '19 days' + TIME '08:35:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '19 days' + TIME '17:40:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '14 days' + TIME '08:15:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '14 days' + TIME '17:20:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '13 days' + TIME '08:25:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '13 days' + TIME '17:30:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '12 days' + TIME '08:20:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '12 days' + TIME '17:25:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '7 days' + TIME '08:10:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '7 days' + TIME '17:15:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '6 days' + TIME '08:30:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '6 days' + TIME '17:35:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '5 days' + TIME '08:20:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '5 days' + TIME '17:25:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '2 days' + TIME '08:15:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '2 days' + TIME '17:20:00', 'check-out'),
(10, CURRENT_DATE - INTERVAL '1 day' + TIME '08:25:00', 'check-in'),
(10, CURRENT_DATE - INTERVAL '1 day' + TIME '17:30:00', 'check-out');

-- Chloé Michel (ID 11) - Support team
INSERT INTO clocks (user_id, clock_time, status) VALUES
(11, CURRENT_DATE - INTERVAL '28 days' + TIME '08:40:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '28 days' + TIME '17:45:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '27 days' + TIME '08:30:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '27 days' + TIME '17:35:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '26 days' + TIME '08:20:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '26 days' + TIME '17:25:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '21 days' + TIME '08:35:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '21 days' + TIME '17:40:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '20 days' + TIME '08:45:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '20 days' + TIME '17:50:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '19 days' + TIME '08:25:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '19 days' + TIME '17:30:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '14 days' + TIME '08:30:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '14 days' + TIME '17:35:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '13 days' + TIME '08:40:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '13 days' + TIME '17:45:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '12 days' + TIME '08:35:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '12 days' + TIME '17:40:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '7 days' + TIME '08:20:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '7 days' + TIME '17:25:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '6 days' + TIME '08:45:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '6 days' + TIME '17:50:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '5 days' + TIME '08:30:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '5 days' + TIME '17:35:00', 'check-out'),
(11, CURRENT_DATE - INTERVAL '1 day' + TIME '08:40:00', 'check-in'),
(11, CURRENT_DATE - INTERVAL '1 day' + TIME '17:45:00', 'check-out');
