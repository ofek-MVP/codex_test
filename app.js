const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const levelElement = document.getElementById("level");
const levelTargetElement = document.getElementById("level-target");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("start-button");
const historyListElement = document.getElementById("history-list");

const gridSize = 21;
const tileSize = canvas.width / gridSize;
const tickDelay = 120;
const storageKey = "simple-snake-high-score";
const historyStorageKey = "simple-snake-game-history";
const maxHistoryItems = 5;
const defaultLevelTarget = 15;
const stageThemes = [
  {
    pageGlow: "rgba(255, 255, 255, 0.72)",
    pageStart: "#f3e9d8",
    pageEnd: "#f0c89b",
    boardBackground: "#fff9f2",
    boardGrid: "#ead9c8",
    boardFrame: "rgba(143, 45, 23, 0.12)"
  },
  {
    pageGlow: "rgba(226, 255, 244, 0.78)",
    pageStart: "#dff7ea",
    pageEnd: "#9fd3b4",
    boardBackground: "#f3fff7",
    boardGrid: "#cbe6d7",
    boardFrame: "rgba(32, 108, 74, 0.18)"
  },
  {
    pageGlow: "rgba(228, 244, 255, 0.8)",
    pageStart: "#dceefe",
    pageEnd: "#8ecae6",
    boardBackground: "#f4fbff",
    boardGrid: "#c8dfef",
    boardFrame: "rgba(31, 81, 115, 0.18)"
  },
  {
    pageGlow: "rgba(255, 238, 224, 0.8)",
    pageStart: "#ffe4d0",
    pageEnd: "#f7b267",
    boardBackground: "#fff8f1",
    boardGrid: "#efd8c2",
    boardFrame: "rgba(163, 84, 26, 0.18)"
  },
  {
    pageGlow: "rgba(255, 232, 238, 0.8)",
    pageStart: "#ffe2e9",
    pageEnd: "#f497b6",
    boardBackground: "#fff7fa",
    boardGrid: "#efd5dd",
    boardFrame: "rgba(146, 52, 84, 0.18)"
  }
];

let snake;
let direction;
let queuedDirection;
let food;
let score;
let currentLevel;
let levelScore;
let gameLoop;
let isRunning = false;
let gameStartTime;

function loadHighScore() {
  const saved = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
  highScoreElement.textContent = Number.isNaN(saved) ? "0" : String(saved);
}

function createStartingSnake() {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
}

function getLevelTarget(level) {
  return level === 1 ? 10 : defaultLevelTarget;
}

function getStageTheme(level) {
  return stageThemes[(level - 1) % stageThemes.length];
}

function applyStageTheme() {
  const theme = getStageTheme(currentLevel);
  const root = document.documentElement;
  root.style.setProperty("--page-glow", theme.pageGlow);
  root.style.setProperty("--page-start", theme.pageStart);
  root.style.setProperty("--page-end", theme.pageEnd);
  root.style.setProperty("--board-frame", theme.boardFrame);
}

function updateGameUi() {
  scoreElement.textContent = String(score);
  levelElement.textContent = String(currentLevel);
  levelTargetElement.textContent = `${levelScore} / ${getLevelTarget(currentLevel)}`;
}

function resetBoard() {
  snake = createStartingSnake();
  direction = { x: 1, y: 0 };
  queuedDirection = { ...direction };
  food = spawnFood();
}

function resetGame() {
  score = 0;
  currentLevel = 1;
  levelScore = 0;
  isRunning = true;
  gameStartTime = Date.now();
  resetBoard();
  applyStageTheme();
  updateGameUi();
  statusElement.textContent = `שלב ${currentLevel}: צריך ${getLevelTarget(currentLevel)} נקודות כדי לעבור שלב`;
  clearInterval(gameLoop);
  gameLoop = setInterval(update, tickDelay);
  draw();
}

function loadHistory() {
  const saved = localStorage.getItem(historyStorageKey);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(historyStorageKey, JSON.stringify(history));
}

function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} שניות`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} דק' ו-${remainingSeconds} שנ'`;
}

