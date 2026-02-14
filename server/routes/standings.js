import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { event_id } = req.query;
    
    if (!event_id) {
      return res.status(400).json({ error: '缺少event_id参数' });
    }
    
    const standings = prepare(`
      SELECT s.*, t.team_name
      FROM standings s
      JOIN teams t ON s.team_id = t.team_id
      WHERE s.event_id = ?
      ORDER BY s.total_points DESC, s.games_won - s.games_lost DESC, s.points_won - s.points_lost DESC
    `).all(event_id);
    
    res.json(standings);
  } catch (error) {
    console.error('获取排名失败:', error);
    res.status(500).json({ error: '获取排名失败' });
  }
});

router.post('/calculate', (req, res) => {
  try {
    const { event_id } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: '缺少event_id参数' });
    }
    
    prepare('DELETE FROM standings WHERE event_id = ?').run(event_id);
    
    const teams = prepare('SELECT team_id FROM teams WHERE event_id = ?').all(event_id);
    
    for (const team of teams) {
      const teamId = team.team_id;
      
      const matches = prepare(`
        SELECT m.*, tm.team_a_id, tm.team_b_id
        FROM matches m
        JOIN team_matches tm ON m.team_match_id = tm.team_match_id
        WHERE tm.event_id = ? AND (tm.team_a_id = ? OR tm.team_b_id = ?) AND m.winner_team_id IS NOT NULL
      `).all(event_id, teamId, teamId);
      
      let total_points = 0;
      let matches_won = 0;
      let matches_lost = 0;
      let games_won = 0;
      let games_lost = 0;
      let points_won = 0;
      let points_lost = 0;
      
      for (const match of matches) {
        const isTeamA = match.team_a_id === teamId;
        
        if (match.winner_team_id === teamId) {
          matches_won++;
          total_points++;
        } else {
          matches_lost++;
        }
        
        const scoreA = [match.game1_score_a, match.game2_score_a, match.game3_score_a];
        const scoreB = [match.game1_score_b, match.game2_score_b, match.game3_score_b];
        
        for (let i = 0; i < 3; i++) {
          const a = scoreA[i] || 0;
          const b = scoreB[i] || 0;
          if (a === 0 && b === 0) continue;
          
          if (isTeamA) {
            points_won += a;
            points_lost += b;
            if (a > b) games_won++;
            else games_lost++;
          } else {
            points_won += b;
            points_lost += a;
            if (b > a) games_won++;
            else games_lost++;
          }
        }
      }
      
      prepare(`
        INSERT INTO standings (event_id, team_id, total_points, matches_won, matches_lost, 
                               games_won, games_lost, points_won, points_lost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event_id, teamId, total_points, matches_won, matches_lost, games_won, games_lost, points_won, points_lost);
    }
    
    const sortedStandings = prepare(`
      SELECT s.*, t.team_name
      FROM standings s
      JOIN teams t ON s.team_id = t.team_id
      WHERE s.event_id = ?
      ORDER BY s.total_points DESC, s.games_won - s.games_lost DESC, s.points_won - s.points_lost DESC
    `).all(event_id);
    
    const updateRanking = prepare('UPDATE standings SET ranking = ? WHERE standing_id = ?');
    sortedStandings.forEach((standing, index) => {
      updateRanking.run(index + 1, standing.standing_id);
    });
    
    const finalStandings = prepare(`
      SELECT s.*, t.team_name
      FROM standings s
      JOIN teams t ON s.team_id = t.team_id
      WHERE s.event_id = ?
      ORDER BY s.ranking
    `).all(event_id);
    
    res.json(finalStandings);
  } catch (error) {
    console.error('计算成绩失败:', error);
    res.status(500).json({ error: '计算成绩失败: ' + error.message });
  }
});

export default router;
