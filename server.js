const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
const sessionDays = Number(process.env.SESSION_DAYS || 30);
const cookieName = 'tabib_session';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL wajib diisi');
fs.mkdirSync(uploadRoot, { recursive: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const tables = {
  produk: ['nama', 'kategori', 'satuan', 'hpp', 'harga_jual', 'stok_min', 'stok_awal', 'image_url'],
  amplop: ['tgl', 'sumber', 'jumlah', 'catatan'],
  jual: ['tgl', 'produk_id', 'qty', 'harga', 'hpp_snapshot', 'catatan'],
  ops: ['tgl', 'nama', 'jumlah', 'kategori', 'catatan'],
  beli: ['tgl', 'produk_id', 'qty', 'harga', 'catatan'],
  adj: ['tgl', 'produk_id', 'delta', 'catatan'],
  ads: ['tgl', 'jenis', 'nama', 'jumlah', 'catatan']
};

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [decodeURIComponent(v.slice(0, i)), decodeURIComponent(v.slice(i + 1))];
  }));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [kind, salt, expected] = String(stored).split('$');
  if (kind !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });
}

async function createSession(accountId, res) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + sessionDays * 86400000);
  await pool.query(
    'insert into public.sessions(account_id, token_hash, expires_at) values($1,$2,$3)',
    [accountId, sha256(token), expiresAt]
  );
  setSessionCookie(res, token, expiresAt);
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = parseCookies(req.headers.cookie)[cookieName];
  if (!token) return res.status(401).json({ error: 'Silakan login' });
  const result = await pool.query(`
    select a.id, a.email, a.display_name, a.is_admin
    from public.sessions s
    join public.accounts a on a.id = s.account_id
    where s.token_hash = $1 and s.expires_at > now() and a.is_active = true
  `, [sha256(token)]);
  if (!result.rowCount) return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa' });
  req.user = result.rows[0];
  req.sessionTokenHash = sha256(token);
  next();
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', asyncHandler(async (_req, res) => {
  await pool.query('select 1');
  res.json({ ok: true });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const identifier = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@faedahsehat.com').toLowerCase();
  const email = identifier === 'admin' ? adminEmail : identifier;
  const result = await pool.query(
    'select id,email,password_hash,display_name,is_admin from public.accounts where (lower(email)=$1 or ($2=\'admin\' and is_admin=true)) and is_active=true limit 1',
    [email, identifier]
  );
  const account = result.rows[0];
  if (!account || !verifyPassword(password, account.password_hash)) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }
  await createSession(account.id, res);
  res.json({ user: { id: account.id, email: account.email, display_name: account.display_name, is_admin: account.is_admin } });
}));

app.post('/api/auth/signup', asyncHandler(async (req, res) => {
  if (process.env.ALLOW_SIGNUP !== 'true') return res.status(403).json({ error: 'Pendaftaran akun dinonaktifkan' });
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Email tidak valid' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const result = await pool.query(
      'insert into public.accounts(email,password_hash) values($1,$2) returning id,email,display_name,is_admin',
      [email, hashPassword(password)]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email sudah terdaftar' });
    throw error;
  }
}));

app.get('/api/auth/session', requireAuth, (req, res) => res.json({ user: req.user }));

app.post('/api/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  await pool.query('delete from public.sessions where token_hash=$1', [req.sessionTokenHash]);
  res.clearCookie(cookieName, { path: '/' });
  res.json({ ok: true });
}));

app.get('/api/data/:table', requireAuth, asyncHandler(async (req, res) => {
  const columns = tables[req.params.table];
  if (!columns) return res.status(404).json({ error: 'Tabel tidak tersedia' });
  const allowedOrder = new Set(['created_at', 'tgl', 'nama']);
  const order = allowedOrder.has(req.query.order) ? req.query.order : 'created_at';
  const direction = req.query.direction === 'desc' ? 'desc' : 'asc';
  const values = [req.user.id];
  let where = 'user_id=$1';
  if (req.query.id) { values.push(req.query.id); where += ` and id=$${values.length}`; }
  const result = await pool.query(`select * from public.${req.params.table} where ${where} order by ${order} ${direction}`, values);
  res.json({ data: result.rows });
}));

