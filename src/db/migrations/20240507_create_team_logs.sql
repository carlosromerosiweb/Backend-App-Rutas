-- Crear tabla de logs de equipos
CREATE TABLE IF NOT EXISTS team_logs (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_team_logs_team_id ON team_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_logs_user_id ON team_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_team_logs_action ON team_logs(action);
CREATE INDEX IF NOT EXISTS idx_team_logs_created_at ON team_logs(created_at); 