import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const testDbPath = path.join(__dirname, '../test-data/test.db')

let app
let db

async function createTestApp() {
  const express = (await import('express')).default
  const cors = (await import('cors')).default
  const initSqlJs = (await import('sql.js')).default
  
  const SQL = await initSqlJs()
  db = new SQL.Database()
  
  const schema = fs.readFileSync(path.join(__dirname, '../server/db/schema.sql'), 'utf-8')
  const statements = schema.split(';').filter(s => s.trim())
  statements.forEach(stmt => {
    if (stmt.trim()) {
      try {
        db.run(stmt)
      } catch (e) {}
    }
  })
  
  const prepare = (sqlText) => ({
    run: (...params) => {
      db.run(sqlText, params)
      const lastIdResult = db.exec("SELECT last_insert_rowid()")
      const lastId = lastIdResult.length > 0 && lastIdResult[0].values.length > 0 
        ? lastIdResult[0].values[0][0] : 0
      return { lastInsertRowid: lastId, changes: 1 }
    },
    get: (...params) => {
      const stmt = db.prepare(sqlText)
      stmt.bind(params)
      if (stmt.step()) {
        const row = stmt.getAsObject()
        stmt.free()
        return row
      }
      stmt.free()
      return undefined
    },
    all: (...params) => {
      const results = []
      const stmt = db.prepare(sqlText)
      stmt.bind(params)
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    }
  })
  
  const testApp = express()
  testApp.use(cors())
  testApp.use(express.json())
  
  const eventsRouter = express.Router()
  eventsRouter.get('/', (req, res) => {
    const events = prepare('SELECT * FROM events ORDER BY create_time DESC').all()
    res.json(events)
  })
  eventsRouter.get('/:id', (req, res) => {
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id)
    if (!event) return res.status(404).json({ error: '赛事不存在' })
    res.json(event)
  })
  eventsRouter.post('/', (req, res) => {
    const { event_name, event_year, start_date, end_date } = req.body
    if (!event_name || !event_name.trim()) {
      return res.status(400).json({ error: '赛事名称不能为空' })
    }
    const stmt = prepare('INSERT INTO events (event_name, event_year, start_date, end_date) VALUES (?, ?, ?, ?)')
    const result = stmt.run(event_name.trim(), event_year || new Date().getFullYear(), start_date || null, end_date || null)
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(result.lastInsertRowid)
    res.status(201).json(event)
  })
  eventsRouter.put('/:id', (req, res) => {
    const { event_name, event_year, start_date, end_date, status } = req.body
    const existing = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: '赛事不存在' })
    prepare('UPDATE events SET event_name = ?, event_year = ?, start_date = ?, end_date = ?, status = ? WHERE event_id = ?')
      .run(event_name || existing.event_name, event_year || existing.event_year, start_date || existing.start_date, end_date || existing.end_date, status || existing.status, req.params.id)
    const event = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id)
    res.json(event)
  })
  eventsRouter.delete('/:id', (req, res) => {
    prepare('DELETE FROM events WHERE event_id = ?').run(req.params.id)
    res.json({ message: '删除成功' })
  })
  
  testApp.use('/api/events', eventsRouter)
  
  const teamsRouter = express.Router()
  teamsRouter.get('/', (req, res) => {
    const { event_id } = req.query
    let sql = 'SELECT * FROM teams'
    let params = []
    if (event_id) {
      sql += ' WHERE event_id = ?'
      params = [event_id]
    }
    sql += ' ORDER BY create_time DESC'
    res.json(prepare(sql).all(...params))
  })
  teamsRouter.post('/', (req, res) => {
    const { event_id, team_name, contact_person, contact_phone } = req.body
    if (!event_id) return res.status(400).json({ error: '缺少赛事ID' })
    if (!team_name || !team_name.trim()) return res.status(400).json({ error: '队伍名称不能为空' })
    const stmt = prepare('INSERT INTO teams (event_id, team_name, contact_person, contact_phone) VALUES (?, ?, ?, ?)')
    const result = stmt.run(event_id, team_name.trim(), contact_person || null, contact_phone || null)
    const team = prepare('SELECT * FROM teams WHERE team_id = ?').get(result.lastInsertRowid)
    res.status(201).json(team)
  })
  teamsRouter.delete('/:id', (req, res) => {
    prepare('DELETE FROM players WHERE team_id = ?').run(req.params.id)
    prepare('DELETE FROM teams WHERE team_id = ?').run(req.params.id)
    res.json({ message: '删除成功' })
  })
  
  testApp.use('/api/teams', teamsRouter)
  
  const playersRouter = express.Router()
  playersRouter.get('/', (req, res) => {
    const { team_id } = req.query
    let sql = 'SELECT * FROM players'
    let params = []
    if (team_id) {
      sql += ' WHERE team_id = ?'
      params = [team_id]
    }
    res.json(prepare(sql).all(...params))
  })
  playersRouter.post('/', (req, res) => {
    const { team_id, player_name, gender } = req.body
    if (!team_id) return res.status(400).json({ error: '缺少队伍ID' })
    if (!player_name || !player_name.trim()) return res.status(400).json({ error: '选手姓名不能为空' })
    const stmt = prepare('INSERT INTO players (team_id, player_name, gender) VALUES (?, ?, ?)')
    const result = stmt.run(team_id, player_name.trim(), gender || null)
    const player = prepare('SELECT * FROM players WHERE player_id = ?').get(result.lastInsertRowid)
    res.status(201).json(player)
  })
  playersRouter.delete('/:id', (req, res) => {
    prepare('DELETE FROM players WHERE player_id = ?').run(req.params.id)
    res.json({ message: '删除成功' })
  })
  
  testApp.use('/api/players', playersRouter)
  
  const matchTypesRouter = express.Router()
  matchTypesRouter.get('/', (req, res) => {
    res.json(prepare('SELECT * FROM match_types WHERE is_active = 1 ORDER BY sort_order').all())
  })
  
  testApp.use('/api/match-types', matchTypesRouter)
  
  const teamMatchesRouter = express.Router()
  teamMatchesRouter.get('/', (req, res) => {
    const { event_id } = req.query
    let sql = `SELECT tm.*, ta.team_name as team_a_name, tb.team_name as team_b_name
               FROM team_matches tm LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
               LEFT JOIN teams tb ON tm.team_b_id = tb.team_id`
    let params = []
    if (event_id) {
      sql += ' WHERE tm.event_id = ?'
      params = [event_id]
    }
    res.json(prepare(sql).all(...params))
  })
  teamMatchesRouter.post('/', (req, res) => {
    const { event_id, round_number, team_a_id, team_b_id } = req.body
    if (!event_id) return res.status(400).json({ error: '缺少赛事ID' })
    if (!team_a_id) return res.status(400).json({ error: '缺少队伍A' })
    const stmt = prepare('INSERT INTO team_matches (event_id, round_number, team_a_id, team_b_id) VALUES (?, ?, ?, ?)')
    const result = stmt.run(event_id, round_number || 1, team_a_id, team_b_id || null)
    const teamMatch = prepare('SELECT * FROM team_matches WHERE team_match_id = ?').get(result.lastInsertRowid)
    res.status(201).json(teamMatch)
  })
  teamMatchesRouter.post('/generate-bracket', (req, res) => {
    const { event_id } = req.body
    if (!event_id) return res.status(400).json({ error: '缺少赛事ID' })
    const teams = prepare('SELECT team_id FROM teams WHERE event_id = ?').all(event_id)
    if (teams.length < 2) return res.status(400).json({ error: '至少需要2支队伍才能生成对阵表' })
    const existing = prepare('SELECT * FROM team_matches WHERE event_id = ?').all(event_id)
    if (existing.length > 0) return res.status(400).json({ error: '该赛事已存在对阵表，请先清除' })
    const insertStmt = prepare('INSERT INTO team_matches (event_id, round_number, team_a_id, team_b_id) VALUES (?, ?, ?, ?)')
    const teamIds = teams.map(t => t.team_id)
    for (let i = 0; i < teamIds.length; i += 2) {
      const teamA = teamIds[i]
      const teamB = i + 1 < teamIds.length ? teamIds[i + 1] : null
      insertStmt.run(event_id, 1, teamA, teamB)
    }
    res.status(201).json(prepare(`SELECT tm.*, ta.team_name as team_a_name, tb.team_name as team_b_name
      FROM team_matches tm LEFT JOIN teams ta ON tm.team_a_id = ta.team_id
      LEFT JOIN teams tb ON tm.team_b_id = tb.team_id WHERE tm.event_id = ?`).all(event_id))
  })
  teamMatchesRouter.delete('/:id', (req, res) => {
    prepare('DELETE FROM matches WHERE team_match_id = ?').run(req.params.id)
    prepare('DELETE FROM team_matches WHERE team_match_id = ?').run(req.params.id)
    res.json({ message: '删除成功' })
  })
  
  testApp.use('/api/team-matches', teamMatchesRouter)
  
  const matchesRouter = express.Router()
  matchesRouter.get('/', (req, res) => {
    const { team_match_id } = req.query
    let sql = `SELECT m.*, mt.type_name FROM matches m LEFT JOIN match_types mt ON m.match_type_id = mt.match_type_id`
    let params = []
    if (team_match_id) {
      sql += ' WHERE m.team_match_id = ?'
      params = [team_match_id]
    }
    res.json(prepare(sql).all(...params))
  })
  matchesRouter.post('/', (req, res) => {
    const { team_match_id, match_type_id } = req.body
    if (!team_match_id) return res.status(400).json({ error: '缺少团体赛ID' })
    if (!match_type_id) return res.status(400).json({ error: '缺少比赛项目ID' })
    const stmt = prepare('INSERT INTO matches (team_match_id, match_type_id) VALUES (?, ?)')
    const result = stmt.run(team_match_id, match_type_id)
    const match = prepare('SELECT * FROM matches WHERE match_id = ?').get(result.lastInsertRowid)
    res.status(201).json(match)
  })
  matchesRouter.put('/:id/score', (req, res) => {
    const { game1_score_a, game1_score_b, game2_score_a, game2_score_b, game3_score_a, game3_score_b } = req.body
    prepare(`UPDATE matches SET game1_score_a = ?, game1_score_b = ?, game2_score_a = ?, game2_score_b = ?, game3_score_a = ?, game3_score_b = ?, status = '已结束' WHERE match_id = ?`)
      .run(game1_score_a || 0, game1_score_b || 0, game2_score_a || 0, game2_score_b || 0, game3_score_a || 0, game3_score_b || 0, req.params.id)
    res.json(prepare('SELECT * FROM matches WHERE match_id = ?').get(req.params.id))
  })
  
  testApp.use('/api/matches', matchesRouter)
  
  const standingsRouter = express.Router()
  standingsRouter.get('/', (req, res) => {
    const { event_id } = req.query
    if (!event_id) return res.status(400).json({ error: '缺少event_id参数' })
    res.json(prepare('SELECT s.*, t.team_name FROM standings s JOIN teams t ON s.team_id = t.team_id WHERE s.event_id = ?').all(event_id))
  })
  standingsRouter.post('/calculate', (req, res) => {
    const { event_id } = req.body
    if (!event_id) return res.status(400).json({ error: '缺少event_id参数' })
    prepare('DELETE FROM standings WHERE event_id = ?').run(event_id)
    const teams = prepare('SELECT team_id FROM teams WHERE event_id = ?').all(event_id)
    for (const team of teams) {
      prepare('INSERT INTO standings (event_id, team_id) VALUES (?, ?)').run(event_id, team.team_id)
    }
    res.json(prepare('SELECT s.*, t.team_name FROM standings s JOIN teams t ON s.team_id = t.team_id WHERE s.event_id = ?').all(event_id))
  })
  
  testApp.use('/api/standings', standingsRouter)
  
  testApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })
  
  return testApp
}

