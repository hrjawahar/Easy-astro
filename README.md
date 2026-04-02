# D1–D9 Insight Mapper

A browser-only, manual-entry astrology interpretation app that keeps the D1 and D9 grid structure intact while separating the analysis engine into its own file.

## Files

- `index.html` — layout and page structure
- `styles.css` — UI styles
- `app.js` — UI logic, save/load, report download, rendering
- `analyze.js` — chart rule engine and interpretation logic

## What this version includes

- D1 and D9 grid-first manual input
- Rule-based analysis split into `analyze.js`
- Save / load history using browser localStorage
- Downloadable HTML report
- Reference page
- Foreign travel / stay / settlement insight
- Mahadasha watch zone flags for afflicted/debilitated significators
- No Tamil layer for now
- No suspense wording or ghost-name placeholder

## Important scope limits

This is **not** a birth-chart calculator yet.

It does **not**:
- compute D1 or D9 from DOB / time / place
- calculate actual mahadasha dates
- replace a full astrologer review
- include backend services

## Run locally

Open `index.html` in a browser.

For best results, use a local server if your browser blocks any local-file behaviors:

### Option 1: VS Code Live Server
Open the folder and run with Live Server.

### Option 2: Python local server
From the project folder:
```bash
python -m http.server 8000
```

Then open:
```text
http://localhost:8000
```

## Deploy

This works as a static app on:
- GitHub Pages
- Cloudflare Pages
- Netlify

## Architecture note

You specifically asked about `analyze.js`.

This version separates responsibilities properly:
- `app.js` handles UI and persistence
- `analyze.js` handles interpretation rules

That makes future scaling much easier for:
- stronger karaka logic
- house-lord relationship logic
- aspect refinement
- yogas
- dasha refinement
- domain-wise verdicts

## Next logical upgrade

The next stable upgrade would be:
1. auto-calc from DOB / time / place
2. stronger afflicted-planet logic
3. richer D1 vs D9 synthesis
4. downloadable PDF instead of HTML-only report
5. configurable interpretation template
