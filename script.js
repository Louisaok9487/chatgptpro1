const START_MONEY = 2500;
const PASS_START_BONUS = 300;
const MAX_PLAYERS = 4;

const boardTiles = [
  { type: "start", name: "Taipei Main Station", desc: "Pass Start: +NT$300", group: "start" },
  { type: "property", name: "Taipei", price: 450, baseRent: 90, upgradeCost: 180, group: "red" },
  { type: "event", name: "Night Market Boom", group: "event" },
  { type: "property", name: "New Taipei", price: 400, baseRent: 80, upgradeCost: 160, group: "red" },
  { type: "property", name: "Taoyuan", price: 380, baseRent: 76, upgradeCost: 150, group: "orange" },
  { type: "event", name: "Mazu Pilgrimage", group: "event" },
  { type: "property", name: "Hsinchu", price: 420, baseRent: 84, upgradeCost: 165, group: "orange" },
  { type: "property", name: "Miaoli", price: 300, baseRent: 62, upgradeCost: 130, group: "yellow" },
  { type: "event", name: "Lantern Festival", group: "event" },
  { type: "property", name: "Taichung", price: 440, baseRent: 88, upgradeCost: 170, group: "yellow" },
  { type: "property", name: "Changhua", price: 320, baseRent: 64, upgradeCost: 130, group: "green" },
  { type: "event", name: "Temple Charity", group: "event" },
  { type: "property", name: "Nantou", price: 310, baseRent: 62, upgradeCost: 125, group: "green" },
  { type: "property", name: "Yunlin", price: 330, baseRent: 66, upgradeCost: 135, group: "blue" },
  { type: "event", name: "Tea Harvest", group: "event" },
  { type: "property", name: "Tainan", price: 430, baseRent: 86, upgradeCost: 170, group: "blue" },
  { type: "property", name: "Kaohsiung", price: 470, baseRent: 94, upgradeCost: 190, group: "purple" },
  { type: "event", name: "Dragon Boat Race", group: "event" },
  { type: "property", name: "Hualien", price: 360, baseRent: 72, upgradeCost: 145, group: "purple" },
  { type: "property", name: "Taitung", price: 350, baseRent: 70, upgradeCost: 140, group: "purple" },
];

const eventDeck = [
  { text: "Tourism campaign success! Gain NT$180.", effect: (p) => { p.money += 180; } },
  { text: "Typhoon repair bill. Pay NT$150.", effect: (p) => { p.money -= 150; } },
  { text: "Bubble tea franchise royalty! Gain NT$130.", effect: (p) => { p.money += 130; } },
  { text: "Street food safety upgrade. Pay NT$120.", effect: (p) => { p.money -= 120; } },
  { text: "Cultural expo bonus! Gain NT$220.", effect: (p) => { p.money += 220; } },
  { text: "Donate to local temple event. Pay NT$90.", effect: (p) => { p.money -= 90; } },
];

const state = {
  players: [],
  currentPlayerIndex: 0,
  gameStarted: false,
  rolledThisTurn: false,
  pendingPropertyBuy: null,
};

const playerColors = ["#ff595e", "#45d56f", "#43a4ff", "#c76fff"];

const elements = {
  playerSetup: document.getElementById("playerSetup"),
  startGameBtn: document.getElementById("startGameBtn"),
  quickStartBtn: document.getElementById("quickStartBtn"),
  board: document.getElementById("board"),
  rollBtn: document.getElementById("rollBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  turnInfo: document.getElementById("turnInfo"),
  gameLog: document.getElementById("gameLog"),
  playerStatus: document.getElementById("playerStatus"),
  diceDisplay: document.getElementById("diceDisplay"),
  actionBox: document.getElementById("actionBox"),
  actionText: document.getElementById("actionText"),
  buyBtn: document.getElementById("buyBtn"),
  skipBtn: document.getElementById("skipBtn"),
};

function playSound(kind) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const setup = {
    dice: [220, 300, 0.08],
    buy: [420, 620, 0.15],
    rent: [200, 120, 0.15],
    event: [340, 440, 0.12],
    bankrupt: [220, 80, 0.25],
    win: [500, 700, 0.3],
  }[kind] || [300, 300, 0.1];

  osc.frequency.setValueAtTime(setup[0], ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(setup[1], ctx.currentTime + setup[2]);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + setup[2]);
  osc.start();
  osc.stop(ctx.currentTime + setup[2]);
}

