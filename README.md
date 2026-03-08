# Taiwan Culture Monopoly Lite

A lightweight Monopoly-style browser game in English with a Taiwan theme.

## Features

- Up to **4 players**.
- Each player can be set as **Human**, **PC (AI)**, or **Off**.
- Taiwan city properties using local names (e.g., Taipei, Kaohsiung, Tainan, Hualien).
- Cultural event tiles inspired by Taiwanese culture:
  - Night Market
  - Mazu Pilgrimage
  - Lantern Festival
  - Dragon Boat Festival
  - Tea Harvest
  - Typhoon repair
- Human players use buttons to roll dice and end turn.
- PC players automatically play their turns.
- Includes a **Quick Start** button so you can start playing immediately.

## How to run

Open `index.html` directly in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

### Start playing immediately
1. Click **Quick Start (1 Human + 1 PC)**.
2. In your turn, click **Roll Dice** then **End Turn**.
3. Keep buying Taiwan city properties and outlast the other player(s).

## Rules (Lite)

- All players start with NT$1200 at tile 0 (Start).
- Pass Start to collect NT$200.
- Land on unowned property: buy it if you want/can.
- Land on other player's property: pay rent.
- Land on event: trigger a Taiwanese culture event effect.
- If your money drops below 0, you go bankrupt and lose properties.
- Last non-bankrupt player wins.