function formatGameDate(timestamp) {
  return new Date(timestamp).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderHistory() {
  const history = loadHistory();
  historyListElement.textContent = "";

  if (history.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-empty";
    emptyItem.textContent = "עדיין אין משחקים שנשמרו.";
    historyListElement.append(emptyItem);
    return;
  }

  history.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className = "history-item";
    listItem.innerHTML = `
      <span class="history-index">#${history.length - index}</span>
      <div class="history-meta">
        <strong>${item.score} נק' - שלב ${item.levelReached ?? 1}</strong>
        <small>${formatDuration(item.durationInSeconds)} · ${formatGameDate(item.finishedAt)}</small>
      </div>
    `;
    historyListElement.append(listItem);
  });
}

function pushGameToHistory() {
  const durationInSeconds = Math.max(1, Math.floor((Date.now() - gameStartTime) / 1000));
  const nextEntry = {
    score,
    levelReached: currentLevel,
    durationInSeconds,
    finishedAt: Date.now()
  };

  const nextHistory = [nextEntry, ...loadHistory()].slice(0, maxHistoryItems);
  saveHistory(nextHistory);
  renderHistory();
}

function spawnFood() {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };

    const hitsSnake = snake?.some((segment) => segment.x === candidate.x && segment.y === candidate.y);
    if (!hitsSnake) {
      return candidate;
    }
  }
}

function setDirection(nextX, nextY) {
  if (!isRunning) {
    return;
  }

  const reversing = nextX === -direction.x && nextY === -direction.y;
  if (!reversing) {
    queuedDirection = { x: nextX, y: nextY };
  }
}

function advanceLevel() {
  currentLevel += 1;
  levelScore = 0;
  resetBoard();
  applyStageTheme();
  updateGameUi();
  statusElement.textContent = `עברת לשלב ${currentLevel}. היעד עכשיו הוא ${getLevelTarget(currentLevel)} נקודות`;
  draw();
}

function update() {
  direction = queuedDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };
  const ateFood = head.x === food.x && head.y === food.y;
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);
  const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
  const hitSelf = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (ateFood) {
    score += 1;
    levelScore += 1;
    updateHighScore();

    if (levelScore >= getLevelTarget(currentLevel)) {
      updateGameUi();
      advanceLevel();
      return;
    }

    food = spawnFood();
    updateGameUi();
  } else {
    snake.pop();
  }

  draw();
}

function updateHighScore() {
  const currentHigh = Number.parseInt(highScoreElement.textContent || "0", 10);
  if (score > currentHigh) {
    highScoreElement.textContent = String(score);
    localStorage.setItem(storageKey, String(score));
  }
}

function endGame() {
  isRunning = false;
  clearInterval(gameLoop);
  pushGameToHistory();
  statusElement.textContent = `נפסלת. בלחיצה על התחל תחזור לשלב 1 מההתחלה`;
  draw(true);
}

function drawBoard() {
  const theme = getStageTheme(currentLevel);
  ctx.fillStyle = theme.boardBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = theme.boardGrid;
  ctx.lineWidth = 1;

  for (let index = 1; index < gridSize; index += 1) {
    const offset = index * tileSize;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }
}

function draw(showGameOver = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();

  drawTile(food.x, food.y, "#ef476f", 0.26);

  snake.forEach((segment, index) => {
    drawTile(segment.x, segment.y, index === 0 ? "#1b4332" : "#2d6a4f", 0.22);
  });

  if (showGameOver) {
    ctx.fillStyle = "rgba(31, 29, 26, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "700 34px Segoe UI";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "600 18px Segoe UI";
    ctx.fillText(`חזרה לשלב 1 בלחיצה על התחלה`, canvas.width / 2, canvas.height / 2 + 28);
  }
}

function drawTile(x, y, color, insetRatio) {
  const inset = tileSize * insetRatio;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x * tileSize + inset,
    y * tileSize + inset,
    tileSize - inset * 2,
    tileSize - inset * 2,
    8
  );
  ctx.fill();
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") setDirection(0, -1);
  if (key === "arrowdown" || key === "s") setDirection(0, 1);
  if (key === "arrowleft" || key === "a") setDirection(-1, 0);
  if (key === "arrowright" || key === "d") setDirection(1, 0);
});

startButton.addEventListener("click", resetGame);

score = 0;
currentLevel = 1;
levelScore = 0;
snake = createStartingSnake();
direction = { x: 1, y: 0 };
queuedDirection = { ...direction };
food = spawnFood();

loadHighScore();
renderHistory();
applyStageTheme();
updateGameUi();
draw();
