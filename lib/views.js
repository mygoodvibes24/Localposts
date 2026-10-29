const SITE_NAME = 'LocalPosts';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeLabel(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function layout({ title, user, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title ? `${title} · ${SITE_NAME}` : SITE_NAME)}</title>
<link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
<header class="topbar">
  <a class="logo" href="/">${SITE_NAME}</a>
  <nav>
    ${user
      ? `<a class="btn btn-post" href="/post/new">+ Post</a>
         <span class="who">@${esc(user.username)}</span>
         <form method="post" action="/logout" class="inline"><button class="link">Log out</button></form>`
      : `<a href="/login">Log in</a><a class="btn btn-post" href="/signup">Sign up</a>`}
  </nav>
</header>
<main>${body}</main>
<footer class="foot">Prototype · 18+ only · No solicitation or paid services. Posts that break the rules are removed.</footer>
</body>
</html>`;
}

function postRow(p) {
  const extra = p.photos.length > 1 ? `<span class="badge">📷 ${p.photos.length}</span>` : '';
  return `<a class="row" href="/post/${esc(p.id)}">
  <div class="thumbcol">
    <div class="thumb">
      ${extra}
      <img src="${esc(p.photos[0])}" alt="" loading="lazy">
    </div>
    <div class="posted">Posted: ${timeLabel(p.createdAt)}</div>
  </div>
  <div class="info">
    <div class="title">${esc(p.title)}</div>
    <div class="loc">${esc(p.location)}</div>
    <div class="snippet">${esc(p.body)}</div>
  </div>
</a>`;
}

exports.feed = ({ user, posts, q }) => layout({
  user,
  body: `
<form class="search" method="get" action="/">
  <input name="q" value="${esc(q)}" placeholder="Search by keyword or area…">
  <button>Search</button>
</form>
${posts.length ? `<div class="feed">${posts.map(postRow).join('')}</div>`
  : `<p class="empty">No posts${q ? ` matching “${esc(q)}”` : ''} yet.</p>`}
`,
});

exports.postDetail = ({ user, post }) => layout({
  title: post.title,
  user,
  body: `
<article class="detail">
  <a class="back" href="/">← Back to posts</a>
  <h1>${esc(post.title)}</h1>
  <div class="meta">${esc(post.location)} · Posted ${timeLabel(post.createdAt)}${post.author ? ` by @${esc(post.author.username)}` : ''}</div>
  <div class="gallery">${post.photos.map((src) => `<img src="${esc(src)}" alt="">`).join('')}</div>
  <p class="body">${esc(post.body).replace(/\n/g, '<br>')}</p>
  ${user && post.author && user.id === post.author.id
    ? `<form method="post" action="/post/${esc(post.id)}/delete" onsubmit="return confirm('Delete this post?')"><button class="btn btn-danger">Delete post</button></form>`
    : ''}
</article>`,
});

exports.signup = ({ user, error, username = '' }) => layout({
  title: 'Sign up',
  user,
  body: `
<form class="card" method="post" action="/signup">
  <h1>Create an account</h1>
  <p class="sub">You need an account to make a post.</p>
  ${error ? `<div class="error">${esc(error)}</div>` : ''}
  <label>Username<input name="username" value="${esc(username)}" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" autocomplete="username"></label>
  <label>Password<input type="password" name="password" required minlength="8" autocomplete="new-password"></label>
  <label>Confirm password<input type="password" name="confirm" required minlength="8" autocomplete="new-password"></label>
  <label class="check"><input type="checkbox" name="adult" value="1" required> I am 18 or older and agree to the posting rules.</label>
  <button class="btn btn-post wide">Sign up</button>
  <p class="alt">Already have an account? <a href="/login">Log in</a></p>
</form>`,
});

exports.login = ({ user, error, username = '', next = '' }) => layout({
  title: 'Log in',
  user,
  body: `
<form class="card" method="post" action="/login">
  <h1>Log in</h1>
  ${error ? `<div class="error">${esc(error)}</div>` : ''}
  <input type="hidden" name="next" value="${esc(next)}">
  <label>Username<input name="username" value="${esc(username)}" required autocomplete="username"></label>
  <label>Password<input type="password" name="password" required autocomplete="current-password"></label>
  <button class="btn btn-post wide">Log in</button>
  <p class="alt">New here? <a href="/signup">Create an account</a></p>
</form>`,
});

exports.newPost = ({ user, error, form = {} }) => layout({
  title: 'New post',
  user,
  body: `
<form class="card" method="post" action="/post/new" enctype="multipart/form-data">
  <h1>Create a post</h1>
  ${error ? `<div class="error">${esc(error)}</div>` : ''}
  <label>Title<input name="title" value="${esc(form.title)}" maxlength="140" required></label>
  <label>Location<input name="location" value="${esc(form.location)}" placeholder="Neighborhood or city" required></label>
  <label>Description<textarea name="body" rows="6" required>${esc(form.body)}</textarea></label>
  <label>Photos (1–5, max 5 MB each)<input type="file" name="photos" accept="image/jpeg,image/png,image/webp,image/gif" multiple required></label>
  <ul class="rules">
    <li>18+ only. No minors in photos.</li>
    <li>No offers of sex for money or any paid "services".</li>
    <li>Only post photos of yourself, with consent.</li>
  </ul>
  <button class="btn btn-post wide">Publish post</button>
</form>`,
});

exports.notFound = ({ user }) => layout({
  title: 'Not found',
  user,
  body: `<p class="empty">That page doesn't exist. <a href="/">Back to posts</a></p>`,
});