describe('API Tests', () => {
  beforeAll(async () => {
    app = await createTestApp()
  })
  
  describe('Health Check', () => {
    it('GET /api/health - 应返回服务状态', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
  })
  
  describe('Events API', () => {
    it('GET /api/events - 应返回空数组', async () => {
      const res = await request(app).get('/api/events')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
    
    it('POST /api/events - 应成功创建赛事', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '测试赛事', event_year: 2024 })
      expect(res.status).toBe(201)
      expect(res.body.event_name).toBe('测试赛事')
      expect(res.body.event_year).toBe(2024)
    })
    
    it('POST /api/events - 赛事名称为空应返回400', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('赛事名称不能为空')
    })
    
    it('GET /api/events/:id - 应返回指定赛事', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .send({ event_name: '查询测试赛事' })
      const res = await request(app).get(`/api/events/${createRes.body.event_id}`)
      expect(res.status).toBe(200)
      expect(res.body.event_name).toBe('查询测试赛事')
    })
    
    it('GET /api/events/:id - 不存在的赛事应返回404', async () => {
      const res = await request(app).get('/api/events/9999')
      expect(res.status).toBe(404)
    })
    
    it('PUT /api/events/:id - 应成功更新赛事', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .send({ event_name: '更新前名称' })
      const res = await request(app)
        .put(`/api/events/${createRes.body.event_id}`)
        .send({ event_name: '更新后名称', status: '进行中' })
      expect(res.status).toBe(200)
      expect(res.body.event_name).toBe('更新后名称')
      expect(res.body.status).toBe('进行中')
    })
    
    it('DELETE /api/events/:id - 应成功删除赛事', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .send({ event_name: '待删除赛事' })
      const res = await request(app).delete(`/api/events/${createRes.body.event_id}`)
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('删除成功')
    })
  })
  
  describe('Teams API', () => {
    let eventId
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '队伍测试赛事' })
      eventId = res.body.event_id
    })
    
    it('POST /api/teams - 应成功创建队伍', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({ event_id: eventId, team_name: '测试队伍', contact_person: '张三', contact_phone: '13800138000' })
      expect(res.status).toBe(201)
      expect(res.body.team_name).toBe('测试队伍')
    })
    
    it('POST /api/teams - 缺少赛事ID应返回400', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({ team_name: '测试队伍' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('缺少赛事ID')
    })
    
    it('POST /api/teams - 队伍名称为空应返回400', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({ event_id: eventId, team_name: '' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('队伍名称不能为空')
    })
    
    it('GET /api/teams?event_id=X - 应返回指定赛事的队伍', async () => {
      await request(app).post('/api/teams').send({ event_id: eventId, team_name: '队伍A' })
      await request(app).post('/api/teams').send({ event_id: eventId, team_name: '队伍B' })
      const res = await request(app).get(`/api/teams?event_id=${eventId}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(2)
    })
    
    it('DELETE /api/teams/:id - 应成功删除队伍', async () => {
      const createRes = await request(app)
        .post('/api/teams')
        .send({ event_id: eventId, team_name: '待删除队伍' })
      const res = await request(app).delete(`/api/teams/${createRes.body.team_id}`)
      expect(res.status).toBe(200)
    })
  })
  
  describe('Players API', () => {
    let eventId, teamId
    
    beforeEach(async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .send({ event_name: '选手测试赛事' })
      eventId = eventRes.body.event_id
      
      const teamRes = await request(app)
        .post('/api/teams')
        .send({ event_id: eventId, team_name: '测试队伍' })
      teamId = teamRes.body.team_id
    })
    
    it('POST /api/players - 应成功创建选手', async () => {
      const res = await request(app)
        .post('/api/players')
        .send({ team_id: teamId, player_name: '李四', gender: '男' })
      expect(res.status).toBe(201)
      expect(res.body.player_name).toBe('李四')
      expect(res.body.gender).toBe('男')
    })
    
    it('POST /api/players - 缺少队伍ID应返回400', async () => {
      const res = await request(app)
        .post('/api/players')
        .send({ player_name: '王五' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('缺少队伍ID')
    })
    
    it('POST /api/players - 选手姓名为空应返回400', async () => {
      const res = await request(app)
        .post('/api/players')
        .send({ team_id: teamId, player_name: '' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('选手姓名不能为空')
    })
    
    it('GET /api/players?team_id=X - 应返回指定队伍的选手', async () => {
      await request(app).post('/api/players').send({ team_id: teamId, player_name: '选手1', gender: '男' })
      await request(app).post('/api/players').send({ team_id: teamId, player_name: '选手2', gender: '女' })
      const res = await request(app).get(`/api/players?team_id=${teamId}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(2)
    })
    
    it('DELETE /api/players/:id - 应成功删除选手', async () => {
      const createRes = await request(app)
        .post('/api/players')
        .send({ team_id: teamId, player_name: '待删除选手' })
      const res = await request(app).delete(`/api/players/${createRes.body.player_id}`)
      expect(res.status).toBe(200)
    })
  })
  
  describe('Match Types API', () => {
    it('GET /api/match-types - 应返回5种比赛项目', async () => {
      const res = await request(app).get('/api/match-types')
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(5)
      expect(res.body[0].type_name).toBe('男子双打')
      expect(res.body[4].type_name).toBe('混合双打')
    })
  })
  
  describe('Team Matches API', () => {
    let eventId, teamAId, teamBId
    
    beforeEach(async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .send({ event_name: '团体赛测试赛事' })
      eventId = eventRes.body.event_id
      
      const teamARes = await request(app)
        .post('/api/teams')
        .send({ event_id: eventId, team_name: '队伍A' })
      teamAId = teamARes.body.team_id
      
      const teamBRes = await request(app)
        .post('/api/teams')
        .send({ event_id: eventId, team_name: '队伍B' })
      teamBId = teamBRes.body.team_id
    })
    
    it('POST /api/team-matches - 应成功创建团体赛', async () => {
      const res = await request(app)
        .post('/api/team-matches')
        .send({ event_id: eventId, round_number: 1, team_a_id: teamAId, team_b_id: teamBId })
      expect(res.status).toBe(201)
      expect(res.body.team_a_id).toBe(teamAId)
      expect(res.body.team_b_id).toBe(teamBId)
    })
    
    it('POST /api/team-matches - 缺少赛事ID应返回400', async () => {
      const res = await request(app)
        .post('/api/team-matches')
        .send({ team_a_id: teamAId, team_b_id: teamBId })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('缺少赛事ID')
    })
    
    it('POST /api/team-matches/generate-bracket - 应成功生成对阵表', async () => {
      const res = await request(app)
        .post('/api/team-matches/generate-bracket')
        .send({ event_id: eventId })
      expect(res.status).toBe(201)
      expect(res.body.length).toBe(1)
    })
    
    it('POST /api/team-matches/generate-bracket - 队伍不足应返回400', async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .send({ event_name: '队伍不足赛事' })
      const res = await request(app)
        .post('/api/team-matches/generate-bracket')
        .send({ event_id: eventRes.body.event_id })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('至少需要2支队伍才能生成对阵表')
    })
    
    it('GET /api/team-matches?event_id=X - 应返回指定赛事的团体赛', async () => {
      await request(app)
        .post('/api/team-matches')
        .send({ event_id: eventId, round_number: 1, team_a_id: teamAId, team_b_id: teamBId })
      const res = await request(app).get(`/api/team-matches?event_id=${eventId}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
    })
    
    it('DELETE /api/team-matches/:id - 应成功删除团体赛', async () => {
      const createRes = await request(app)
        .post('/api/team-matches')
        .send({ event_id: eventId, round_number: 1, team_a_id: teamAId, team_b_id: teamBId })
      const res = await request(app).delete(`/api/team-matches/${createRes.body.team_match_id}`)
      expect(res.status).toBe(200)
    })
  })
  
  describe('Matches API', () => {
    let eventId, teamAId, teamBId, teamMatchId
    
    beforeEach(async () => {
      const eventRes = await request(app).post('/api/events').send({ event_name: '比赛测试赛事' })
      eventId = eventRes.body.event_id
      
      const teamARes = await request(app).post('/api/teams').send({ event_id: eventId, team_name: '队伍A' })
      teamAId = teamARes.body.team_id
      
      const teamBRes = await request(app).post('/api/teams').send({ event_id: eventId, team_name: '队伍B' })
      teamBId = teamBRes.body.team_id
      
      const matchRes = await request(app)
        .post('/api/team-matches')
        .send({ event_id: eventId, round_number: 1, team_a_id: teamAId, team_b_id: teamBId })
      teamMatchId = matchRes.body.team_match_id
    })
    
    it('POST /api/matches - 应成功创建单项比赛', async () => {
      const res = await request(app)
        .post('/api/matches')
        .send({ team_match_id: teamMatchId, match_type_id: 1 })
      expect(res.status).toBe(201)
      expect(res.body.team_match_id).toBe(teamMatchId)
    })
    
    it('POST /api/matches - 缺少团体赛ID应返回400', async () => {
      const res = await request(app)
        .post('/api/matches')
        .send({ match_type_id: 1 })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('缺少团体赛ID')
    })
    
    it('PUT /api/matches/:id/score - 应成功更新比分', async () => {
      const createRes = await request(app)
        .post('/api/matches')
        .send({ team_match_id: teamMatchId, match_type_id: 1 })
      const res = await request(app)
        .put(`/api/matches/${createRes.body.match_id}/score`)
        .send({ game1_score_a: 21, game1_score_b: 15, game2_score_a: 21, game2_score_b: 18 })
      expect(res.status).toBe(200)
      expect(res.body.game1_score_a).toBe(21)
      expect(res.body.status).toBe('已结束')
    })
    
    it('GET /api/matches?team_match_id=X - 应返回指定团体赛的比赛', async () => {
      await request(app).post('/api/matches').send({ team_match_id: teamMatchId, match_type_id: 1 })
      const res = await request(app).get(`/api/matches?team_match_id=${teamMatchId}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1)
    })
  })
  
  describe('Standings API', () => {
    let eventId
    
    beforeEach(async () => {
      const eventRes = await request(app).post('/api/events').send({ event_name: '积分测试赛事' })
      eventId = eventRes.body.event_id
      
      await request(app).post('/api/teams').send({ event_id: eventId, team_name: '队伍A' })
      await request(app).post('/api/teams').send({ event_id: eventId, team_name: '队伍B' })
    })
    
    it('GET /api/standings - 缺少event_id应返回400', async () => {
      const res = await request(app).get('/api/standings')
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('缺少event_id参数')
    })
    
    it('POST /api/standings/calculate - 应成功计算成绩', async () => {
      const res = await request(app)
        .post('/api/standings/calculate')
        .send({ event_id: eventId })
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(2)
    })
    
    it('POST /api/standings/calculate - 缺少event_id应返回400', async () => {
      const res = await request(app)
        .post('/api/standings/calculate')
        .send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('缺少event_id参数')
    })
  })
})
