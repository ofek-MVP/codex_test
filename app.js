const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("start-button");

const gridSize = 21;
const tileSize = canvas.width / gridSize;
const tickDelay = 120;
const storageKey = "simple-snake-high-score";

let snake;
let direction;
let queuedDirection;
let food;
let score;
let gameLoop;
let isRunning = false;

function loadHighScore() {
  const saved = Number.parseInt(localStorage.getItem(storageKey) || "0", 10);
  highScoreElement.textContent = Number.isNaN(saved) ? "0" : String(saved);
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { ...direction };
  score = 0;
  food = spawnFood();
  isRunning = true;
  scoreElement.textContent = "0";
  statusElement.textContent = "בהצלחה";
  clearInterval(gameLoop);
  gameLoop = setInterval(update, tickDelay);
  draw();
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

function update() {
  direction = queuedDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
  const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreElement.textContent = String(score);
    food = spawnFood();
    updateHighScore();
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
  statusElement.textContent = "נפסלת. לחץ על התחל מחדש";
  draw(true);
}

function draw(showGameOver = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff9f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ef476f";
  drawTile(food.x, food.y, "#ef476f", 0.26);

  snake.forEach((segment, index) => {
    drawTile(segment.x, segment.y, index === 0 ? "#1b4332" : "#2d6a4f", 0.22);
  });

  if (showGameOver) {
    ctx.fillStyle = "rgba(31, 29, 26, 0.35)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
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

loadHighScore();
draw();
