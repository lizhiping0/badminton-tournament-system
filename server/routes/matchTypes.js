import express from 'express';
import { prepare } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const matchTypes = prepare('SELECT * FROM match_types WHERE is_active = 1 ORDER BY sort_order').all();
  res.json(matchTypes);
});

router.post('/', (req, res) => {
  const { type_name, sort_order } = req.body;
  const stmt = prepare('INSERT INTO match_types (type_name, sort_order) VALUES (?, ?)');
  const result = stmt.run(type_name, sort_order);
  const matchType = prepare('SELECT * FROM match_types WHERE match_type_id = ?').get(result.lastInsertRowid);
  res.status(201).json(matchType);
});

router.put('/:id', (req, res) => {
  const { type_name, sort_order, is_active } = req.body;
  const stmt = prepare('UPDATE match_types SET type_name = ?, sort_order = ?, is_active = ? WHERE match_type_id = ?');
  stmt.run(type_name, sort_order, is_active, req.params.id);
  const matchType = prepare('SELECT * FROM match_types WHERE match_type_id = ?').get(req.params.id);
  res.json(matchType);
});

export default router;
