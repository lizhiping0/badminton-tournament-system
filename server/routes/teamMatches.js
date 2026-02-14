import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { event_id } = req.query;
    let sql = `
      SELECT tm.*, 
             ta.team_name as team_a_name, 
             tb.team_name as team_b_name,
             tw.team_name as winner_team_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      LEFT JOIN teams tw ON tm.winner_team_id = tw.team_id
    `;
    let params = [];
    
    if (event_id) {
      sql += ' WHERE tm.event_id = ?';
      params = [event_id];
    }
    sql += ' ORDER BY tm.round_number DESC, tm.match_time DESC, tm.team_match_id DESC';
    
    const teamMatches = prepare(sql).all(...params);
    res.json(teamMatches);
  } catch (error) {
    console.error('获取团体赛列表失败:', error);
    res.status(500).json({ error: '获取团体赛列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const teamMatch = prepare(`
      SELECT tm.*, 
             ta.team_name as team_a_name, 
             tb.team_name as team_b_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      WHERE tm.team_match_id = ?
    `).get(req.params.id);
    
    if (!teamMatch) {
      return res.status(404).json({ error: '团体赛不存在' });
    }
    
    const matches = prepare(`
      SELECT m.*, mt.type_name, mt.sort_order,
             ta.team_name as winner_team_name
      FROM matches m
      LEFT JOIN match_types mt ON m.match_type_id = mt.match_type_id
      LEFT JOIN teams ta ON m.winner_team_id = ta.team_id
      WHERE m.team_match_id = ?
      ORDER BY mt.sort_order
    `).all(req.params.id);
    
    res.json({ ...teamMatch, matches });
  } catch (error) {
    console.error('获取团体赛详情失败:', error);
    res.status(500).json({ error: '获取团体赛详情失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { event_id, round_number, team_a_id, team_b_id, match_time, venue } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: '缺少赛事ID' });
    }
    if (!team_a_id) {
      return res.status(400).json({ error: '缺少队伍A' });
    }
    
    const stmt = prepare('INSERT INTO team_matches (event_id, round_number, team_a_id, team_b_id, match_time, venue) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(event_id, round_number || 1, team_a_id, team_b_id || null, match_time || null, venue || null);
    
    const teamMatch = prepare('SELECT * FROM team_matches WHERE team_match_id = ?').get(result.lastInsertRowid);
    res.status(201).json(teamMatch);
  } catch (error) {
    console.error('创建团体赛失败:', error);
    res.status(500).json({ error: '创建团体赛失败: ' + error.message });
  }
});

router.post('/generate-bracket', (req, res) => {
  try {
    const { event_id } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: '缺少赛事ID' });
    }
    
    const teams = prepare('SELECT team_id FROM teams WHERE event_id = ?').all(event_id);
    const teamCount = teams.length;
    
    if (teamCount < 2) {
      return res.status(400).json({ error: '至少需要2支队伍才能生成对阵表' });
    }
    
    const existingMatches = prepare('SELECT * FROM team_matches WHERE event_id = ?').all(event_id);
    if (existingMatches.length > 0) {
      return res.status(400).json({ error: '该赛事已存在对阵表，请先清除' });
    }
    
    const insertStmt = prepare('INSERT INTO team_matches (event_id, round_number, team_a_id, team_b_id, winner_team_id, status) VALUES (?, ?, ?, ?, ?, ?)');
    
    const teamIds = teams.map(t => t.team_id);
    
    for (let i = 0; i < teamIds.length; i += 2) {
      const teamA = teamIds[i];
      const teamB = i + 1 < teamIds.length ? teamIds[i + 1] : null;
      if (teamB === null) {
        insertStmt.run(event_id, 1, teamA, null, teamA, '已结束');
      } else {
        insertStmt.run(event_id, 1, teamA, teamB, null, '未开始');
      }
    }
    
    const newMatches = prepare(`
      SELECT tm.*, ta.team_name as team_a_name, tb.team_name as team_b_name, tw.team_name as winner_team_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      LEFT JOIN teams tw ON tm.winner_team_id = tw.team_id
      WHERE tm.event_id = ?
      ORDER BY tm.round_number, tm.team_match_id
    `).all(event_id);
    
    res.status(201).json(newMatches);
  } catch (error) {
    console.error('生成对阵表失败:', error);
    res.status(500).json({ error: '生成对阵表失败: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { match_time, venue, winner_team_id, status } = req.body;
    
    const existing = prepare('SELECT * FROM team_matches WHERE team_match_id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '团体赛不存在' });
    }
    
    const stmt = prepare('UPDATE team_matches SET match_time = ?, venue = ?, winner_team_id = ?, status = ? WHERE team_match_id = ?');
    stmt.run(
      match_time !== undefined ? match_time : existing.match_time,
      venue !== undefined ? venue : existing.venue,
      winner_team_id !== undefined ? winner_team_id : existing.winner_team_id,
      status !== undefined ? status : existing.status,
      req.params.id
    );
    
    const teamMatch = prepare('SELECT * FROM team_matches WHERE team_match_id = ?').get(req.params.id);
    res.json(teamMatch);
  } catch (error) {
    console.error('更新团体赛失败:', error);
    res.status(500).json({ error: '更新团体赛失败' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    prepare('DELETE FROM matches WHERE team_match_id = ?').run(req.params.id);
    prepare('DELETE FROM team_matches WHERE team_match_id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除团体赛失败:', error);
    res.status(500).json({ error: '删除团体赛失败' });
  }
});

router.post('/generate-next-round', (req, res) => {
  try {
    const { event_id } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: '缺少赛事ID' });
    }
    
    const allMatches = prepare(`
      SELECT tm.*, ta.team_name as team_a_name, tb.team_name as team_b_name, tw.team_name as winner_team_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      LEFT JOIN teams tw ON tm.winner_team_id = tw.team_id
      WHERE tm.event_id = ?
      ORDER BY tm.round_number, tm.team_match_id
    `).all(event_id);
    
    if (allMatches.length === 0) {
      return res.status(400).json({ error: '请先生成对阵表' });
    }
    
    const maxRound = Math.max(...allMatches.map(m => m.round_number));
    const currentRoundMatches = allMatches.filter(m => m.round_number === maxRound);
    
    const allEnded = currentRoundMatches.every(m => m.status === '已结束');
    if (!allEnded) {
      return res.status(400).json({ error: '当前轮次还有比赛未结束' });
    }
    
    const winners = currentRoundMatches.map(m => m.winner_team_id).filter(Boolean);
    
    if (winners.length < 2) {
      return res.status(400).json({ error: '比赛已全部结束，无需生成下一轮' });
    }
    
    let nextRound;
    if (winners.length === 2) {
      nextRound = 4;
    } else if (winners.length === 4) {
      nextRound = 3;
    } else {
      nextRound = maxRound + 1;
    }
    
    const insertStmt = prepare('INSERT INTO team_matches (event_id, round_number, team_a_id, team_b_id, winner_team_id, status) VALUES (?, ?, ?, ?, ?, ?)');
    
    for (let i = 0; i < winners.length; i += 2) {
      const teamA = winners[i];
      const teamB = i + 1 < winners.length ? winners[i + 1] : null;
      if (teamB === null) {
        insertStmt.run(event_id, nextRound, teamA, null, teamA, '已结束');
      } else {
        insertStmt.run(event_id, nextRound, teamA, teamB, null, '未开始');
      }
    }
    
    const newMatches = prepare(`
      SELECT tm.*, ta.team_name as team_a_name, tb.team_name as team_b_name, tw.team_name as winner_team_name
      FROM team_matches tm
      LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id
      LEFT JOIN teams tw ON tm.winner_team_id = tw.team_id
      WHERE tm.event_id = ?
      ORDER BY tm.round_number, tm.team_match_id
    `).all(event_id);
    
    res.status(201).json(newMatches);
  } catch (error) {
    console.error('生成下一轮失败:', error);
    res.status(500).json({ error: '生成下一轮失败: ' + error.message });
  }
});

export default router;