function setupPlayerConfig() {
  elements.playerSetup.innerHTML = "";
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    const wrapper = document.createElement("div");
    wrapper.className = "player-config";
    wrapper.innerHTML = `
      <h3>Player ${i + 1}</h3>
      <label>Name</label>
      <input type="text" id="name-${i}" value="Player ${i + 1}" />
      <label>Control</label>
      <select id="type-${i}">
        <option value="human" ${i === 0 ? "selected" : ""}>Human</option>
        <option value="ai" ${i > 0 ? "selected" : ""}>PC</option>
        <option value="off">Off</option>
      </select>
    `;
    elements.playerSetup.appendChild(wrapper);
  }
}

function propertyRent(tile) {
  const level = tile.level || 0;
  return tile.baseRent + level * Math.floor(tile.baseRent * 0.6);
}

function renderBoard() {
  elements.board.innerHTML = "";
  boardTiles.forEach((tile, index) => {
    const d = document.createElement("div");
    const cls = tile.type === "property" ? `group-${tile.group}` : tile.type === "event" ? "group-event" : "group-start";
    d.className = `tile ${cls} ${getCurrentPlayer() && getCurrentPlayer().position === index ? "active" : ""}`;

    const playersHere = state.players.filter((p) => !p.bankrupt && p.position === index);
    const tokens = playersHere
      .map((p) => `<span class="token" style="background:${p.color}" title="${p.name}">${p.id + 1}</span>`)
      .join("");

    let details = `<div class="meta">${tile.desc || tile.name}</div>`;
    if (tile.type === "property") {
      const owner = tile.ownerId !== undefined ? state.players.find((p) => p.id === tile.ownerId) : null;
      details = `
        <div class="price">Price: NT$${tile.price}</div>
        <div class="rent">Rent: NT$${propertyRent(tile)}</div>
        <div class="meta">Upgrade Lv: ${tile.level || 0} / 3</div>
        <div class="owner">Owner: ${owner ? owner.name : "None"}</div>
      `;
    }

    d.innerHTML = `
      <div class="name">${index}. ${tile.name}</div>
      ${details}
      <div class="tokens">${tokens}</div>
    `;

    elements.board.appendChild(d);
  });
}

function renderStatus() {
  elements.playerStatus.innerHTML = "";
  state.players.forEach((p) => {
    const owned = boardTiles.filter((t) => t.ownerId === p.id).length;
    const netWorth = p.money + boardTiles
      .filter((t) => t.ownerId === p.id)
      .reduce((sum, t) => sum + t.price + (t.level || 0) * t.upgradeCost, 0);

    const div = document.createElement("div");
    div.className = `player-card ${p.bankrupt ? "bankrupt" : ""}`;
    div.innerHTML = `
      <strong style="color:${p.color}">${p.name}</strong> (${p.type.toUpperCase()})<br>
      💰 Cash: NT$${p.money}<br>
      🏙️ Properties: ${owned}<br>
      👑 Net Worth: NT$${netWorth}
      ${p.bankrupt ? "<br><em>Bankrupt</em>" : ""}
    `;
    elements.playerStatus.appendChild(div);
  });
}

function log(text) {
  const li = document.createElement("li");
  li.textContent = text;
  elements.gameLog.prepend(li);
}

function getCurrentPlayer() {
  return state.players[state.currentPlayerIndex];
}

function activePlayers() {
  return state.players.filter((p) => !p.bankrupt);
}

function updateTurnInfo() {
  const p = getCurrentPlayer();
  if (!p) return;
  elements.turnInfo.textContent = `${p.name}'s turn (${p.type.toUpperCase()})`;
}

function hideActionBox() {
  state.pendingPropertyBuy = null;
  elements.actionBox.classList.add("hidden");
  elements.actionText.textContent = "";
}

function movePlayer(player, steps) {
  const prev = player.position;
  player.position = (player.position + steps) % boardTiles.length;
  if (player.position < prev) {
    player.money += PASS_START_BONUS;
    log(`${player.name} passes Taipei Main Station and gets NT$${PASS_START_BONUS}.`);
  }
}

