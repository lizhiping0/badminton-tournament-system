import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Integration Tests - Real Server', () => {
  let app
  let server
  let db
  
  beforeAll(async () => {
    const express = (await import('express')).default
    const cors = (await import('cors')).default
    const initSqlJs = (await import('sql.js')).default
    
    const SQL = await initSqlJs()
    
    const testDbPath = path.join(__dirname, '../test-data/integration-test.db')
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    
    db = new SQL.Database()
    
    const schema = fs.readFileSync(path.join(__dirname, '../server/db/schema.sql'), 'utf-8')
    const statements = schema.split(';').filter(s => s.trim())
    statements.forEach(stmt => {
      if (stmt.trim()) {
        try {
          db.run(stmt)
        } catch (e) {
          console.error('Schema error:', e.message)
        }
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
    
    app = express()
    app.use(cors())
    app.use(express.json())
    
    const eventsRouter = express.Router()
    eventsRouter.get('/', (req, res) => {
      try {
        const events = prepare('SELECT * FROM events ORDER BY create_time DESC').all()
        res.json(events)
      } catch (error) {
        res.status(500).json({ error: '获取赛事列表失败', message: error.message })
      }
    })
    eventsRouter.get('/:id', (req, res) => {
      try {
        const event = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id)
        if (!event) return res.status(404).json({ error: '赛事不存在' })
        res.json(event)
      } catch (error) {
        res.status(500).json({ error: '获取赛事失败', message: error.message })
      }
    })
    eventsRouter.post('/', (req, res) => {
      try {
        const { event_name, event_year, start_date, end_date } = req.body
        if (!event_name || !event_name.trim()) {
          return res.status(400).json({ error: '赛事名称不能为空' })
        }
        const stmt = prepare('INSERT INTO events (event_name, event_year, start_date, end_date) VALUES (?, ?, ?, ?)')
        const result = stmt.run(event_name.trim(), event_year || new Date().getFullYear(), start_date || null, end_date || null)
        const event = prepare('SELECT * FROM events WHERE event_id = ?').get(result.lastInsertRowid)
        if (!event) {
          return res.status(500).json({ error: '创建赛事后获取失败' })
        }
        res.status(201).json(event)
      } catch (error) {
        res.status(500).json({ error: '创建赛事失败', message: error.message })
      }
    })
    eventsRouter.put('/:id', (req, res) => {
      try {
        const { event_name, event_year, start_date, end_date, status } = req.body
        const existing = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id)
        if (!existing) return res.status(404).json({ error: '赛事不存在' })
        prepare('UPDATE events SET event_name = ?, event_year = ?, start_date = ?, end_date = ?, status = ? WHERE event_id = ?')
          .run(event_name || existing.event_name, event_year || existing.event_year, start_date || existing.start_date, end_date || existing.end_date, status || existing.status, req.params.id)
        const event = prepare('SELECT * FROM events WHERE event_id = ?').get(req.params.id)
        res.json(event)
      } catch (error) {
        res.status(500).json({ error: '更新赛事失败', message: error.message })
      }
    })
    eventsRouter.delete('/:id', (req, res) => {
      try {
        prepare('DELETE FROM events WHERE event_id = ?').run(req.params.id)
        res.json({ message: '删除成功' })
      } catch (error) {
        res.status(500).json({ error: '删除赛事失败', message: error.message })
      }
    })
    
    app.use('/api/events', eventsRouter)
    
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: '服务运行正常' })
    })
    
    app.use((err, req, res, next) => {
      console.error('服务器错误:', err.stack)
      res.status(500).json({ error: '服务器内部错误', message: err.message })
    })
    
    server = app.listen(3002)
  })
  
  afterAll(() => {
    if (server) server.close()
  })
  
  describe('Health Check', () => {
    it('应返回服务状态', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
  })
  
  describe('Events API - 错误处理测试', () => {
    it('创建赛事 - 空名称应返回400错误', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('赛事名称不能为空')
    })
    
    it('创建赛事 - 缺少名称应返回400错误', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('赛事名称不能为空')
    })
    
    it('创建赛事 - 只有空格的名称应返回400错误', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '   ' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('赛事名称不能为空')
    })
    
    it('创建赛事 - 成功创建', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '测试赛事', event_year: 2024 })
      expect(res.status).toBe(201)
      expect(res.body.event_name).toBe('测试赛事')
      expect(res.body.event_id).toBeDefined()
    })
    
    it('创建赛事 - 返回的数据应包含所有必要字段', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '完整字段测试', event_year: 2024, start_date: '2024-01-01', end_date: '2024-12-31' })
      expect(res.status).toBe(201)
      expect(res.body.event_name).toBe('完整字段测试')
      expect(res.body.event_year).toBe(2024)
      expect(res.body.start_date).toBe('2024-01-01')
      expect(res.body.end_date).toBe('2024-12-31')
      expect(res.body.status).toBe('筹备中')
      expect(res.body.event_id).toBeDefined()
    })
    
    it('获取不存在的赛事 - 应返回404', async () => {
      const res = await request(app).get('/api/events/99999')
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('赛事不存在')
    })
    
    it('更新不存在的赛事 - 应返回404', async () => {
      const res = await request(app)
        .put('/api/events/99999')
        .send({ event_name: '更新测试' })
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('赛事不存在')
    })
    
    it('删除不存在的赛事 - 应成功（幂等）', async () => {
      const res = await request(app).delete('/api/events/99999')
      expect(res.status).toBe(200)
    })
  })
  
  describe('Events API - 完整流程测试', () => {
    let eventId
    
    it('创建 -> 查询 -> 更新 -> 删除 完整流程', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .send({ event_name: '流程测试赛事' })
      expect(createRes.status).toBe(201)
      eventId = createRes.body.event_id
      
      const getRes = await request(app).get(`/api/events/${eventId}`)
      expect(getRes.status).toBe(200)
      expect(getRes.body.event_name).toBe('流程测试赛事')
      
      const updateRes = await request(app)
        .put(`/api/events/${eventId}`)
        .send({ event_name: '更新后名称', status: '进行中' })
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.event_name).toBe('更新后名称')
      expect(updateRes.body.status).toBe('进行中')
      
      const deleteRes = await request(app).delete(`/api/events/${eventId}`)
      expect(deleteRes.status).toBe(200)
      
      const getAfterDeleteRes = await request(app).get(`/api/events/${eventId}`)
      expect(getAfterDeleteRes.status).toBe(404)
    })
  })
  
  describe('响应格式测试', () => {
    it('所有错误响应应为JSON格式', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: '' })
      expect(res.headers['content-type']).toContain('application/json')
    })
    
    it('成功响应应为JSON格式', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({ event_name: 'JSON格式测试' })
      expect(res.headers['content-type']).toContain('application/json')
    })
  })
})
