# Vocalinty — Static HTML/CSS/JS Site

A pure HTML, CSS, and JavaScript website for the Vocalinty YouTube channel.
No framework. No build step. No dependencies to install. Just open the files
in VS Code and edit.

---

## Quick Start (local preview)

You have two options:

### Option A: Open directly in a browser
Just double-click `index.html`. That's it.

### Option B: Run a tiny local server (recommended)
Some browsers block certain features when opening HTML files via `file://`.
Use a local server instead:

**With Python (already installed on most systems):**
```bash
cd vocalinty-static
python3 -m http.server 8000
```
Then open: http://localhost:8000

**With VS Code:**
Install the "Live Server" extension, right-click `index.html`, choose
"Open with Live Server".

**With Node:**
```bash
npx serve vocalinty-static
```

---

## File structure

```
vocalinty-static/
├── index.html          ← Blog list (home page)
├── blog.html           ← Blog detail page (?id=...)
├── about.html          ← About Us page
├── contact.html        ← Contact page (form + social cards)
├── privacy.html        ← Privacy Policy page
├── terms.html          ← Terms of Service page
├── admin.html          ← Hidden admin panel (bookmark this)
├── README.md           ← This file
├── manifest.json       ← PWA manifest (icon + theme color for mobile)
├── _redirects          ← Netlify config for clean URLs (/about → /about.html)
├── css/
│   └── styles.css      ← All site styling (edit colors, fonts, spacing here)
├── js/
│   ├── config.js       ← Supabase URL, social links, contact email — EDIT THIS
│   ├── supabase-client.js  ← Initializes the Supabase client
│   ├── theme.js        ← Dark mode toggle (uses localStorage)
│   ├── layout.js       ← Shared header/footer + SVG icons
│   ├── markdown.js     ← Minimal Markdown renderer (for blog content)
│   ├── spotify.js      ← Converts Spotify URLs to embed URLs
│   ├── home.js         ← Blog list logic (sort, search, fetch)
│   ├── blog.js         ← Blog detail logic (view increment, embeds)
│   ├── info.js         ← Shared layout for About/Contact/Privacy/Terms
│   └── admin.js        ← Admin login + editor + toolbar + preview + list
└── assets/
    └── VocalintyLogo2.png  ← Channel logo (used as favicon + header logo)
```

---

## Clean URLs (no .html in the address bar)