function checkBankruptcy(player) {
  if (player.money >= 0 || player.bankrupt) return;
  player.bankrupt = true;
  boardTiles.forEach((tile) => {
    if (tile.ownerId === player.id) {
      delete tile.ownerId;
      tile.level = 0;
    }
  });
  playSound("bankrupt");
  log(`💥 ${player.name} went bankrupt. Their properties return to the market.`);
}

function resolveEvent(player) {
  const card = eventDeck[Math.floor(Math.random() * eventDeck.length)];
  card.effect(player);
  playSound("event");
  log(`🎉 ${player.name} event: ${card.text}`);
}

function maybeUpgrade(player, tile) {
  if (tile.ownerId !== player.id || tile.level >= 3) return;
  if (player.money < tile.upgradeCost) return;

  const shouldUpgrade = player.type === "ai" ? Math.random() > 0.45 : confirm(`Upgrade ${tile.name} to Lv.${(tile.level || 0) + 1} for NT$${tile.upgradeCost}?`);
  if (!shouldUpgrade) return;

  player.money -= tile.upgradeCost;
  tile.level = (tile.level || 0) + 1;
  playSound("buy");
  log(`🏗️ ${player.name} upgrades ${tile.name} to Lv.${tile.level}.`);
}

function handleLanding(player) {
  const tile = boardTiles[player.position];

  if (tile.type === "start") {
    log(`${player.name} relaxes at Taipei Main Station.`);
    return;
  }

  if (tile.type === "event") {
    resolveEvent(player);
    checkBankruptcy(player);
    return;
  }

  if (tile.ownerId === undefined) {
    if (player.type === "human") {
      state.pendingPropertyBuy = { playerId: player.id, tileIndex: player.position };
      elements.actionText.textContent = `${tile.name} is unowned. Buy for NT$${tile.price}?`;
      elements.actionBox.classList.remove("hidden");
      return;
    }

    if (player.money >= tile.price && Math.random() > 0.3) {
      player.money -= tile.price;
      tile.ownerId = player.id;
      tile.level = 0;
      playSound("buy");
      log(`💎 ${player.name} buys ${tile.name} for NT$${tile.price}.`);
    } else {
      log(`${player.name} skips buying ${tile.name}.`);
    }
  } else if (tile.ownerId !== player.id) {
    const owner = state.players.find((p) => p.id === tile.ownerId);
    if (owner && !owner.bankrupt) {
      const rent = propertyRent(tile);
      player.money -= rent;
      owner.money += rent;
      playSound("rent");
      log(`🏦 ${player.name} pays NT$${rent} rent to ${owner.name} at ${tile.name}.`);
    }
  } else {
    maybeUpgrade(player, tile);
  }

  checkBankruptcy(player);
}

function endGameIfNeeded() {
  if (activePlayers().length > 1) return false;
  const winner = activePlayers()[0];
  elements.rollBtn.disabled = true;
  elements.endTurnBtn.disabled = true;
  hideActionBox();
  if (winner) {
    playSound("win");
    elements.turnInfo.textContent = `🏆 Winner: ${winner.name}`;
    log(`🏆 ${winner.name} wins Taiwan Monopoly Royale with NT$${winner.money}!`);
  } else {
    elements.turnInfo.textContent = "Game Over: all bankrupt.";
  }
  return true;
}

function switchToNextPlayer() {
  if (endGameIfNeeded()) return;

  let guard = 0;
  do {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    guard += 1;
  } while (state.players[state.currentPlayerIndex].bankrupt && guard <= state.players.length);

  state.rolledThisTurn = false;
  hideActionBox();

  const p = getCurrentPlayer();
  const human = p.type === "human";
  elements.rollBtn.disabled = !human;
  elements.endTurnBtn.disabled = !human;

  updateTurnInfo();
  renderBoard();
  renderStatus();

  if (p.type === "ai") {
    setTimeout(() => aiTakeTurn(p), 700);
  }
}

function aiTakeTurn(player) {
  if (player.bankrupt || !state.gameStarted) return;
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const sum = d1 + d2;
  elements.diceDisplay.textContent = `Dice: ${d1} + ${d2} = ${sum}`;
  playSound("dice");
  log(`🎲 ${player.name} rolls ${d1} + ${d2} = ${sum}.`);
  movePlayer(player, sum);
  handleLanding(player);
  renderBoard();
  renderStatus();

  if (endGameIfNeeded()) return;
  setTimeout(switchToNextPlayer, 700);
}

