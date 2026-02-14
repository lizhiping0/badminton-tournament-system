import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { team_id } = req.query;
    let sql = 'SELECT * FROM players';
    let params = [];
    
    if (team_id) {
      sql += ' WHERE team_id = ?';
      params = [team_id];
    }
    sql += ' ORDER BY create_time DESC';
    
    const players = prepare(sql).all(...params);
    res.json(players);
  } catch (error) {
    console.error('获取选手列表失败:', error);
    res.status(500).json({ error: '获取选手列表失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { team_id, player_name, gender } = req.body;
    
    if (!team_id) {
      return res.status(400).json({ error: '缺少队伍ID' });
    }
    if (!player_name || !player_name.trim()) {
      return res.status(400).json({ error: '选手姓名不能为空' });
    }
    
    const stmt = prepare('INSERT INTO players (team_id, player_name, gender) VALUES (?, ?, ?)');
    const result = stmt.run(team_id, player_name.trim(), gender || null);
    
    const player = prepare('SELECT * FROM players WHERE player_id = ?').get(result.lastInsertRowid);
    res.status(201).json(player);
  } catch (error) {
    console.error('创建选手失败:', error);
    res.status(500).json({ error: '创建选手失败: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { player_name, gender } = req.body;
    
    const existing = prepare('SELECT * FROM players WHERE player_id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '选手不存在' });
    }
    
    const stmt = prepare('UPDATE players SET player_name = ?, gender = ? WHERE player_id = ?');
    stmt.run(player_name || existing.player_name, gender || existing.gender, req.params.id);
    
    const player = prepare('SELECT * FROM players WHERE player_id = ?').get(req.params.id);
    res.json(player);
  } catch (error) {
    console.error('更新选手失败:', error);
    res.status(500).json({ error: '更新选手失败' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    prepare('DELETE FROM players WHERE player_id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除选手失败:', error);
    res.status(500).json({ error: '删除选手失败' });
  }
});

export default router;
