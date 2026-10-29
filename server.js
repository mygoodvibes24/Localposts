const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const db = require('./lib/db');
const views = require('./lib/views');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[file.mimetype];
      cb(null, crypto.randomUUID() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WEBP or GIF images are allowed.'), ok);
  },
});

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
}));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.use((req, res, next) => {
  res.locals.user = req.session.userId ? db.getUserById(req.session.userId) : null;
  next();
});

function requireLogin(req, res, next) {
  if (!res.locals.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  next();
}

// ---- Feed ----
app.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const posts = db.listPosts(q);
  res.send(views.feed({ user: res.locals.user, posts, q }));
});

// ---- Accounts ----
app.get('/signup', (req, res) => res.send(views.signup({ user: res.locals.user })));

app.post('/signup', (req, res) => {
  const { username = '', password = '', confirm = '', adult } = req.body;
  const name = username.trim();
  let error = null;
  if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) error = 'Username must be 3–20 letters, numbers or underscores.';
  else if (password.length < 8) error = 'Password must be at least 8 characters.';
  else if (password !== confirm) error = 'Passwords do not match.';
  else if (!adult) error = 'You must confirm you are 18 or older.';
  else if (db.getUserByName(name)) error = 'That username is taken.';
  if (error) return res.status(400).send(views.signup({ user: null, error, username: name }));

  const user = db.createUser(name, password);
  req.session.regenerate(() => {
    req.session.userId = user.id;
    res.redirect('/post/new');
  });
});

app.get('/login', (req, res) => res.send(views.login({ user: res.locals.user, next: req.query.next })));

app.post('/login', (req, res) => {
  const { username = '', password = '', next } = req.body;
  const user = db.verifyUser(username.trim(), password);
  if (!user) return res.status(401).send(views.login({ user: null, error: 'Wrong username or password.', username, next }));
  req.session.regenerate(() => {
    req.session.userId = user.id;
    res.redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
  });
});

app.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

// ---- Posting ----
app.get('/post/new', requireLogin, (req, res) => res.send(views.newPost({ user: res.locals.user })));

app.post('/post/new', requireLogin, (req, res) => {
  upload.array('photos', 5)(req, res, (err) => {
    const files = req.files || [];
    const { title = '', location = '', body = '' } = req.body || {};
    const form = { title, location, body };
    let error = err ? err.message : null;
    if (!error && !title.trim()) error = 'Add a title.';
    if (!error && title.length > 140) error = 'Title must be 140 characters or less.';
    if (!error && !location.trim()) error = 'Add a location.';
    if (!error && !body.trim()) error = 'Add a description.';
    if (!error && files.length === 0) error = 'Add at least one photo.';
    if (error) {
      files.forEach((f) => fs.unlink(f.path, () => {}));
      return res.status(400).send(views.newPost({ user: res.locals.user, error, form }));
    }
    const post = db.createPost({
      userId: res.locals.user.id,
      title: title.trim(),
      location: location.trim(),
      body: body.trim(),
      photos: files.map((f) => '/uploads/' + f.filename),
    });
    res.redirect('/post/' + post.id);
  });
});

app.get('/post/:id', (req, res) => {
  const post = db.getPost(req.params.id);
  if (!post) return res.status(404).send(views.notFound({ user: res.locals.user }));
  res.send(views.postDetail({ user: res.locals.user, post }));
});

app.post('/post/:id/delete', requireLogin, (req, res) => {
  const post = db.getPost(req.params.id);
  if (post && post.userId === res.locals.user.id) {
    db.deletePost(post.id);
    post.photos.filter((p) => p.startsWith('/uploads/')).forEach((p) => fs.unlink(path.join(UPLOAD_DIR, path.basename(p)), () => {}));
  }
  res.redirect('/');
});

app.use((req, res) => res.status(404).send(views.notFound({ user: res.locals.user })));

app.listen(PORT, () => console.log(`Personals board running at http://localhost:${PORT}`));