function startGame() {
  const players = [];
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    const type = document.getElementById(`type-${i}`).value;
    const name = document.getElementById(`name-${i}`).value.trim() || `Player ${i + 1}`;
    if (type !== "off") {
      players.push({
        id: i,
        name,
        type,
        money: START_MONEY,
        position: 0,
        color: playerColors[i],
        bankrupt: false,
      });
    }
  }

  if (players.length < 2) {
    alert("Enable at least 2 players.");
    return;
  }

  state.players = players;
  state.currentPlayerIndex = 0;
  state.gameStarted = true;
  state.rolledThisTurn = false;
  hideActionBox();
  boardTiles.forEach((tile) => {
    delete tile.ownerId;
    tile.level = 0;
  });
  elements.gameLog.innerHTML = "";
  elements.diceDisplay.textContent = "Dice: -";
  log("🌟 Welcome to Taiwan Monopoly Royale!");

  const first = getCurrentPlayer();
  elements.rollBtn.disabled = first.type !== "human";
  elements.endTurnBtn.disabled = first.type !== "human";

  updateTurnInfo();
  renderBoard();
  renderStatus();

  if (first.type === "ai") {
    aiTakeTurn(first);
  }
}

function quickStartGame() {
  const presets = [
    { name: "You", type: "human" },
    { name: "PC Taipei Tycoon", type: "ai" },
    { name: "PC Night Market Boss", type: "ai" },
    { name: "", type: "off" },
  ];

  presets.forEach((cfg, i) => {
    document.getElementById(`name-${i}`).value = cfg.name || `Player ${i + 1}`;
    document.getElementById(`type-${i}`).value = cfg.type;
  });

  startGame();
}

elements.startGameBtn.addEventListener("click", startGame);
elements.quickStartBtn.addEventListener("click", quickStartGame);

elements.rollBtn.addEventListener("click", () => {
  if (!state.gameStarted || state.rolledThisTurn || state.pendingPropertyBuy) return;
  const player = getCurrentPlayer();
  if (player.type !== "human") return;

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const sum = d1 + d2;

  state.rolledThisTurn = true;
  elements.diceDisplay.textContent = `Dice: ${d1} + ${d2} = ${sum}`;
  playSound("dice");
  log(`🎲 ${player.name} rolls ${d1} + ${d2} = ${sum}.`);

  movePlayer(player, sum);
  handleLanding(player);
  renderBoard();
  renderStatus();

  elements.rollBtn.disabled = true;
  elements.endTurnBtn.disabled = false;
  endGameIfNeeded();
});

elements.endTurnBtn.addEventListener("click", () => {
  if (!state.gameStarted) return;
  if (state.pendingPropertyBuy) {
    alert("Choose Buy or Skip first.");
    return;
  }
  if (!state.rolledThisTurn) {
    alert("Roll dice first.");
    return;
  }
  switchToNextPlayer();
});

elements.buyBtn.addEventListener("click", () => {
  const pending = state.pendingPropertyBuy;
  if (!pending) return;

  const player = state.players.find((p) => p.id === pending.playerId);
  const tile = boardTiles[pending.tileIndex];
  if (!player || !tile || tile.ownerId !== undefined) {
    hideActionBox();
    return;
  }

  if (player.money < tile.price) {
    log(`${player.name} cannot afford ${tile.name}.`);
    hideActionBox();
    return;
  }

  player.money -= tile.price;
  tile.ownerId = player.id;
  tile.level = 0;
  playSound("buy");
  log(`💎 ${player.name} buys ${tile.name} for NT$${tile.price}.`);

  hideActionBox();
  renderBoard();
  renderStatus();
  endGameIfNeeded();
});

elements.skipBtn.addEventListener("click", () => {
  const pending = state.pendingPropertyBuy;
  if (!pending) return;
  const tile = boardTiles[pending.tileIndex];
  log(`${getCurrentPlayer().name} skips buying ${tile.name}.`);
  hideActionBox();
});

setupPlayerConfig();
renderBoard();
