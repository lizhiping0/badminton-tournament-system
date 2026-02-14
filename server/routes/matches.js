import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

function determineGameWinner(scoreA, scoreB) {
  if (scoreA === null || scoreB === null || (scoreA === 0 && scoreB === 0)) return null;
  if (scoreA >= 21 || scoreB >= 21) {
    if (Math.abs(scoreA - scoreB) >= 2) {
      return scoreA > scoreB ? 'A' : 'B';
    }
    if (scoreA === 30) return 'A';
    if (scoreB === 30) return 'B';
  }
  return null;
}

function determineMatchWinner(match) {
  const games = [
    { a: match.game1_score_a, b: match.game1_score_b },
    { a: match.game2_score_a, b: match.game2_score_b },
    { a: match.game3_score_a, b: match.game3_score_b }
  ];
  
  let winsA = 0, winsB = 0;
  
  for (const game of games) {
    const winner = determineGameWinner(game.a, game.b);
    if (winner === 'A') winsA++;
    else if (winner === 'B') winsB++;
  }
  
  if (winsA >= 2) return 'A';
  if (winsB >= 2) return 'B';
  return null;
}

router.get('/', (req, res) => {
  try {
    const { team_match_id } = req.query;
    let sql = `
      SELECT m.*, mt.type_name, mt.sort_order,
             ta.team_name as winner_team_name
      FROM matches m
      LEFT JOIN match_types mt ON m.match_type_id = mt.match_type_id
      LEFT JOIN teams ta ON m.winner_team_id = ta.team_id
    `;
    let params = [];
    
    if (team_match_id) {
      sql += ' WHERE m.team_match_id = ?';
      params = [team_match_id];
    }
    sql += ' ORDER BY mt.sort_order';
    
    const matches = prepare(sql).all(...params);
    res.json(matches);
  } catch (error) {
    console.error('获取比赛列表失败:', error);
    res.status(500).json({ error: '获取比赛列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const match = prepare(`
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
      WHERE m.match_id = ?
    `).get(req.params.id);
    
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }
    res.json(match);
  } catch (error) {
    console.error('获取比赛详情失败:', error);
    res.status(500).json({ error: '获取比赛详情失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { team_match_id, match_type_id, team_a_player1_id, team_a_player2_id, 
            team_b_player1_id, team_b_player2_id, referee_name } = req.body;
    
    if (!team_match_id) {
      return res.status(400).json({ error: '缺少团体赛ID' });
    }
    if (!match_type_id) {
      return res.status(400).json({ error: '缺少比赛项目ID' });
    }
    
    const stmt = prepare(`
      INSERT INTO matches (team_match_id, match_type_id, team_a_player1_id, team_a_player2_id, 
                           team_b_player1_id, team_b_player2_id, referee_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(team_match_id, match_type_id, 
                            team_a_player1_id || null, team_a_player2_id || null, 
                            team_b_player1_id || null, team_b_player2_id || null, 
                            referee_name || null);
    
    const match = prepare('SELECT * FROM matches WHERE match_id = ?').get(result.lastInsertRowid);
    res.status(201).json(match);
  } catch (error) {
    console.error('创建比赛失败:', error);
    res.status(500).json({ error: '创建比赛失败: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { team_a_player1_id, team_a_player2_id, team_b_player1_id, team_b_player2_id, referee_name } = req.body;
    
    const existing = prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '比赛不存在' });
    }
    
    const stmt = prepare(`
      UPDATE matches SET team_a_player1_id = ?, team_a_player2_id = ?, 
                         team_b_player1_id = ?, team_b_player2_id = ?, referee_name = ?
      WHERE match_id = ?
    `);
    stmt.run(
      team_a_player1_id !== undefined ? team_a_player1_id : existing.team_a_player1_id,
      team_a_player2_id !== undefined ? team_a_player2_id : existing.team_a_player2_id,
      team_b_player1_id !== undefined ? team_b_player1_id : existing.team_b_player1_id,
      team_b_player2_id !== undefined ? team_b_player2_id : existing.team_b_player2_id,
      referee_name !== undefined ? referee_name : existing.referee_name,
      req.params.id
    );
    
    const match = prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
    res.json(match);
  } catch (error) {
    console.error('更新比赛失败:', error);
    res.status(500).json({ error: '更新比赛失败' });
  }
});

router.put('/:id/score', (req, res) => {
  try {
    const { game1_score_a, game1_score_b, game2_score_a, game2_score_b, 
            game3_score_a, game3_score_b, status } = req.body;
    
    const match = prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }
    
    const tempMatch = { ...match, game1_score_a, game1_score_b, game2_score_a, game2_score_b, game3_score_a, game3_score_b };
    const winner = determineMatchWinner(tempMatch);
    
    let winner_team_id = null;
    if (winner === 'A') {
      const teamMatch = prepare('SELECT team_a_id FROM team_matches WHERE team_match_id = ?').get(match.team_match_id);
      winner_team_id = teamMatch?.team_a_id;
    } else if (winner === 'B') {
      const teamMatch = prepare('SELECT team_b_id FROM team_matches WHERE team_match_id = ?').get(match.team_match_id);
      winner_team_id = teamMatch?.team_b_id;
    }
    
    const newStatus = winner ? '已结束' : (status || '进行中');
    
    const stmt = prepare(`
      UPDATE matches SET game1_score_a = ?, game1_score_b = ?, game2_score_a = ?, game2_score_b = ?,
                         game3_score_a = ?, game3_score_b = ?, winner_team_id = ?, status = ?, update_time = datetime('now')
      WHERE match_id = ?
    `);
    stmt.run(game1_score_a || 0, game1_score_b || 0, game2_score_a || 0, game2_score_b || 0, 
             game3_score_a || 0, game3_score_b || 0, winner_team_id, newStatus, req.params.id);
    
    const updatedMatch = prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
    
    updateTeamMatchStatus(match.team_match_id);
    
    res.json(updatedMatch);
  } catch (error) {
    console.error('更新比分失败:', error);
    res.status(500).json({ error: '更新比分失败: ' + error.message });
  }
});

function updateTeamMatchStatus(teamMatchId) {
  try {
    const matches = prepare('SELECT * FROM matches WHERE team_match_id = ?').all(teamMatchId);
    const teamMatch = prepare('SELECT * FROM team_matches WHERE team_match_id = ?').get(teamMatchId);
    
    if (!teamMatch) return;
    
    let winsA = 0, winsB = 0;
    let hasOngoing = false;
    
    for (const match of matches) {
      if (match.winner_team_id === teamMatch.team_a_id) winsA++;
      else if (match.winner_team_id === teamMatch.team_b_id) winsB++;
      if (match.status === '进行中') hasOngoing = true;
    }
    
    let winner_team_id = null;
    let status = '未开始';
    
    if (winsA >= 3) {
      winner_team_id = teamMatch.team_a_id;
      status = '已结束';
    } else if (winsB >= 3) {
      winner_team_id = teamMatch.team_b_id;
      status = '已结束';
    } else if (winsA > 0 || winsB > 0 || hasOngoing) {
      status = '进行中';
    }
    
    prepare('UPDATE team_matches SET winner_team_id = ?, status = ? WHERE team_match_id = ?')
      .run(winner_team_id, status, teamMatchId);
  } catch (error) {
    console.error('更新团体赛状态失败:', error);
  }
}

router.post('/:id/correct', (req, res) => {
  try {
    const { game1_score_a, game1_score_b, game2_score_a, game2_score_b, 
            game3_score_a, game3_score_b, correction_reason } = req.body;
    
    const match = prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }
    
    const correctionStmt = prepare(`
      INSERT INTO score_corrections (match_id, original_game1_score_a, original_game1_score_b,
                                     original_game2_score_a, original_game2_score_b,
                                     original_game3_score_a, original_game3_score_b,
                                     new_game1_score_a, new_game1_score_b,
                                     new_game2_score_a, new_game2_score_b,
                                     new_game3_score_a, new_game3_score_b, correction_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    correctionStmt.run(req.params.id, match.game1_score_a, match.game1_score_b,
                       match.game2_score_a, match.game2_score_b,
                       match.game3_score_a, match.game3_score_b,
                       game1_score_a || 0, game1_score_b || 0, game2_score_a || 0, game2_score_b || 0,
                       game3_score_a || 0, game3_score_b || 0, correction_reason || '');
    
    const tempMatch = { ...match, game1_score_a, game1_score_b, game2_score_a, game2_score_b, game3_score_a, game3_score_b };
    const winner = determineMatchWinner(tempMatch);
    
    let winner_team_id = null;
    if (winner === 'A') {
      const teamMatch = prepare('SELECT team_a_id FROM team_matches WHERE team_match_id = ?').get(match.team_match_id);
      winner_team_id = teamMatch?.team_a_id;
    } else if (winner === 'B') {
      const teamMatch = prepare('SELECT team_b_id FROM team_matches WHERE team_match_id = ?').get(match.team_match_id);
      winner_team_id = teamMatch?.team_b_id;
    }
    
    const stmt = prepare(`
      UPDATE matches SET game1_score_a = ?, game1_score_b = ?, game2_score_a = ?, game2_score_b = ?,
                         game3_score_a = ?, game3_score_b = ?, winner_team_id = ?, update_time = datetime('now')
      WHERE match_id = ?
    `);
    stmt.run(game1_score_a || 0, game1_score_b || 0, game2_score_a || 0, game2_score_b || 0, 
             game3_score_a || 0, game3_score_b || 0, winner_team_id, req.params.id);
    
    updateTeamMatchStatus(match.team_match_id);
    
    const updatedMatch = prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id);
    res.json(updatedMatch);
  } catch (error) {
    console.error('修正比分失败:', error);
    res.status(500).json({ error: '修正比分失败: ' + error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    prepare('DELETE FROM matches WHERE match_id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除比赛失败:', error);
    res.status(500).json({ error: '删除比赛失败' });
  }
});

export default router;
