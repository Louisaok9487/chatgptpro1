# Taiwan Monopoly Royale

A luxurious browser Monopoly game in English, themed around Taiwan cities and culture.

## Why this version is better

- 🎨 **Luxury UI**: glowing neon background, premium cards, color district groups.
- 🎵 **Sound effects**: dice roll, buy, rent, event, bankruptcy, and win sounds.
- 🏙️ **Taiwan city map style** with real local city names.
- 🎉 **Taiwan culture events** (night market, temple, tea harvest, etc.).
- 🤖 **Human + PC play**: up to 4 players total.
- 🏗️ **Property upgrades** (Lv.0–Lv.3) to increase rent.
- ⚡ **Quick Start** in one click.

## How to play

1. Open `index.html` directly in a browser, OR run:

```bash
python3 -m http.server 8000
```

2. Visit `http://localhost:8000`.
3. Click **Quick Start (You + 2 PC)**.
4. On your turn: **Roll Dice** → resolve buy decision if shown → **End Turn**.

## Core rules

- Start cash: NT$2500 each.
- Pass Start (Taipei Main Station): +NT$300.
- Unowned property: buy it.
- Owned by others: pay rent.
- Owned by you: optional upgrade if you can afford it.
- Event tile: draw a random Taiwan culture event effect.
- Bankruptcy: all properties return to market.
- Last active player wins.
