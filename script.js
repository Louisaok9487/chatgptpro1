const START_MONEY = 1200;
const PASS_START_BONUS = 200;
const MAX_PLAYERS = 4;

const boardTiles = [
  { type: "start", name: "Taipei Main Station", description: "Start / Pass for NT$200." },
  { type: "property", name: "Taipei", price: 220, rent: 55 },
  {
    type: "event",
    name: "Night Market Event",
    effect: (player) => {
      player.money += 120;
      return `${player.name} runs a popular night-market stall and earns NT$120!`;
    },
  },
  { type: "property", name: "New Taipei", price: 180, rent: 45 },
  { type: "property", name: "Taoyuan", price: 160, rent: 40 },
  {
    type: "event",
    name: "Mazu Pilgrimage",
    effect: (player) => {
      player.money -= 80;
      return `${player.name} joins a Mazu pilgrimage donation. Pay NT$80.`;
    },
  },
  { type: "property", name: "Hsinchu", price: 200, rent: 50 },
  { type: "property", name: "Miaoli", price: 140, rent: 35 },
  {
    type: "event",
    name: "Lantern Festival",
    effect: (player) => {
      player.money += 90;
      return `${player.name} sells lantern crafts and gains NT$90.`;
    },
  },
  { type: "property", name: "Taichung", price: 210, rent: 52 },
  { type: "property", name: "Changhua", price: 150, rent: 38 },
  {
    type: "event",
    name: "Typhoon Repair",
    effect: (player) => {
      player.money -= 110;
      return `${player.name} pays NT$110 for typhoon repair costs.`;
    },
  },
  { type: "property", name: "Nantou", price: 130, rent: 32 },
  { type: "property", name: "Yunlin", price: 120, rent: 30 },
  {
    type: "event",
    name: "Tea Harvest Season",
    effect: (player) => {
      player.money += 100;
      return `${player.name} profits from Alishan tea season: +NT$100.`;
    },
  },
  { type: "property", name: "Tainan", price: 190, rent: 48 },
  { type: "property", name: "Kaohsiung", price: 230, rent: 58 },
  {
    type: "event",
    name: "Dragon Boat Festival",
    effect: (player) => {
      player.money += 70;
      return `${player.name} wins a dragon boat sponsor bonus of NT$70.`;
    },
  },
  { type: "property", name: "Hualien", price: 170, rent: 42 },
  { type: "property", name: "Taitung", price: 150, rent: 38 },
];

const state = {
  players: [],
  currentPlayerIndex: 0,
  gameStarted: false,
  rolledThisTurn: false,
};

const playerColors = ["#ff5252", "#4caf50", "#1976d2", "#8e24aa"];

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
};

function setupPlayerConfig() {
  elements.playerSetup.innerHTML = "";
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    const wrapper = document.createElement("div");
    wrapper.className = "player-config";

    wrapper.innerHTML = `
      <h3>Player ${i + 1}</h3>
      <label>
        Name:
        <input type="text" id="name-${i}" value="Player ${i + 1}" />
      </label>
      <br />
      <label>
        Control:
        <select id="type-${i}">
          <option value="human" ${i === 0 ? "selected" : ""}>Human</option>
          <option value="ai" ${i > 0 ? "selected" : ""}>PC</option>
          <option value="off">Off</option>
        </select>
      </label>
    `;

    elements.playerSetup.appendChild(wrapper);
  }
}

function renderBoard() {
  elements.board.innerHTML = "";
  boardTiles.forEach((tile, index) => {
    const tileDiv = document.createElement("div");
    tileDiv.className = `tile ${tile.type}`;

    let ownerText = "";
    if (tile.ownerId !== undefined) {
      const owner = state.players.find((p) => p.id === tile.ownerId);
      ownerText = `<div class="owner">Owner: ${owner ? owner.name : "None"}</div>`;
    }

    const playersHere = state.players.filter((p) => !p.bankrupt && p.position === index);
    const tokens = playersHere
      .map(
        (p) =>
          `<span class="token" style="background:${p.color}" title="${p.name}">${p.id + 1}</span>`
      )
      .join("");

    const tileExtra =
      tile.type === "property"
        ? `<div>Price: NT$${tile.price}</div><div>Rent: NT$${tile.rent}</div>`
        : `<div>${tile.description || tile.name}</div>`;

    tileDiv.innerHTML = `
      <strong>${index}. ${tile.name}</strong>
      ${tileExtra}
      ${ownerText}
      <div class="tokens">${tokens}</div>
    `;

    elements.board.appendChild(tileDiv);
  });
}

function renderStatus() {
  elements.playerStatus.innerHTML = "";
  state.players.forEach((player) => {
    const div = document.createElement("div");
    div.className = `player-card ${player.bankrupt ? "bankrupt" : ""}`;
    div.innerHTML = `
      <strong style="color:${player.color}">${player.name}</strong> (${player.type.toUpperCase()})<br/>
      Money: NT$${player.money}<br/>
      Position: ${player.position} - ${boardTiles[player.position].name}
      ${player.bankrupt ? "<br/><em>Bankrupt</em>" : ""}
    `;
    elements.playerStatus.appendChild(div);
  });
}

function addLog(message) {
  const item = document.createElement("li");
  item.textContent = message;
  elements.gameLog.prepend(item);
}

function getCurrentPlayer() {
  return state.players[state.currentPlayerIndex];
}

function updateTurnInfo() {
  const player = getCurrentPlayer();
  if (!player) return;
  elements.turnInfo.textContent = `${player.name}'s turn (${player.type.toUpperCase()})`;
}

function activePlayers() {
  return state.players.filter((p) => !p.bankrupt);
}

