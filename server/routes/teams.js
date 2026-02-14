import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { event_id } = req.query;
    let sql = 'SELECT * FROM teams';
    let params = [];
    
    if (event_id) {
      sql += ' WHERE event_id = ?';
      params = [event_id];
    }
    sql += ' ORDER BY create_time DESC';
    
    const teams = prepare(sql).all(...params);
    res.json(teams);
  } catch (error) {
    console.error('获取队伍列表失败:', error);
    res.status(500).json({ error: '获取队伍列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const team = prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
    if (!team) {
      return res.status(404).json({ error: '队伍不存在' });
    }
    const players = prepare('SELECT * FROM players WHERE team_id = ?').all(req.params.id);
    res.json({ ...team, players });
  } catch (error) {
    console.error('获取队伍失败:', error);
    res.status(500).json({ error: '获取队伍失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { event_id, team_name, contact_person, contact_phone } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: '缺少赛事ID' });
    }
    if (!team_name || !team_name.trim()) {
      return res.status(400).json({ error: '队伍名称不能为空' });
    }
    
    const stmt = prepare('INSERT INTO teams (event_id, team_name, contact_person, contact_phone) VALUES (?, ?, ?, ?)');
    const result = stmt.run(event_id, team_name.trim(), contact_person || null, contact_phone || null);
    
    const team = prepare('SELECT * FROM teams WHERE team_id = ?').get(result.lastInsertRowid);
    res.status(201).json(team);
  } catch (error) {
    console.error('创建队伍失败:', error);
    res.status(500).json({ error: '创建队伍失败: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { team_name, contact_person, contact_phone } = req.body;
    
    const existing = prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '队伍不存在' });
    }
    
    const stmt = prepare('UPDATE teams SET team_name = ?, contact_person = ?, contact_phone = ? WHERE team_id = ?');
    stmt.run(team_name || existing.team_name, contact_person || existing.contact_person, contact_phone || existing.contact_phone, req.params.id);
    
    const team = prepare('SELECT * FROM teams WHERE team_id = ?').get(req.params.id);
    res.json(team);
  } catch (error) {
    console.error('更新队伍失败:', error);
    res.status(500).json({ error: '更新队伍失败' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    prepare('DELETE FROM players WHERE team_id = ?').run(req.params.id);
    prepare('DELETE FROM teams WHERE team_id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除队伍失败:', error);
    res.status(500).json({ error: '删除队伍失败' });
  }
});

export default router;
