# LocalPosts (prototype)

A mobile-first personals board. The front page is a scrolling feed of listings: photo on the left with the post time underneath, then a blue headline, the location and a short preview. Anyone can browse; you need an account to post.

## Run it

```bash
npm install
npm start
# open http://localhost:3000
```

A demo account is seeded on first run: **demo / demo1234**.

## What's in it

- Feed with keyword/area search (`/`)
- Post detail page with photo gallery (`/post/:id`)
- Sign up / log in / log out with a username and password (passwords hashed with scrypt)
- Create a post with 1–5 photos (JPG/PNG/WEBP/GIF, 5 MB each); authors can delete their own posts

## Prototype limits (fix before launch)

- Data lives in `data/db.json` and photos in `uploads/`. Move to a real database and object storage.
- Set `SESSION_SECRET` and serve over HTTPS.
- Needs moderation tools, reporting, rate limiting, and real age verification.

## Phone preview

`preview.html` is a single-file version of the same screens that runs entirely in the browser (accounts and posts are saved on that device only). Open it directly to click through the design without running the server.
