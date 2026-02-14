CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    event_year INTEGER,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT '筹备中',
    create_time TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_types (
    match_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    contact_person TEXT,
    contact_phone TEXT,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS players (
    player_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    gender TEXT,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE TABLE IF NOT EXISTS team_matches (
    team_match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    round_number INTEGER DEFAULT 1,
    team_a_id INTEGER NOT NULL,
    team_b_id INTEGER,
    match_time TEXT,
    venue TEXT,
    winner_team_id INTEGER,
    status TEXT DEFAULT '未开始',
    create_time TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (team_a_id) REFERENCES teams(team_id),
    FOREIGN KEY (team_b_id) REFERENCES teams(team_id),
    FOREIGN KEY (winner_team_id) REFERENCES teams(team_id)
);

CREATE TABLE IF NOT EXISTS matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_match_id INTEGER NOT NULL,
    match_type_id INTEGER NOT NULL,
    team_a_player1_id INTEGER,
    team_a_player2_id INTEGER,
    team_b_player1_id INTEGER,
    team_b_player2_id INTEGER,
    referee_name TEXT,
    game1_score_a INTEGER DEFAULT 0,
    game1_score_b INTEGER DEFAULT 0,
    game2_score_a INTEGER DEFAULT 0,
    game2_score_b INTEGER DEFAULT 0,
    game3_score_a INTEGER DEFAULT 0,
    game3_score_b INTEGER DEFAULT 0,
    winner_team_id INTEGER,
    status TEXT DEFAULT '未开始',
    create_time TEXT DEFAULT CURRENT_TIMESTAMP,
    update_time TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_match_id) REFERENCES team_matches(team_match_id),
    FOREIGN KEY (match_type_id) REFERENCES match_types(match_type_id),
    FOREIGN KEY (winner_team_id) REFERENCES teams(team_id)
);

CREATE TABLE IF NOT EXISTS score_corrections (
    correction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    original_game1_score_a INTEGER,
    original_game1_score_b INTEGER,
    original_game2_score_a INTEGER,
    original_game2_score_b INTEGER,
    original_game3_score_a INTEGER,
    original_game3_score_b INTEGER,
    new_game1_score_a INTEGER,
    new_game1_score_b INTEGER,
    new_game2_score_a INTEGER,
    new_game2_score_b INTEGER,
    new_game3_score_a INTEGER,
    new_game3_score_b INTEGER,
    correction_reason TEXT,
    correction_time TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(match_id)
);

CREATE TABLE IF NOT EXISTS standings (
    standing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    points_won INTEGER DEFAULT 0,
    points_lost INTEGER DEFAULT 0,
    ranking INTEGER,
    update_time TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

INSERT OR IGNORE INTO match_types (type_name, sort_order, is_active) VALUES ('男子双打', 1, 1);
INSERT OR IGNORE INTO match_types (type_name, sort_order, is_active) VALUES ('女子单打', 2, 1);
INSERT OR IGNORE INTO match_types (type_name, sort_order, is_active) VALUES ('男子单打', 3, 1);
INSERT OR IGNORE INTO match_types (type_name, sort_order, is_active) VALUES ('女子双打', 4, 1);
INSERT OR IGNORE INTO match_types (type_name, sort_order, is_active) VALUES ('混合双打', 5, 1);
