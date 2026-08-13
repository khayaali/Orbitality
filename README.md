# ORBIT — Training Deck 🚀

A spaceship-console workout tracker. Build named routines, log every session
with the right fields per exercise, and watch a monthly gauge climb toward
**orbit** (your 20-workout target).

Now also tracks **food & calories** (1800/day target), has a **light theme**,
and nudges you to **back up every Saturday**.

## What's inside
- `index.html` — the entire app (HTML + CSS + JS, no dependencies)
- `manifest.webmanifest`, `sw.js`, `icon-*.png` — makes it installable + offline
- `netlify.toml` — caching + functions config (no build step for the app)
- `netlify/functions/estimate-calories.js` — server-side calorie estimator (optional)

## Food & calories
On the Deck there's a **Food** panel: jot what you ate in plain language
("2 rotis, dal, rice and a gulab jamun"), tap **ESTIMATE** for a calorie guess,
adjust if you like, then **LOG**. A fuel meter tracks today's intake against your
daily target (default **1800**, editable in Config). The calendar tints each day
green when you stayed at/under target and pink when you went over; a cyan dot marks
training days.

### Turning on calorie estimates (optional but recommended)
Estimation runs through a Netlify Function so your API key never touches the
browser. Without it, the app still works — you just type the kcal in yourself.

To enable it, pick **one** provider and add its key as a Netlify environment
variable (*Site settings → Environment variables*), then redeploy:

- **Claude (recommended)** — best for casual notes and Indian/regional food.
  Get a key at console.anthropic.com and set `ANTHROPIC_API_KEY`.
- **Nutritionix** — dedicated food database. Set `NUTRITIONIX_APP_ID` and
  `NUTRITIONIX_APP_KEY` (free developer tier at nutritionix.com/business/api).
- **API Ninjas** — set `API_NINJAS_KEY` (free key at api-ninjas.com).

The function auto-detects whichever key is present. That's the only setup — no code
changes needed. (You can change the Claude model at the top of the function file.)

> Heads up: Netlify Functions run on Git or CLI deploys. Drag-and-drop deploys the
> static app instantly (with manual kcal entry); add a key + deploy from Git/CLI to
> switch estimates on.

## Themes & backup
- **Theme** — toggle dark/light from the ☀/☾ button in the header, or in Config.
- **Saturday backup** — on Saturdays the Deck shows a reminder to download your
  data. Backups (and Config → Export) are named `ShivLogs-ddmmyy.json`.

## How data works
Everything is stored **locally on your device** via the browser's `localStorage`.
There's no account and no server — fast, private, works with no signal at the gym.
Because it's device-local, use **Config → Export** now and then to back up, and
**Import** to move data to a new phone.

## Deploy to Netlify

**Easiest — drag & drop:**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page.
3. Done — you get a live URL.

**From Git:**
1. Push this folder to a GitHub repo.
2. In Netlify: *Add new site → Import from Git* → pick the repo.
3. Leave build command empty, publish directory `.`. Deploy.

**From the CLI:**
```bash
npm i -g netlify-cli
netlify deploy --dir . --prod
```

## Use it at the gym
Open the site on your phone → **Share → Add to Home Screen**. It launches
full-screen like a native app and works offline.

### Flow
1. **Routines → + NEW** — name it, search the ~90 preloaded exercises, add them, save.
2. **Deck → BEGIN WORKOUT** — pick the routine. Each exercise shows the right
   inputs (weight+reps, bodyweight, time, cardio distance, or assisted) and your
   **last time** as a starting point so you can push higher. Add sets as needed.
3. **END & LOG WORKOUT** — saved to your logbook; the monthly gauge updates.
4. Hit 20 in a month and the deck goes green + celebrates. Beat it → escape velocity.
5. **Food** — after a meal, note it on the Deck, ESTIMATE, and LOG to keep the day green.

## Updating
Edit `index.html`, bump `CACHE = "orbit-v1"` in `sw.js` to `orbit-v2`, redeploy.
