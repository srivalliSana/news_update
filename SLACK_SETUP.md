# Slack → Website Auto-Publishing

Post a message (with photos) in a Slack channel and it shows up on the CUTM Campus
News site automatically. Editing the Slack message updates the article; deleting it
removes the article. The classic `/publish`, `/list-news`, `/archive-news`,
`/delete-news` slash commands still work too.

## 1. Create / open your Slack app
https://api.slack.com/apps → your app (or **Create New App → From scratch**).

## 2. Add bot scopes
**OAuth & Permissions → Scopes → Bot Token Scopes**, add:

| Scope             | Why |
|-------------------|-----|
| `channels:history`| Read messages posted in the channel |
| `files:read`      | Download the photos you attach |
| `users:read`      | Show the poster's name as the article author |

Then **Install to Workspace** and copy the **Bot User OAuth Token** (`xoxb-…`).

## 3. Give the app a public URL
Slack must be able to reach this server, so it needs a public HTTPS URL.
Running locally, use ngrok:

```bash
npm start            # starts the server on http://localhost:3000
ngrok http 3000      # gives you https://<something>.ngrok-free.app
```

Use that ngrok URL as the base in the steps below. (If the app is deployed, use its
real URL instead.)

## 4. Turn on Event Subscriptions
**Event Subscriptions → Enable Events**

- **Request URL:** `https://<your-base-url>/slack/events`
  (Slack sends a verification ping — it must show **Verified**. The signing secret
  must already be saved, see step 6.)
- **Subscribe to bot events:** add `message.channels`
  (use `message.groups` instead/also if the channel is private).
- **Save Changes** and reinstall the app if Slack asks.

## 5. Invite the bot to the channel
In the Slack channel: `/invite @YourBotName`. Grab the channel ID from
**View channel details** (bottom, looks like `C0123456789`).

## 6. Configure the server
Two options — either works:

**A. Admin portal** (`/admin.html` → Slack tab): paste the Signing Secret, the Bot
Token, and the Channel ID, then **Save**.

**B. `.env` file** (copy `.env.example` → `.env`):

```
SLACK_SIGNING_SECRET=...        # Slack App → Basic Information
SLACK_BOT_TOKEN=xoxb-...        # from step 2
SLACK_CHANNEL=C0123456789       # optional; blank = any channel the bot is in
```

Restart the server after editing `.env`.

## 7. Post!
In the channel:

```
TCS Campus Drive Results #Placements #breaking
30 students were selected today with a ₹3.6 LPA package.
Congratulations to all the students! 🎉
```

…and attach a photo. Within ~15 seconds it appears on the homepage (the page
auto-refreshes — no reload needed).

### Message format
- **First line** → headline.
- **Remaining lines** → article body (each line becomes a paragraph).
- **Section hashtag** sets the category: `#Campus #Academics #Events #Sports
  #Placements #Research #Achievements #Alumni` (default `Campus`).
- `#breaking` (or `#notice`) marks it as a notice.
- `#featured` pins it to the hero banner.
- Any other `#tag` becomes an article tag.
- **First attached image** becomes the article photo. No image → a default photo for
  that section is used.

### Notes
- Thread replies and bot/app messages are ignored — only top-level human posts
  become articles.
- Photos are downloaded into `uploads/` and served from `/uploads/...`. This folder
  is git-ignored.
- Without a public URL Slack can't deliver events; for a no-ngrok local setup you'd
  need Slack **Socket Mode** instead (not wired up here — ask if you want it).