All internal links use clean URLs:
- Home: `/` (not `/index.html`)
- About: `/about` (not `/about.html`)
- Contact: `/contact`
- Privacy: `/privacy`
- Terms: `/terms`
- Blog detail: `/blog?id=...`
- Admin: `/admin.html` (kept as .html — it's the secret unlisted URL)

These work automatically on Netlify, Vercel, Cloudflare Pages, and GitHub
Pages. The `_redirects` file ensures Netlify resolves them correctly.

---

## Favicon + mobile app icon

Every HTML page includes:
```html
<link rel="icon" type="image/png" href="assets/VocalintyLogo2.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/VocalintyLogo2.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#161616">
```

This means:
- **Browser tab** shows the Vocalinty logo next to the page title
- **iPhone/iPad home screen** shows the logo when someone adds your site
- **Android Chrome** shows a dark browser bar (matches dark mode)
- **PWA install** lets users "Add to Home Screen" and it behaves like an app

---

## How to edit common things

### Change your social media links
Open `js/config.js` and edit the `social` object:
```js
social: {
  youtube: 'https://www.youtube.com/@vocalinty',
  instagram: 'https://www.instagram.com/vocalinty/',
  spotify: 'https://open.spotify.com/user/31nfm4sw2lbopayld4t62flcc6oy',
  tiktok: 'https://www.tiktok.com/@vocalinty',
},
```
These links are used in the header, footer, contact page, and about page.

### Change the contact email
In `js/config.js`:
```js
contactEmail: 'vocalintyofficial@gmail.com',
```
Used on the Contact page form and the "Direct Email" link.

### Change the Buy Me a Coffee link
In `js/config.js`:
```js
buyMeACoffee: 'https://buymeacoffee.com/vocalinty',
```
This is the permanent button in the top-right of every page's header.

### Change Supabase credentials
In `js/config.js`:
```js
supabaseUrl: 'https://kpamutvtmmyjastnixco.supabase.co',
supabaseKey: 'sb_publishable_g5jUYldrx2vreDeYdV9u0w_0L3mPEPd',
```
The publishable key is SAFE to expose in browser JavaScript because Row
Level Security (RLS) is enabled on the `blogs` table — the public can only
READ published blogs. All writes (create/delete) go through RPC functions
that verify the admin password server-side.

### Change the admin password
The password is stored in your Supabase database (not in this code). To
change it, run this SQL in the Supabase SQL Editor:
```sql
UPDATE admins
SET password_hash = md5('vocalinty_pepper_2026' || 'YOUR_NEW_PASSWORD')
WHERE username = 'admin';
```

### Change colors / fonts / spacing
Open `css/styles.css`. The design tokens are at the top:
```css
:root {
  --bg: #ffffff;
  --fg: #161616;
  --muted: #f5f5f5;
  --muted-fg: #6b6b6b;
  --border: #e2e2e2;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...;
  --font-serif: "Playfair Display", Georgia, "Times New Roman", serif;
  ...
}
```
Edit these values and the entire site updates. The dark theme tokens are
under `html.dark { ... }`.

### Replace the logo
Replace `assets/VocalintyLogo2.png` with your own logo. Keep the same
filename, or update the references in:
- `js/layout.js` (header + footer logo)
- Every HTML file's `<head>` section (favicon + apple-touch-icon)
- `manifest.json` (PWA icon)

### Edit the Privacy Policy / Terms / About / Contact content
Each page is a standalone HTML file:
- `privacy.html` — find the `bodyHtml:` template string, edit the HTML inside
- `terms.html` — same
- `about.html` — same
- `contact.html` — same (also has form handler logic)

### Edit the hero text on the home page
Open `index.html` and find:
```html
<h1 class="hero__title">
  Find out more in<br>
  the world of <em>music</em>.
</h1>
<p class="hero__sub">
  Daily Viral News On Music. Music Playlists. Everythere Here!
</p>
```

---

## Hosting (deploy anywhere)

Because this is pure static HTML/CSS/JS, you can host it on any static host.
Pick whichever you prefer:

### Netlify (easiest)
1. Go to https://app.netlify.com/drop
2. Drag the entire `vocalinty-static` folder onto the page
3. Done. You get a public URL instantly.
4. (Optional) Connect a custom domain in site settings.
5. The `_redirects` file ensures clean URLs work automatically.

### GitHub Pages
1. Create a new GitHub repository
2. Upload all files from `vocalinty-static/` to the repo
   (Note: GitHub's web uploader can't upload folders — use the `/` trick
   to create folders, e.g. type `css/styles.css` as the filename)
3. Go to Settings → Pages → Source → `main` branch → `/` root → Save
4. Your site will be at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Cloudflare Pages
1. Go to https://dash.cloudflare.com → Workers & Pages → Create
2. Click the **Pages** tab (NOT Workers) → Connect to Git
3. Connect your GitHub repo
4. Build command: (leave empty)
5. Build output directory: `/`
6. Deploy

### Vercel
1. Go to https://vercel.com/new
2. Import your Git repo, or drag the folder
3. Framework: "Other" — no build command needed
4. Deploy

### Any traditional web host (cPanel, etc.)
Upload all files via FTP to the `public_html` folder. Done.

---

## Security model (how the site stays secure)

### What's exposed in the browser
- The Supabase publishable (anon) key — **this is intentional and safe**
- This key only grants the `anon` Postgres role

### What's protected
- The `blogs` table — Row Level Security (RLS) only allows `anon` to SELECT
  published rows. Direct INSERT/UPDATE/DELETE are revoked.
- The `admins` table — RLS with NO policies. No one (not even authenticated
  users) can read it directly.
- The admin password — stored as a salted MD5 hash in the `admins` table.
  Never sent to the browser unless you type it into the admin login form.

### How writes work
All create/delete operations call SECURITY DEFINER RPC functions:
- `create_blog(p_password, ...)` — verifies password, then inserts
- `delete_blog(p_password, p_id)` — verifies password, then deletes
- `increment_blog_view(p_id)` — public, just increments the view counter
- `verify_admin_credentials(p_password)` — returns true/false

If someone steals your publishable key, the worst they can do is read
published blogs (which they could already do via the website). They cannot
edit, delete, or publish anything without the admin password.

---

## Admin access

The admin panel is at `admin.html`. There is no link to it anywhere on the
public site. Bookmark the URL for quick access.

Default credentials (set in your Supabase database):
- Username: `admin` (not actually checked — only the password matters)
- Password: `Vocalinty@02175683`

**First-time setup:** You must run the SQL in
`supabase-admin-security-nopgcrypto.sql` (located in the parent
`download/` folder) in your Supabase SQL Editor to create the `admins`
table, the RPC functions, and enable RLS. Until you do, the admin panel
will reject all login attempts.

---

## Troubleshooting

### "Failed to load posts" on the home page
- Check `js/config.js` — make sure `supabaseUrl` and `supabaseKey` are correct
- Open browser dev tools (F12) → Console tab — look for error messages
- Make sure you've run the `supabase-blogs-schema.sql` script in Supabase

### Admin login says "Verification failed"
- You haven't run the `supabase-admin-security-nopgcrypto.sql` script yet
- Or the password in your database doesn't match what you're typing
- Open browser dev tools → Console for the specific error

### Favicon (logo) not showing on the browser tab
- Make sure `assets/VocalintyLogo2.png` is uploaded to your host
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Browsers cache favicons aggressively — try in incognito mode
- Open `https://YOURSITE/assets/VocalintyLogo2.png` directly to verify it loads

### Clean URLs don't work (e.g. /about shows 404)
- On Netlify: make sure `_redirects` is in the root of your deployed folder
- On GitHub Pages: clean URLs may not work — use `/about.html` instead
- On Cloudflare Pages / Vercel: clean URLs work automatically

### Dark mode doesn't persist across pages
- Make sure your browser allows localStorage (private/incognito mode blocks it)
- Check that `js/theme.js` is loaded on every page (it is, by default)

### Spotify embed doesn't show
- Make sure the URL is a valid Spotify share URL (open.spotify.com/playlist/...)
- Check browser dev tools → Network tab — the iframe should load

### Images don't load
- Cover image URLs must be absolute (https://...)
- Some image hosts block hotlinking — try a different host (Unsplash works)

### Site has no styling (plain unstyled HTML)
- The `css/` and `js/` folders didn't upload to your host
- GitHub's web uploader can't upload folders — use the `/` trick:
  click "Create new file", type `css/styles.css`, paste the contents, commit
- Or use GitHub Desktop which handles folders properly

---

## Need help?
Open browser dev tools (F12) and check the Console tab — most errors will
show up there with a clear message.
