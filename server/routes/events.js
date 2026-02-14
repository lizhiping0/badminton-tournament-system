import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

function calculateEventStatus(eventId) {
  const teamMatches = prepare(`
    SELECT tm.team_match_id, tm.round_number, tm.status as tm_status, tm.winner_team_id
    FROM team_matches tm 
    WHERE tm.event_id = ?
    ORDER BY tm.round_number
  `).all(eventId);
  
  if (teamMatches.length === 0) {
    return '筹备中';
  }
  
  const allEnded = teamMatches.every(m => m.tm_status === '已结束');
  if (!allEnded) {
    if (teamMatches.some(m => m.tm_status === '进行中' || m.tm_status === '已结束')) {
      return '进行中';
    }
    
    for (const tm of teamMatches) {
      const matches = prepare(`
        SELECT status, winner_team_id 
        FROM matches 
        WHERE team_match_id = ?
      `).all(tm.team_match_id);
      
      for (const match of matches) {
        if (match.status === '进行中' || match.winner_team_id) {
          return '进行中';
        }
      }
    }
    return '筹备中';
  }
  
  const maxRound = Math.max(...teamMatches.map(m => m.round_number));
  const lastRoundMatches = teamMatches.filter(m => m.round_number === maxRound);
  const lastRoundWinners = lastRoundMatches.map(m => m.winner_team_id).filter(Boolean);
  
  if (lastRoundWinners.length <= 1) {
    return '已结束';
  }
  
  return '进行中';
}

router.get('/', (req, res) => {
  try {
    const events = prepare('SELECT * FROM events ORDER BY create_time DESC').all();
    const eventsWithStatus = events.map(event => ({
      ...event,
      status: calculateEventStatus(event.event_id)
    }));
    res.json(eventsWithStatus);
  } catch (error) {
    console.error('获取赛事列表失败:', error);
    res.status(500).json({ error: '获取赛事列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
    if (!event) {
      return res.status(404).json({ error: '赛事不存在' });
    }
    res.json({
      ...event,
      status: calculateEventStatus(event.event_id)
    });
  } catch (error) {
    console.error('获取赛事失败:', error);
    res.status(500).json({ error: '获取赛事失败' });
  }
});

router.post('/', (req, res) => {
  try {
    const { event_name, event_year, start_date, end_date } = req.body;
    
    if (!event_name || !event_name.trim()) {
      return res.status(400).json({ error: '赛事名称不能为空' });
    }
    
    const year = event_year || new Date().getFullYear();
    const startDate = start_date || null;
    const endDate = end_date || null;
    
    const stmt = prepare('INSERT INTO events (event_name, event_year, start_date, end_date) VALUES (?, ?, ?, ?)');
    const result = stmt.run(event_name.trim(), year, startDate, endDate);
    
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(result.lastInsertRowid);
    
    if (!event) {
      return res.status(500).json({ error: '创建赛事后获取失败' });
    }
    
    res.status(201).json(event);
  } catch (error) {
    console.error('创建赛事失败:', error);
    res.status(500).json({ error: '创建赛事失败: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { event_name, event_year, start_date, end_date, status } = req.body;
    
    const existing = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '赛事不存在' });
    }
    
    const stmt = prepare('UPDATE events SET event_name = ?, event_year = ?, start_date = ?, end_date = ?, status = ? WHERE event_id = ?');
    stmt.run(
      event_name || existing.event_name,
      event_year || existing.event_year,
      start_date || existing.start_date,
      end_date || existing.end_date,
      status || existing.status,
      req.params.id
    );
    
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id);
    res.json(event);
  } catch (error) {
    console.error('更新赛事失败:', error);
    res.status(500).json({ error: '更新赛事失败' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    prepare('DELETE FROM events WHERE event_id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除赛事失败:', error);
    res.status(500).json({ error: '删除赛事失败' });
  }
});

export default router;
