const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin888';

// ---------- Database ----------
const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
    major TEXT,
    grade TEXT,
    gender TEXT,
    career_path TEXT,
    q5 TEXT, q6 TEXT, q7 TEXT,
    q8 TEXT, q9 TEXT,
    q10 TEXT, q11 TEXT, q12 TEXT,
    q13 TEXT, q14 TEXT, q15 TEXT,
    q16 TEXT,
    q17 TEXT,
    q18 TEXT
  )
`);

// ---------- Middleware ----------
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- CORS (allow cross-origin if needed) ----------
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ---------- Admin auth middleware ----------
function requireAdmin(req, res, next) {
  const pwd = req.query.pwd || req.headers['x-admin-password'];
  if (pwd !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '未授权，密码错误' });
  }
  next();
}

// ========== API Routes ==========

// POST /api/submit - Submit a survey response
app.post('/api/submit', (req, res) => {
  try {
    const d = req.body;
    const stmt = db.prepare(`
      INSERT INTO responses (major, grade, gender, career_path,
        q5, q6, q7, q8, q9,
        q10, q11, q12, q13, q14, q15,
        q16, q17, q18)
      VALUES (?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?)
    `);

    const result = stmt.run(
      d.q1 || null, d.q2 || null, d.q3 || null, d.q4 || null,
      d.q5 || null, d.q6 || null, d.q7 || null,
      arr(d.q8), arr(d.q9),
      d.q10 || null, d.q11 || null, d.q12 || null,
      arr(d.q13), arr(d.q14), d.q15 || null,
      arr(d.q16), arr(d.q17), d.q18 || null
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error('Submit error:', e);
    res.status(500).json({ error: '提交失败' });
  }
});

// GET /api/results - View results (admin)
app.get('/api/results', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM responses ORDER BY id DESC').all();
  res.json({ total: rows.length, data: rows });
});

// GET /api/results/count - Response count (no auth)
app.get('/api/results/count', (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM responses').get();
  res.json({ count: row.count });
});

// GET /api/export/csv - Export as CSV (admin)
app.get('/api/export/csv', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM responses ORDER BY id ASC').all();
  if (rows.length === 0) {
    return res.status(404).json({ error: '暂无数据' });
  }

  const headers = [
    '编号', '提交时间', '专业', '年级', '性别', '毕业去向',
    '工作关联度', '单位类型', '期望起薪', '就业准备', '就业原因',
    '深造类型', '院校层次', '跨专业', '深造原因', '考研准备', '考研失败备选',
    '困惑原因', '学校支持需求', '补充意见'
  ];

  const csvRows = rows.map(r => {
    const v = (x) => {
      if (x === null || x === undefined) return '';
      const s = String(x);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [
      r.id, r.created_at, v(r.major), v(r.grade), v(r.gender), v(r.career_path),
      v(r.q5), v(r.q6), v(r.q7), v(r.q8), v(r.q9),
      v(r.q10), v(r.q11), v(r.q12), v(r.q13), v(r.q14), v(r.q15),
      v(r.q16), v(r.q17), v(r.q18)
    ].join(',');
  });

  const csv = '\uFEFF' + headers.join(',') + '\n' + csvRows.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="survey_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

// Helper: convert array to semicolon-separated string
function arr(a) {
  if (!a) return null;
  if (Array.isArray(a)) return a.filter(Boolean).join('; ');
  return String(a);
}

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ 问卷系统已启动: http://localhost:${PORT}`);
  console.log(`🔑 管理密码: ${ADMIN_PASSWORD} (可通过环境变量 ADMIN_PASSWORD 修改)`);
  console.log(`📊 查看结果: http://localhost:${PORT}/admin.html`);
});
