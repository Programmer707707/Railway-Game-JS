const menu = document.querySelector('#menu');
const rules = document.querySelector('#rules');
const game = document.querySelector('#game');
const usernameInput = document.querySelector('#username');
const startGameBtn = document.querySelector('#startGameBtn');
const easyBtn = document.querySelector('#easyBtn');
const hardBtn = document.querySelector('#hardBtn');
const rulesBtn = document.querySelector('#rulesBtn');
const backToMenuBtn = document.querySelector('#backToMenuBtn');
const backToMenuGameBtn = document.querySelector('#backToMenuGameBtn');
const saveGameBtn = document.querySelector('#saveGameBtn');
const deleteGameBtn = document.querySelector('#deleteGameBtn');
const playerNameDisplay = document.querySelector('#playerName');
const timerDisplay = document.querySelector('#timer');
const statusMessage = document.querySelector('#statusMessage');
const checkSolutionBtn = document.querySelector('#validateGameBtn');
// Modal
const gameModal = document.querySelector('#gameModal');
const completionMessage = document.querySelector('#completionMessage');
const goBackBtn = document.querySelector('#goBackBtn');
// Leader board 
const leaderBoardBtn = document.querySelector('#showLeaderboardBtn')
const closeLeaderboardBtn = document.querySelector('#closeLeaderboardBtn')

let easyMaps = [];
let hardMaps = [];
let gameLevel = null;
let timerInterval;
let timeLeft = 1200; 
let currentMapState = [];
let playerName = "";
let solutions = [];
let currentDisplayedMap = [];
let currentMapIndex = null;

async function loadData() {
    const mapsResponse = await fetch('maps.json');
    const mapsData = await mapsResponse.json();
    easyMaps = mapsData.easyMaps;
    hardMaps = mapsData.hardMaps;

    const solutionsResponse = await fetch('solutions.json');
    const solutionsData = await solutionsResponse.json();
    solutions.easy = solutionsData.easySolutions;
    solutions.hard = solutionsData.hardSolutions;
    console.log("Data loaded:", { easyMaps, hardMaps, solutions });
}
loadData();

function getSolutions() {
    return gameLevel === 'easy' ? solutions.easy : solutions.hard;
}
    


function startTimer() {
    clearInterval(timerInterval); 
    timerInterval = setInterval(() => {
        const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const seconds = String(timeLeft % 60).padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
        if (timeLeft <= 0) clearInterval(timerInterval);
        timeLeft--;
    }, 1000);
}

function showMessage(message, color) {
    statusMessage.textContent = message;
    statusMessage.style.color = color;
    statusMessage.classList.add('fade-in-message');

    setTimeout(() => {
        statusMessage.classList.remove('fade-in-message');
        statusMessage.textContent = '';
    }, 3000);
}

function saveGame() {
    const gameState = {
        tiles: Array.from(document.querySelectorAll('.tile')).map(tile => tile.className),
        timer: timeLeft,
        playerName: usernameInput.value,
        gameLevel: gameLevel
    };
    localStorage.setItem('savedGame', JSON.stringify(gameState));
    showMessage("Game saved!", "#2BA84A");
    setTimeout(() => statusMessage.textContent = '', 3000);
}

