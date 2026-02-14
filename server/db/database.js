import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '../../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'badminton.db');

let db = null;
let SQL = null;
let lastInsertId = 0;

async function initDatabase() {
  SQL = await initSqlJs();
  
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    const statements = schema.split(';').filter(s => s.trim());
    statements.forEach(stmt => {
      if (stmt.trim()) {
        try {
          db.run(stmt);
        } catch (e) {
          console.error('Schema error:', e.message);
        }
      }
    });
    saveDatabase();
  }
  
  console.log('数据库初始化完成:', dbPath);
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

function prepare(sqlText) {
  return {
    run: (...params) => {
      try {
        db.run(sqlText, params);
        
        const lastIdResult = db.exec("SELECT last_insert_rowid()");
        const lastId = lastIdResult.length > 0 && lastIdResult[0].values.length > 0 
          ? lastIdResult[0].values[0][0] 
          : 0;
        
        const changesResult = db.exec("SELECT changes()");
        const changes = changesResult.length > 0 && changesResult[0].values.length > 0 
          ? changesResult[0].values[0][0] 
          : 0;
        
        saveDatabase();
        
        return { lastInsertRowid: lastId, changes };
      } catch (error) {
        console.error('SQL run error:', error.message, 'SQL:', sqlText.substring(0, 100));
        throw error;
      }
    },
    get: (...params) => {
      try {
        const stmt = db.prepare(sqlText);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      } catch (error) {
        console.error('SQL get error:', error.message, 'SQL:', sqlText.substring(0, 100));
        throw error;
      }
    },
    all: (...params) => {
      try {
        const results = [];
        const stmt = db.prepare(sqlText);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      } catch (error) {
        console.error('SQL all error:', error.message, 'SQL:', sqlText.substring(0, 100));
        throw error;
      }
    }
  };
}

function exec(sqlText) {
  const statements = sqlText.split(';').filter(s => s.trim());
  statements.forEach(stmt => {
    if (stmt.trim()) {
      try {
        db.run(stmt);
      } catch (e) {
        console.error('Exec error:', e.message);
      }
    }
  });
  saveDatabase();
}

export { initDatabase, prepare, exec, saveDatabase };