function movePlayer(player, steps) {
  const oldPos = player.position;
  player.position = (player.position + steps) % boardTiles.length;
  if (player.position < oldPos) {
    player.money += PASS_START_BONUS;
    addLog(`${player.name} passes Start and collects NT$${PASS_START_BONUS}.`);
  }
}

function checkBankruptcy(player) {
  if (player.money >= 0 || player.bankrupt) return;

  player.bankrupt = true;
  boardTiles.forEach((tile) => {
    if (tile.ownerId === player.id) {
      delete tile.ownerId;
    }
  });
  addLog(`${player.name} is bankrupt! Their properties return to the market.`);
}

function handleTile(player) {
  const tile = boardTiles[player.position];

  if (tile.type === "property") {
    if (tile.ownerId === undefined) {
      const shouldBuy = player.money >= tile.price && (player.type === "ai" ? Math.random() > 0.35 : confirm(`${player.name}, buy ${tile.name} for NT$${tile.price}?`));
      if (shouldBuy) {
        player.money -= tile.price;
        tile.ownerId = player.id;
        addLog(`${player.name} buys ${tile.name} for NT$${tile.price}.`);
      } else {
        addLog(`${player.name} skips buying ${tile.name}.`);
      }
    } else if (tile.ownerId !== player.id) {
      const owner = state.players.find((p) => p.id === tile.ownerId);
      if (owner && !owner.bankrupt) {
        player.money -= tile.rent;
        owner.money += tile.rent;
        addLog(`${player.name} pays NT$${tile.rent} rent to ${owner.name} at ${tile.name}.`);
      }
    }
  } else if (tile.type === "event") {
    addLog(tile.effect(player));
  } else {
    addLog(`${player.name} rests at Start.`);
  }

  checkBankruptcy(player);
}

function nextTurn() {
  if (activePlayers().length <= 1) {
    endGame();
    return;
  }

  let attempts = 0;
  do {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    attempts += 1;
  } while (state.players[state.currentPlayerIndex].bankrupt && attempts <= state.players.length);

  state.rolledThisTurn = false;
  const player = getCurrentPlayer();
  const isHuman = player.type === "human";

  elements.rollBtn.disabled = !isHuman;
  elements.endTurnBtn.disabled = !isHuman;

  updateTurnInfo();
  renderBoard();
  renderStatus();

  if (player.type === "ai") {
    setTimeout(() => {
      aiTakeTurn(player);
    }, 800);
  }
}

function aiTakeTurn(player) {
  if (player.bankrupt) {
    nextTurn();
    return;
  }
  const dice = Math.floor(Math.random() * 6) + 1;
  addLog(`${player.name} (PC) rolls ${dice}.`);
  movePlayer(player, dice);
  handleTile(player);
  renderBoard();
  renderStatus();
  nextTurn();
}

function endGame() {
  const winner = activePlayers()[0];
  elements.rollBtn.disabled = true;
  elements.endTurnBtn.disabled = true;
  if (winner) {
    elements.turnInfo.textContent = `Game Over! Winner: ${winner.name}`;
    addLog(`Game Over! ${winner.name} wins with NT$${winner.money}.`);
  } else {
    elements.turnInfo.textContent = "Game Over! Everyone went bankrupt.";
  }
}


function quickStartGame() {
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    const nameInput = document.getElementById(`name-${i}`);
    const typeSelect = document.getElementById(`type-${i}`);

    if (i === 0) {
      nameInput.value = "You";
      typeSelect.value = "human";
    } else if (i === 1) {
      nameInput.value = "PC Taipei";
      typeSelect.value = "ai";
    } else {
      typeSelect.value = "off";
    }
  }

  startGame();
}

function startGame() {
  const players = [];

  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    const name = document.getElementById(`name-${i}`).value.trim() || `Player ${i + 1}`;
    const type = document.getElementById(`type-${i}`).value;
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
    alert("Please enable at least 2 players.");
    return;
  }

  state.players = players;
  state.currentPlayerIndex = 0;
  state.gameStarted = true;
  state.rolledThisTurn = false;

  boardTiles.forEach((tile) => {
    if (tile.type === "property") delete tile.ownerId;
  });

  elements.gameLog.innerHTML = "";
  addLog("Game started! Taiwan Culture Monopoly Lite begins.");

  const firstPlayer = getCurrentPlayer();
  elements.rollBtn.disabled = firstPlayer.type !== "human";
  elements.endTurnBtn.disabled = firstPlayer.type !== "human";

  renderBoard();
  renderStatus();
  updateTurnInfo();

  if (firstPlayer.type === "ai") {
    aiTakeTurn(firstPlayer);
  }
}

elements.startGameBtn.addEventListener("click", startGame);
elements.quickStartBtn.addEventListener("click", quickStartGame);

elements.rollBtn.addEventListener("click", () => {
  if (!state.gameStarted || state.rolledThisTurn) return;
  const player = getCurrentPlayer();
  if (player.type !== "human") return;

  const dice = Math.floor(Math.random() * 6) + 1;
  state.rolledThisTurn = true;
  addLog(`${player.name} rolls ${dice}.`);
  movePlayer(player, dice);
  handleTile(player);
  renderBoard();
  renderStatus();

  elements.rollBtn.disabled = true;
  elements.endTurnBtn.disabled = false;

  if (activePlayers().length <= 1) {
    endGame();
  }
});

elements.endTurnBtn.addEventListener("click", () => {
  if (!state.gameStarted) return;
  if (!state.rolledThisTurn) {
    alert("Roll dice before ending turn.");
    return;
  }

  nextTurn();
});

setupPlayerConfig();
renderBoard();
