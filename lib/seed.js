// Demo content so the feed isn't empty on first run. Demo account: demo / demo1234
const crypto = require('crypto');

module.exports = function seed() {
  const { hashPassword } = require('./db-hash');
  const demo = { id: crypto.randomUUID(), username: 'demo', password: hashPassword('demo1234'), createdAt: Date.now() };
  const now = Date.now();
  const min = 60 * 1000;

  const posts = [
    ['Looking for a hiking buddy this weekend 🥾', 'Starved Rock, Ottawa', 'Planning to hit the trails Saturday morning. Easy pace, good conversation, coffee after. Message me if you want to come along!', 3],
    ['New to the city — who wants to grab coffee? ☕', 'Wicker Park', 'Just moved here for work and don\'t know anyone yet. Love live music, thrift stores and trying new restaurants.', 9],
    ['Board game night every Thursday 🎲', 'Logan Square', 'Small friendly group, all skill levels. Catan, Codenames, Wingspan. Bring a snack!', 17],
    ['Dog park meetup 🐶', 'Lincoln Park', 'My golden retriever needs friends and so do I. Sundays around 10am at the north end.', 26],
    ['Seeking a tennis partner 🎾', 'Schaumburg', 'Intermediate player, looking for someone to hit with on weekday evenings.', 41],
    ['Photography walk downtown 📷', 'The Loop', 'Golden hour photo walk along the riverwalk. Any camera welcome, even phones.', 58],
    ['Salsa class partner wanted 💃', 'Pilsen', 'Signed up for beginner salsa on Wednesdays and need a partner. No experience needed!', 75],
  ];


  return {
    users: [demo],
    posts: posts.map(([title, location, body, ago], i) => ({
      id: 'seed' + i,
      userId: demo.id,
      title,
      location,
      body,
      photos: ['/static/seed/' + i + '.svg'],
      createdAt: now - ago * min,
    })),
  };
};