app.post('/api/data/:table', requireAuth, asyncHandler(async (req, res) => {
  const allowed = tables[req.params.table];
  if (!allowed) return res.status(404).json({ error: 'Tabel tidak tersedia' });
  const inputRows = Array.isArray(req.body) ? req.body : [req.body];
  if (!inputRows.length || inputRows.length > 100) return res.status(400).json({ error: 'Jumlah baris tidak valid' });
  const client = await pool.connect();
  try {
    await client.query('begin');
    const output = [];
    for (const source of inputRows) {
      if (['jual', 'beli', 'adj'].includes(req.params.table) && source.produk_id) {
        const product = await client.query('select 1 from public.produk where id=$1 and user_id=$2', [source.produk_id, req.user.id]);
        if (!product.rowCount) throw Object.assign(new Error('Produk tidak ditemukan'), { status: 400 });
      }
      const cols = allowed.filter(key => Object.prototype.hasOwnProperty.call(source, key));
      const values = [req.user.id, ...cols.map(key => source[key])];
      const names = ['user_id', ...cols];
      const params = values.map((_, i) => `$${i + 1}`);
      const result = await client.query(
        `insert into public.${req.params.table}(${names.join(',')}) values(${params.join(',')}) returning *`, values
      );
      output.push(result.rows[0]);
    }
    await client.query('commit');
    res.status(201).json({ data: Array.isArray(req.body) ? output : output[0] });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally { client.release(); }
}));

app.patch('/api/data/:table/:id', requireAuth, asyncHandler(async (req, res) => {
  const allowed = tables[req.params.table];
  if (!allowed) return res.status(404).json({ error: 'Tabel tidak tersedia' });
  const cols = allowed.filter(key => Object.prototype.hasOwnProperty.call(req.body, key));
  if (!cols.length) return res.status(400).json({ error: 'Tidak ada perubahan' });
  if (['jual', 'beli', 'adj'].includes(req.params.table) && req.body.produk_id) {
    const product = await pool.query('select 1 from public.produk where id=$1 and user_id=$2', [req.body.produk_id, req.user.id]);
    if (!product.rowCount) return res.status(400).json({ error: 'Produk tidak ditemukan' });
  }
  const values = cols.map(key => req.body[key]);
  values.push(req.params.id, req.user.id);
  const set = cols.map((key, i) => `${key}=$${i + 1}`).join(',');
  const result = await pool.query(
    `update public.${req.params.table} set ${set} where id=$${values.length - 1} and user_id=$${values.length} returning *`, values
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Data tidak ditemukan' });
  res.json({ data: result.rows[0] });
}));

app.delete('/api/data/:table/:id', requireAuth, asyncHandler(async (req, res) => {
  if (!tables[req.params.table]) return res.status(404).json({ error: 'Tabel tidak tersedia' });
  const result = await pool.query(
    `delete from public.${req.params.table} where id=$1 and user_id=$2 returning id`,
    [req.params.id, req.user.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Data tidak ditemukan' });
  res.json({ data: result.rows[0] });
}));

function safeUploadPath(value) {
  const normalized = String(value || '').replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || !normalized.startsWith('produk/')) return null;
  return normalized;
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const requested = safeUploadPath(req.body.path);
    if (!requested) return cb(new Error('Path gambar tidak valid'));
    const dir = path.join(uploadRoot, req.user.id, path.posix.dirname(requested));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, _file, cb) {
    const requested = safeUploadPath(req.body.path);
    if (!requested) return cb(new Error('Path gambar tidak valid'));
    cb(null, path.posix.basename(requested));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) { cb(null, /^image\/(png|jpeg|webp|gif)$/.test(file.mimetype)); }
});

app.post('/api/storage/upload', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File gambar tidak valid' });
  const requested = safeUploadPath(req.body.path);
  const relative = `${req.user.id}/${requested}`;
  res.status(201).json({ data: { path: relative, publicUrl: `/produk-images/${relative}` } });
}));

app.post('/api/storage/remove', requireAuth, asyncHandler(async (req, res) => {
  const paths = Array.isArray(req.body.paths) ? req.body.paths : [];
  for (const candidate of paths) {
    const normalized = String(candidate).replaceAll('\\', '/').replace(/^\/+/, '');
    if (!normalized.startsWith(`${req.user.id}/`) || normalized.includes('..')) continue;
    const target = path.resolve(uploadRoot, normalized);
    if (target.startsWith(`${uploadRoot}${path.sep}`)) await fs.promises.rm(target, { force: true });
  }
  res.json({ data: [] });
}));

app.use('/produk-images', express.static(uploadRoot, { fallthrough: false, maxAge: '1d' }));
for (const file of ['api-client.js', 'manifest.json', 'sw.js']) {
  app.get(`/${file}`, (_req, res) => res.sendFile(path.join(__dirname, file)));
}
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Ukuran gambar maksimal 5 MB' });
  res.status(error.status || 500).json({ error: error.status ? error.message : (process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : error.message) });
});

async function bootstrapAdmin() {
  if (!process.env.ADMIN_PASSWORD) return;
  if (process.env.ADMIN_PASSWORD.length < 6) throw new Error('ADMIN_PASSWORD minimal 6 karakter');
  const email = String(process.env.ADMIN_EMAIL || 'admin@faedahsehat.com').toLowerCase();
  const id = process.env.ADMIN_USER_ID || '136ca9d4-1919-4a7f-9664-8a0371681d65';
  const hashed = hashPassword(process.env.ADMIN_PASSWORD);
  const existing = await pool.query('select id from public.accounts where lower(email)=$1 or id=$2 limit 1', [email, id]);
  if (existing.rowCount > 0) {
    await pool.query(
      'update public.accounts set email=$1, password_hash=$2, is_active=true, is_admin=true where id=$3',
      [email, hashed, existing.rows[0].id]
    );
  } else {
    await pool.query(
      'insert into public.accounts(id,email,password_hash,display_name,is_active,is_admin) values($1,$2,$3,\'Admin\',true,true)',
      [id, email, hashed]
    );
  }
}

(async () => {
  await bootstrapAdmin();
  await pool.query('delete from public.sessions where expires_at <= now()');
  app.listen(port, '0.0.0.0', () => console.log(`Tabib Ahmad listening on ${port}`));
})().catch(error => { console.error(error); process.exit(1); });