function loadGame() {
    const savedGame = JSON.parse(localStorage.getItem('savedGame'));
    if (savedGame && savedGame.gameLevel === gameLevel) {
        timeLeft = savedGame.timer;
        playerNameDisplay.textContent = `Player: ${savedGame.playerName}`;
        const container = document.querySelector('.container');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${gameLevel === 'easy' ? 5 : 7}, 100px)`;
        savedGame.tiles.forEach(tileClass => {
            const tileDiv = document.createElement('div');
            tileDiv.className = tileClass;
            container.appendChild(tileDiv);
        });
        startTimer();
    } else {
        resetGame();
    }
}

function deleteSavedGame() {
    localStorage.removeItem('savedGame');
    showMessage("Saved game deleted!", "#F76C6C");
    resetGame();
    setTimeout(() => statusMessage.textContent = '', 3000);
}

function resetGame() {
    clearInterval(timerInterval);
    timeLeft = 1200;
    timerDisplay.textContent = "20:00";
    playerNameDisplay.textContent = `Player: ${usernameInput.value}`;
}

usernameInput.addEventListener('input', () => {
    startGameBtn.disabled = !(usernameInput.value && gameLevel);
});

easyBtn.addEventListener('click', () => {
    gameLevel = 'easy';
    easyBtn.classList.add('active');
    hardBtn.classList.remove('active');
    startGameBtn.disabled = !usernameInput.value;
});

hardBtn.addEventListener('click', () => {
    gameLevel = 'hard';
    hardBtn.classList.add('active');
    easyBtn.classList.remove('active');
    startGameBtn.disabled = !usernameInput.value;
});

rulesBtn.addEventListener('click', () => {
    menu.classList.add('hidden');
    rules.classList.remove('hidden');
});

backToMenuBtn.addEventListener('click', () => {
    rules.classList.add('hidden');
    menu.classList.remove('hidden');
});

startGameBtn.addEventListener('click', () => {
    menu.classList.add('hidden');
    game.classList.remove('hidden');
    playerNameDisplay.textContent = `Player: ${usernameInput.value}`;
    if (localStorage.getItem('savedGame')) {
        loadGame();
    } else {
        resetGame();
        startTimer();
        mapGenerator(gameLevel === 'easy' ? 5 : 7);
    }
});

backToMenuGameBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    game.classList.add('hidden');
    menu.classList.remove('hidden');
});

saveGameBtn.addEventListener('click', saveGame);
deleteGameBtn.addEventListener('click', deleteSavedGame);

const emptyTileSequence = [
    'tile_with',
    'rotated_tile_with',
    'curve_tile',
    'curve_tile_90',
    'curve_tile_180',
    'curve_tile_270',
    'empty'
];



const mapGenerator = (size) => {
    const container = document.querySelector('#gameContainer');
    container.innerHTML = '';
    container.setAttribute('data-size', size);

    const maps = size === 5 ? easyMaps : hardMaps;
    const randomIndex = Math.floor(Math.random() * maps.length);
    const map = maps[randomIndex];
    currentDisplayedMap = map; 
    currentMapIndex = findMapIndex(currentDisplayedMap); 
    console.log("Current Map Index:", currentMapIndex);

    
    container.style.gridTemplateColumns = `repeat(${size}, 100px)`;
    container.style.gridTemplateRows = `repeat(${size}, 100px)`;

    map.forEach(row => {
        row.forEach(tile => {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('tile', tile);
            container.appendChild(tileDiv);

            tileDiv.addEventListener('click', () => {
                if (tileDiv.classList.contains('empty')) {
                    cycleEmptyTile(tileDiv);
                }
                else if(tileDiv.classList.contains('tile_with') || tileDiv.classList.contains('rotated_tile_with') || tileDiv.classList.contains('bridge_with_tile') 
                    || tileDiv.classList.contains('horizontal_bridge_with_tile2') || tileDiv.classList.contains('mountain_with_tile2') || tileDiv.classList.contains('mountain_90_with_tile2') 
                    || tileDiv.classList.contains('mountain_180_with_tile2') || tileDiv.classList.contains('mountain_270_with_tile2') || tileDiv.classList.contains('curve_tile') 
                    || tileDiv.classList.contains('curve_tile_90') || tileDiv.classList.contains('curve_tile_180') || tileDiv.classList.contains('curve_tile_270') ) {
                        handleSpecialOtherTypes(tileDiv)

                }
                
                else {
                    handleOtherTypes(tileDiv);
                }
            });
        });
    });
};




function cycleEmptyTile(tile) {
    let currentIndex = emptyTileSequence.findIndex(option => tile.classList.contains(option));
    const nextIndex = (currentIndex + 1) % emptyTileSequence.length;

    tile.className = 'tile';
    tile.classList.add(emptyTileSequence[nextIndex]);
}



function handleOtherTypes(tile){
        if (tile.classList.contains('vertical_bridge')) {
            toggleTileOptions(tile, ['vertical_bridge_with_tile']);
        } else if (tile.classList.contains('horizontal_bridge')) {
            toggleTileOptions(tile, ['horizontal_bridge_with_tile']);
        } else if (tile.classList.contains('mountain')) {
            toggleTileOptions(tile, ['mountain_with_tile']);
        } else if (tile.classList.contains('mountain_90')) {
            toggleTileOptions(tile, ['mountain_90_with_tile']);
        } else if (tile.classList.contains('mountain_180')) {
            toggleTileOptions(tile, ['mountain_180_with_tile']);
        } else if (tile.classList.contains('mountain_270')) {
            toggleTileOptions(tile, ['mountain_270_with_tile']);
        }

}

function handleSpecialOtherTypes(tile){

    if (tile.classList.contains('tile_with')) {
        toggleTileOptions(tile, ['rotated_tile_with']);
    } else if (tile.classList.contains('rotated_tile_with')) {
        toggleTileOptions(tile, ['curve_tile']);
    } else if (tile.classList.contains('curve_tile')) {
        toggleTileOptions(tile, ['curve_tile_90']);
    } else if (tile.classList.contains('curve_tile_90')) {
        toggleTileOptions(tile, ['curve_tile_180']);
    } else if (tile.classList.contains('curve_tile_180')) {
        toggleTileOptions(tile, ['curve_tile_270']);
    } else if (tile.classList.contains('curve_tile_270')) {
        toggleTileOptions(tile, ['empty']);
    }
}

function toggleTileOptions(tile, options) {
    const currentIndex = options.findIndex(option => tile.classList.contains(option));
    const nextIndex = (currentIndex + 1) % options.length;
    tile.className = 'tile';
    tile.classList.add(options[nextIndex]);
}
/* */



function findMapIndex(displayedMap) {
    const maps = gameLevel === 'easy' ? easyMaps : hardMaps;
    for (let index = 0; index < maps.length; index++) {
        if (isMapEqual(displayedMap, maps[index])) return index;
    }
    return null;
}

function isMapEqual(map1, map2) {
    if (map1.length !== map2.length) return false;
    for (let i = 0; i < map1.length; i++) {
        for (let j = 0; j < map1[i].length; j++) {
            if (map1[i][j] !== map2[i][j]) return false;
        }
    }
    return true;
}



function isSolvedChecker() {
    if (currentMapIndex === null) {
        console.error("Map index not set. Cannot validate.");
        return false;
    }

    const container = document.querySelector('.container');
    const tiles = Array.from(container.querySelectorAll('.tile'));
    const size = container.getAttribute('data-size') === '5' ? 5 : 7;

    const correctSolution = getSolutions()[currentMapIndex];
    if (!correctSolution) {
        console.error("No solution available for the current map.");
        return false;
    }

    let playerSolution = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const tileClass = tiles[i * size + j].classList[1];
            row.push(tileClass);
        }
        playerSolution.push(row);
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (playerSolution[i][j] !== correctSolution[i][j]) {
                return false;
            }
        }
    }
    return true;
}



function showModal(playerName, timeTaken) {
    const completionMessage = document.querySelector('#completionMessage');
    const timeTakenMessage = document.querySelector('#timeTakenMessage');

    completionMessage.textContent = `Player: ${playerName}`;
    timeTakenMessage.textContent = `Time Taken: ${timeTaken}`;

    gameModal.classList.remove('hidden');
    gameModal.classList.add('show');
}


function hideModal() {
    gameModal.classList.add('hidden');
    gameModal.classList.remove('show');
}


const leaderboardKey = 'leaderboardData';
let leaderboard = [];

function loadLeaderboard() {
    const storedData = localStorage.getItem(leaderboardKey);
    leaderboard = storedData ? JSON.parse(storedData) : [];
}
loadLeaderboard();


function saveLeaderboard() {
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

function addLeaderboardEntry(playerName, timeTaken, level) {
    const newEntry = {
        player: playerName,
        time: timeTaken,
        level: level
    };
    leaderboard.push(newEntry);

    leaderboard.sort((a, b) => {
        const [aMinutes, aSeconds] = a.time.split(':').map(Number);
        const [bMinutes, bSeconds] = b.time.split(':').map(Number);
        return aMinutes * 60 + aSeconds - (bMinutes * 60 + bSeconds);
    });

    leaderboard = leaderboard.slice(0, 5);
    saveLeaderboard();
}

function displayLeaderboard() {
    const leaderboardContent = document.getElementById('leaderboardContent');
    leaderboardContent.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardContent.innerHTML = '<p>No records yet.</p>';
    } else {
        leaderboard.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.innerHTML = `<span>${index + 1}. ${entry.player}</span> <span>${entry.time}</span> <span>${entry.level}</span>`;
            leaderboardContent.appendChild(entryDiv);
        });
    }

    showLeaderboardModal();
}

function showLeaderboardModal() {
    const leaderboardModal = document.getElementById('leaderboardModal');
    leaderboardModal.classList.add('show');
}


leaderBoardBtn.addEventListener('click', displayLeaderboard);

closeLeaderboardBtn.addEventListener('click', () => {
    const leaderboardModal = document.getElementById('leaderboardModal');
    leaderboardModal.classList.remove('show');
});




checkSolutionBtn.addEventListener('click', () => {
    if (getSolutions().length === 0) {
        showMessage("Solutions are still loading. Please try again.", "#FF4B4B");
        return;
    }

    const solved = isSolvedChecker();
    if (solved) {
        clearInterval(timerInterval);
        const minutesTaken = String(Math.floor((1200 - timeLeft) / 60)).padStart(2, '0');
        const secondsTaken = String((1200 - timeLeft) % 60).padStart(2, '0');
        const timeTaken = `${minutesTaken}:${secondsTaken}`;

        addLeaderboardEntry(usernameInput.value, timeTaken, gameLevel);
        showModal(usernameInput.value, timeTaken);
    } else {
        showMessage("❌ Not Solved Yet. Keep trying!", "#FF4B4B");
    }
});

goBackBtn.addEventListener('click', () => {
    hideModal();
    clearInterval(timerInterval);
    document.querySelector('#game').classList.add('hidden');
    document.querySelector('#menu').classList.remove('hidden');
    resetGame();
});