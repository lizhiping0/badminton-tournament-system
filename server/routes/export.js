import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

router.get('/schedule/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: '赛事不存在' });
    }
    
    const teamMatches = prepare(`
      SELECT tm.*, 
             ta.team_name as team_a_name, 
             tb.team_name as team_b_name,
             tw.team_name as winner_team_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      LEFT JOIN teams tw ON tm.winner_team_id = tw.team_id
      WHERE tm.event_id = ?
      ORDER BY tm.round_number, tm.team_match_id
    `).all(eventId);
    
    res.json({ event, teamMatches });
  } catch (error) {
    console.error('导出赛程失败:', error);
    res.status(500).json({ error: '导出赛程失败' });
  }
});

router.get('/matches/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: '赛事不存在' });
    }
    
    const teams = prepare('SELECT * FROM teams WHERE event_id = ?').all(eventId);
    const teamMatches = prepare(`
      SELECT tm.*, 
             ta.team_name as team_a_name, 
             tb.team_name as team_b_name,
             tw.team_name as winner_team_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      LEFT JOIN teams tw ON tm.winner_team_id = tw.team_id
      WHERE tm.event_id = ?
      ORDER BY tm.round_number, tm.team_match_id
    `).all(eventId);
    
    const matches = [];
    for (const tm of teamMatches) {
      const matchDetails = prepare(`
        SELECT m.*, mt.type_name,
               p1.player_name as team_a_player1_name,
               p2.player_name as team_a_player2_name,
               p3.player_name as team_b_player1_name,
               p4.player_name as team_b_player2_name
        FROM matches m
        LEFT JOIN match_types mt ON m.match_type_id = mt.match_type_id
        LEFT JOIN players p1 ON m.team_a_player1_id = p1.player_id
        LEFT JOIN players p2 ON m.team_a_player2_id = p2.player_id
        LEFT JOIN players p3 ON m.team_b_player1_id = p3.player_id
        LEFT JOIN players p4 ON m.team_b_player2_id = p4.player_id
        WHERE m.team_match_id = ?
        ORDER BY mt.sort_order
      `).all(tm.team_match_id);
      matches.push({ ...tm, matchDetails });
    }
    
    res.json({ event, teams, matches });
  } catch (error) {
    console.error('导出比赛记录失败:', error);
    res.status(500).json({ error: '导出比赛记录失败' });
  }
});

router.get('/standings/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ error: '赛事不存在' });
    }
    
    const standings = prepare(`
      SELECT s.*, t.team_name
      FROM standings s
      JOIN teams t ON s.team_id = t.team_id
      WHERE s.event_id = ?
      ORDER BY s.ranking
    `).all(eventId);
    
    res.json({ event, standings });
  } catch (error) {
    console.error('导出成绩失败:', error);
    res.status(500).json({ error: '导出成绩失败' });
  }
});

export default router;
