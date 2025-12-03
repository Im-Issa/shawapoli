// --- DICE + UI SETUP ---

const rollButton = document.getElementById('rollButton');
const resetButton = document.getElementById('resetButton');
const diceResultSpan = document.getElementById('diceResult');
const currentPlayerSpan = document.getElementById('currentPlayer');

const p1MoneySpan = document.getElementById('p1Money');
const p2MoneySpan = document.getElementById('p2Money');
const p3MoneySpan = document.getElementById('p3Money');
const p4MoneySpan = document.getElementById('p4Money');

const startingMoney = 1500;

// Random integer 1–6
function rollSingleDie() {
    return Math.floor(Math.random() * 6) + 1;
}

// --- BOARD / PATH SETUP ---

// All tiles in DOM order (row by row)
const allTiles = Array.from(document.querySelectorAll('.board .tile'));
const GRID_SIZE = 11;

function tileAt(row, col) {
    return allTiles[row * GRID_SIZE + col];
}

// Build perimeter path clockwise starting from bottom-right (GO)
const pathTiles = [];

// Bottom row: row 10, col 10 → 0
for (let c = GRID_SIZE - 1; c >= 0; c--) {
    pathTiles.push(tileAt(GRID_SIZE - 1, c));
}

// Left column: row 9 → 1, col 0
for (let r = GRID_SIZE - 2; r >= 1; r--) {
    pathTiles.push(tileAt(r, 0));
}

// Top row: row 0, col 1 → 10
for (let c = 1; c < GRID_SIZE; c++) {
    pathTiles.push(tileAt(0, c));
}

// Right column: row 1 → 9, col 10
for (let r = 1; r < GRID_SIZE - 1; r++) {
    pathTiles.push(tileAt(r, GRID_SIZE - 1));
}

// Find GO index
const startIndex = pathTiles.findIndex(
    tile => tile.textContent.trim().toUpperCase() === 'GO'
);

// --- PROPERTY DATA ---

// Define simple prices & rent for named properties by their text content
const propertyDefinitions = {
    'Mediterranean Avenue': { price: 60, rent: 4 },
    'Baltic Avenue': { price: 60, rent: 4 },

    'Oriental Avenue': { price: 100, rent: 6 },
    'Vermont Avenue': { price: 100, rent: 6 },
    'Connecticut Avenue': { price: 120, rent: 8 },

    'St. Charles Place': { price: 140, rent: 10 },
    'States Avenue': { price: 140, rent: 10 },
    'Virginia Avenue': { price: 160, rent: 12 },

    'St. James Place': { price: 180, rent: 14 },
    'Tennessee Avenue': { price: 180, rent: 14 },
    'New York Avenue': { price: 200, rent: 16 },

    'Illinois Avenue': { price: 240, rent: 20 },
    'Amlapara': { price: 220, rent: 18 },      // custom
    'Universal Spot': { price: 260, rent: 22 }, // custom

    'Atlantic Avenue': { price: 260, rent: 22 },
    'Ventnor Avenue': { price: 260, rent: 22 },
    'Marvin Gardens': { price: 280, rent: 24 },

    'Pacific Avenue': { price: 300, rent: 26 },
    'Fatullah': { price: 320, rent: 28 },        // custom
    'Pennsylvania Avenue': { price: 320, rent: 28 },

    'Park Place': { price: 350, rent: 35 },
    'Boardwalk': { price: 400, rent: 50 }
};

// Track ownership by tile index
// propertyOwners[pathIndex] = playerId (1–4)
const propertyOwners = {};

// --- PLAYER SETUP ---

const players = [];

// Helper to create a player
function createPlayer(id, className) {
    return {
        id,
        positionIndex: startIndex,
        money: startingMoney,
        token: (() => {
            const el = document.createElement('div');
            el.className = `player-token ${className}`;
            return el;
        })()
    };
}

// Create 4 players
players.push(createPlayer(1, 'player1'));
players.push(createPlayer(2, 'player2'));
players.push(createPlayer(3, 'player3'));
players.push(createPlayer(4, 'player4'));

let currentPlayerIndex = 0; // 0–3

