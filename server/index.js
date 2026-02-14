import express from 'express';
import cors from 'cors';
import { initDatabase, prepare } from './db/database.js';

import eventsRouter from './routes/events.js';
import teamsRouter from './routes/teams.js';
import playersRouter from './routes/players.js';
import matchTypesRouter from './routes/matchTypes.js';
import teamMatchesRouter from './routes/teamMatches.js';
import matchesRouter from './routes/matches.js';
import standingsRouter from './routes/standings.js';
import exportRouter from './routes/export.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/match-types', matchTypesRouter);
app.use('/api/team-matches', teamMatchesRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/export', exportRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;
