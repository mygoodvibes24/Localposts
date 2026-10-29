// Tiny JSON-file store. Fine for a prototype; swap for a real database before launch.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword, checkPassword } = require('./db-hash');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    const seeded = require('./seed')();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

let state = load();

function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function publicUser(u) {
  return u && { id: u.id, username: u.username, createdAt: u.createdAt };
}

module.exports = {
  getUserById(id) {
    return publicUser(state.users.find((u) => u.id === id));
  },

  getUserByName(name) {
    return publicUser(state.users.find((u) => u.username.toLowerCase() === name.toLowerCase()));
  },

  createUser(username, password) {
    const user = { id: crypto.randomUUID(), username, password: hashPassword(password), createdAt: Date.now() };
    state.users.push(user);
    save();
    return publicUser(user);
  },

  verifyUser(username, password) {
    const u = state.users.find((x) => x.username.toLowerCase() === username.toLowerCase());
    return u && checkPassword(password, u.password) ? publicUser(u) : null;
  },

  listPosts(q) {
    const needle = (q || '').toLowerCase();
    return state.posts
      .filter((p) => !needle || [p.title, p.location, p.body].some((s) => s.toLowerCase().includes(needle)))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => ({ ...p, author: this.getUserById(p.userId) }));
  },

  getPost(id) {
    const p = state.posts.find((x) => x.id === id);
    return p && { ...p, author: this.getUserById(p.userId) };
  },

  createPost({ userId, title, location, body, photos }) {
    const post = { id: crypto.randomUUID().slice(0, 8), userId, title, location, body, photos, createdAt: Date.now() };
    state.posts.push(post);
    save();
    return post;
  },

  deletePost(id) {
    state.posts = state.posts.filter((p) => p.id !== id);
    save();
  },
};