// Update player money display
function updateMoneyDisplay() {
    p1MoneySpan.textContent = players[0].money;
    p2MoneySpan.textContent = players[1].money;
    p3MoneySpan.textContent = players[2].money;
    p4MoneySpan.textContent = players[3].money;
}

// Put all tokens at their positions
function updatePlayerPositions() {
    players.forEach(player => {
        const tile = pathTiles[player.positionIndex];
        tile.appendChild(player.token);
    });
}

// Call once at start
updatePlayerPositions();
updateMoneyDisplay();
currentPlayerSpan.textContent = players[currentPlayerIndex].id;

// Move a specific player forward by "steps"
function movePlayer(player, steps) {
    const totalTiles = pathTiles.length; // should be 40
    player.positionIndex = (player.positionIndex + steps) % totalTiles;
}

// Get clean tile name text
function getTileName(tile) {
    return tile.textContent.trim();
}

// Handle what happens when a player lands on a tile
function handleLanding(player) {
    const tile = pathTiles[player.positionIndex];
    const name = getTileName(tile);

    // Skip non-property tiles
    if (!propertyDefinitions[name]) {
        return;
    }

    const defs = propertyDefinitions[name];
    const tileIndex = player.positionIndex;
    const ownerId = propertyOwners[tileIndex];

    // If unowned: offer to buy
    if (!ownerId) {
        if (player.money < defs.price) {
            alert(`Player ${player.id} does not have enough money to buy ${name}.`);
            return;
        }

        const wantToBuy = confirm(
            `Player ${player.id}: Do you want to buy ${name} for $${defs.price}?`
        );
        if (wantToBuy) {
            player.money -= defs.price;
            propertyOwners[tileIndex] = player.id;
            updateMoneyDisplay();
            updateTileOwnershipVisual(tile, player.id);
            alert(`Player ${player.id} bought ${name}!`);
        }
        return;
    }

    // If owned by this player: nothing
    if (ownerId === player.id) {
        // You own this, no rent
        return;
    }

    // Owned by someone else: pay rent
    const rent = defs.rent;
    const owner = players.find(p => p.id === ownerId);

    if (!owner) return; // safety

    player.money -= rent;
    owner.money += rent;
    updateMoneyDisplay();

    alert(
        `Player ${player.id} landed on ${name} owned by Player ${owner.id} and paid $${rent} in rent.`
    );
}

// Visual mark for ownership
function updateTileOwnershipVisual(tile, playerId) {
    // Remove previous owned classes
    tile.classList.remove(
        'owned-player1',
        'owned-player2',
        'owned-player3',
        'owned-player4'
    );
    tile.classList.add(`owned-player${playerId}`);
}

// --- BUTTON HANDLERS ---

// Roll Dice
rollButton.addEventListener('click', () => {
    const die1 = rollSingleDie();
    const die2 = rollSingleDie();
    const steps = die1 + die2;

    // Show dice result
    diceResultSpan.textContent = `${die1}, ${die2}`;

    // Get current player
    const player = players[currentPlayerIndex];

    // Move that player
    movePlayer(player, steps);
    updatePlayerPositions();

    // Handle landing effects (buy/rent)
    handleLanding(player);

    // Next player's turn
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    currentPlayerSpan.textContent = players[currentPlayerIndex].id;
});

// Reset
resetButton.addEventListener('click', () => {
    const firstConfirm = confirm('Reset the board, dice, and money?');
    if (!firstConfirm) return;

    const secondConfirm = confirm('Are you sure you want to Reset all the progress?!');
    if (!secondConfirm) return;

    // Reset dice display
    diceResultSpan.textContent = '-';

    // Reset all players to GO + money
    players.forEach(player => {
        player.positionIndex = startIndex;
        player.money = startingMoney;
    });
    updatePlayerPositions();
    updateMoneyDisplay();

    // Clear ownership
    for (const key in propertyOwners) {
        delete propertyOwners[key];
    }
    // Remove visual ownership classes
    pathTiles.forEach(tile => {
        tile.classList.remove(
            'owned-player1',
            'owned-player2',
            'owned-player3',
            'owned-player4'
        );
    });

    // Reset turn to Player 1
    currentPlayerIndex = 0;
    currentPlayerSpan.textContent = players[currentPlayerIndex].id;
});
