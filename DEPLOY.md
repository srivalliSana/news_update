# Deploying CUTM Campus News (Ubuntu + domain + HTTPS)

Target: a fresh Ubuntu/Debian server with a domain (e.g. `news.cutm.ac.in`) whose
DNS **A record already points to the server's IP**.

Architecture: `Browser/Slack → Nginx (443, HTTPS) → Node app (127.0.0.1:3000)`,
kept alive by systemd.

Replace `YOUR_DOMAIN` and the `cutm` username/paths to match your setup.

---

## 0. Point DNS (do this first)
Create an **A record**: `YOUR_DOMAIN → <server public IP>`. Verify:
```bash
dig +short YOUR_DOMAIN      # should print your server IP
```
HTTPS (Step 5) fails until this resolves.

## 1. Create a non-root user (run once)
```bash
sudo adduser --disabled-password --gecos "" cutm
sudo usermod -aG sudo cutm
sudo su - cutm           # become the app user
```

## 2. Install Node.js 20 LTS + git
The app uses the global `fetch` (Node 18+), so install Node 20:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v                  # v20.x
```

## 3. Get the code + install deps
```bash
cd ~
git clone https://github.com/srivalliSana/news_update.git
cd news_update
npm install --omit=dev   # production deps only (express, dotenv)
```

## 4. Configure secrets (.env)
```bash
cp .env.example .env
nano .env
```
Set:
```
PORT=3000
SLACK_SIGNING_SECRET=<from Slack App → Basic Information>
SLACK_BOT_TOKEN=xoxb-...           # Bot User OAuth Token
SLACK_CHANNEL=G0107MF82CD          # your private channel ID (optional)
```
`.env` is git-ignored — it never gets committed.

> You can also set these later in the admin portal (Slack tab); `.env` is just the
> headless way.

## 5. Run as a service (systemd)
```bash
sudo cp ~/news_update/deploy/news-update.service /etc/systemd/system/
# If your user/path isn't cutm:/home/cutm, edit the file first.
sudo systemctl daemon-reload
sudo systemctl enable --now news-update
sudo systemctl status news-update          # should be "active (running)"
curl -s localhost:3000/api/articles | head -c 80   # sanity check
```
Logs: `journalctl -u news-update -f`
After a `git pull`, redeploy with: `sudo systemctl restart news-update`

## 6. Nginx reverse proxy
```bash
sudo apt-get install -y nginx
sudo cp ~/news_update/deploy/nginx.conf /etc/nginx/sites-available/news-update
sudo sed -i 's/YOUR_DOMAIN/news.cutm.ac.in/' /etc/nginx/sites-available/news-update
sudo ln -s /etc/nginx/sites-available/news-update /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Now `http://YOUR_DOMAIN` should show the site.

## 7. Free HTTPS (Let's Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN --redirect -m you@example.com --agree-tos -n
```
certbot edits the Nginx config to add the 443 block + auto-renews. Test:
`https://YOUR_DOMAIN`.

## 8. Firewall (optional but recommended)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 9. Point Slack at the live URL
In your Slack app (https://api.slack.com/apps → your app):
- **OAuth & Permissions → Bot Token Scopes:** `groups:history`, `files:read`, `users:read` → **Reinstall**.
- **Event Subscriptions → Enable** → Request URL:
  `https://YOUR_DOMAIN/slack/events` → wait for **Verified ✓**
  → **Subscribe to bot events:** add `message.groups` → **Save Changes**.
- In Slack, invite the bot to the private channel: `/invite @YourBot`.

## 10. Harden the admin password
Default is `cutm@admin`. Change it: open `https://YOUR_DOMAIN/admin.html` →
log in → **Settings → Change Admin Password**.

---

## Verify end-to-end
1. `https://YOUR_DOMAIN` loads the news portal.
2. Post a headline-first message (with a photo) in the private channel.
3. It appears on the site within ~15 seconds, photo and all.

## Updating later
```bash
cd ~/news_update && git pull && npm install --omit=dev && sudo systemctl restart news-update
```

## Notes
- **Data lives in files** on the server: `articles.json`, `config.json`,
  `site-settings.json`, and the `uploads/` folder. Back these up (e.g. a nightly
  `tar`/`rsync` or cron). They are git-ignored, so a `git pull` won't touch them.
- **Photos** downloaded from Slack are stored in `uploads/` and served at `/uploads/...`.
- The Node app only listens on `127.0.0.1:3000` behind Nginx — it is not exposed
  directly. Don't open port 3000 in the firewall.
