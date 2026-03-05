const GRID_SIZE = 30;         
let CELL = 16;              
let MARGIN = 2;             
const STEP_MS = 50;           // hitrost animacije

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const doakes = document.getElementById("doakes");
const dexter = document.getElementById("dexter");
const showBtn = document.getElementById("showSolution");
const playBtn = document.getElementById("playBtn");

let maze = [];
let pathCells = [];
let animating = false;
let stepIndex = 0;

// Igranje
let playMode = false;
let playerCell = null;
let playerTrail = [];

function applyResponsiveSizing() {
  const maxPx = 560;
  const padding = 24;

  const parent = canvas.parentElement;
  const available = Math.min(
    maxPx,
    (parent?.clientWidth || window.innerWidth) - padding
  );

  CELL = Math.max(10, Math.floor(available / GRID_SIZE));
  MARGIN = Math.max(2, Math.floor(CELL / 10));

  const logicalSize = GRID_SIZE * CELL + MARGIN * 2;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(logicalSize * dpr);
  canvas.height = Math.round(logicalSize * dpr);
  canvas.style.width = logicalSize + "px";
  canvas.style.height = logicalSize + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function cellIndex(x, y) {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return -1;
  return x + y * GRID_SIZE;
}

function cellCenter(cell) {
  return [
    MARGIN + cell.x * CELL + CELL / 2,
    MARGIN + cell.y * CELL + CELL / 2
  ];
}

function place(el, x, y) {
  const w = el.offsetWidth || 32;
  const h = el.offsetHeight || 32;
  el.style.left = (x - w / 2) + "px";
  el.style.top  = (y - h / 2) + "px";
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.walls = { top: true, right: true, bottom: true, left: true };
  }
}

function initMaze() {
  maze = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      maze.push(new Cell(x, y));
    }
  }
}

function unvisitedNeighbors(cell) {
  const out = [];
  const top = maze[cellIndex(cell.x, cell.y - 1)];
  const right = maze[cellIndex(cell.x + 1, cell.y)];
  const bottom = maze[cellIndex(cell.x, cell.y + 1)];
  const left = maze[cellIndex(cell.x - 1, cell.y)];

  if (top && !top.visited) out.push(top);
  if (right && !right.visited) out.push(right);
  if (bottom && !bottom.visited) out.push(bottom);
  if (left && !left.visited) out.push(left);

  return out;
}

function removeWalls(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  if (dx === 1) { a.walls.left = false; b.walls.right = false; }
  else if (dx === -1) { a.walls.right = false; b.walls.left = false; }

  if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
  else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
}

function generateMaze() {
  initMaze();

  const stack = [];
  let current = maze[0];
  current.visited = true;

  while (true) {
    const nexts = unvisitedNeighbors(current);

    if (nexts.length > 0) {
      const next = nexts[Math.floor(Math.random() * nexts.length)];
      stack.push(current);
      removeWalls(current, next);
      next.visited = true;
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      break;
    }
  }

  maze[0].walls.top = false;
  maze[maze.length - 1].walls.bottom = false;

  // reset visited za solver
  maze.forEach(c => c.visited = false);
}

// Risanje
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // stene
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 2;
  ctx.lineCap = "square";

  for (const cell of maze) {
    const x = MARGIN + cell.x * CELL;
    const y = MARGIN + cell.y * CELL;

    if (cell.walls.top) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke();
    }
    if (cell.walls.right) {
      ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.stroke();
    }
    if (cell.walls.bottom) {
      ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.stroke();
    }
    if (cell.walls.left) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke();
    }
  }

  // označi START in FINISH
  ctx.fillStyle = "rgba(0,255,0,0.25)";
  ctx.fillRect(MARGIN + 0 * CELL + 2, MARGIN + 0 * CELL + 2, CELL - 4, CELL - 4);

  ctx.fillStyle = "rgba(255,0,0,0.20)";
  ctx.fillRect(MARGIN + (GRID_SIZE - 1) * CELL + 2, MARGIN + (GRID_SIZE - 1) * CELL + 2, CELL - 4, CELL - 4);
}

function drawPathUntil(n) {
  if (!pathCells.length) return;

  const count = Math.min(n, pathCells.length);

  // barva poti
  ctx.strokeStyle = "rgba(255,0,0,0.92)";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const [sx, sy] = cellCenter(pathCells[0]);

  ctx.beginPath();
  ctx.moveTo(sx, sy);

  for (let i = 1; i < count; i++) {
    const [x, y] = cellCenter(pathCells[i]);
    ctx.lineTo(x, y);
  }

  ctx.stroke();
}

function drawFullPath(cells, color = "rgba(255,0,0,0.92)") {
  if (!cells || cells.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const [sx, sy] = cellCenter(cells[0]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);

  for (let i = 1; i < cells.length; i++) {
    const [x, y] = cellCenter(cells[i]);
    ctx.lineTo(x, y);
  }

  ctx.stroke();
}

function drawPlayerToken(cell){
  if(!cell) return;
  const [cx, cy] = cellCenter(cell);

  ctx.fillStyle = "rgba(0,180,255,0.95)";
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI*2);
  ctx.stroke();
}

//vedno najde najkrajšo pot
function solveMazeBFS() {
  const start = maze[0];
  const goal = maze[maze.length - 1];

  const q = [start];
  const visited = new Set([cellIndex(start.x, start.y)]);
  const parent = new Map(); // key -> prevKey

  while (q.length) {
    const cur = q.shift();
    if (cur === goal) break;

    const x = cur.x, y = cur.y;

    const moves = [
      { dx: 0, dy: -1, wall: "top" },
      { dx: 1, dy: 0, wall: "right" },
      { dx: 0, dy: 1, wall: "bottom" },
      { dx: -1, dy: 0, wall: "left" }
    ];

    for (const m of moves) {
      if (cur.walls[m.wall]) continue; // stena => ne moremo

      const nx = x + m.dx, ny = y + m.dy;
      const ni = cellIndex(nx, ny);
      if (ni === -1) continue;

      if (!visited.has(ni)) {
        visited.add(ni);
        parent.set(ni, cellIndex(x, y));
        q.push(maze[ni]);
      }
    }
  }

  const goalKey = cellIndex(goal.x, goal.y);
  const startKey = cellIndex(start.x, start.y);

  const rev = [];
  let curKey = goalKey;

  if (curKey !== startKey && !parent.has(curKey)) return [];

  while (true) {
    rev.push(maze[curKey]);
    if (curKey === startKey) break;
    curKey = parent.get(curKey);
  }

  return rev.reverse();
}

function showVictory() {

  
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "100";
  overlay.style.animation = "fadeIn 0.5s ease";

  
  const bigDexter = document.createElement("img");
  bigDexter.src = "slike/dexter.jpg";
  bigDexter.style.maxWidth = "80%";
  bigDexter.style.maxHeight = "70%";
  bigDexter.style.borderRadius = "20px";
  bigDexter.style.boxShadow = "0 0 40px rgba(255,0,0,0.7)";
  bigDexter.style.transform = "scale(0.7)";
  bigDexter.style.transition = "transform 1s ease";

  
  const message = document.createElement("div");
  message.innerText = "USPEŠNO SI REŠIL LABIRINT!";
  message.style.marginTop = "30px";
  message.style.fontSize = "42px";
  message.style.fontFamily = "'Trebuchet MS', sans-serif";
  message.style.color = "white";
  message.style.letterSpacing = "2px";
  message.style.textTransform = "uppercase";
  message.style.textShadow = "0 0 15px red";
  message.style.animation = "fadeInText 1s ease";

  overlay.appendChild(bigDexter);
  overlay.appendChild(message);
  document.body.appendChild(overlay);

  
  setTimeout(() => {
    bigDexter.style.transform = "scale(1)";
  }, 50);

  
  overlay.addEventListener("click", () => overlay.remove());
}

const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInText { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);

function startPlay() {
  if (animating) return;

  playMode = true;
  playBtn.innerText = "Ustavi igro";
  // reset igralca na START
  playerCell = maze[cellIndex(0, 0)];
  playerTrail = [playerCell];

  doakes.style.display = "none";

  
  drawMaze();
  drawFullPath(playerTrail, "rgba(255,0,0,0.85)");
  drawPlayerToken(playerCell);
}

function stopPlay() {
  playMode = false;
  playBtn.innerText = "Igraj";
  doakes.style.display = "none";
  drawMaze();
}

function tryMove(dx, dy, wallKey) {
  if (!playMode || animating) return;
  if (!playerCell) return;

  // če je stena, ne moremo
  if (playerCell.walls[wallKey]) return;

  const nx = playerCell.x + dx;
  const ny = playerCell.y + dy;
  const ni = cellIndex(nx, ny);
  if (ni < 0) return;

  playerCell = maze[ni];
  playerTrail.push(playerCell);

    
  drawMaze();
  drawPlayerToken(playerCell);

  // cilj
  if (playerCell.x === GRID_SIZE - 1 && playerCell.y === GRID_SIZE - 1) {
    playMode = false;
    playBtn.innerText = "Igraj";
    showVictory();
  }
}

// tipke: WASD ali puščice
window.addEventListener("keydown", (e) => {
  if (!playMode) return;

  const k = e.key.toLowerCase();

  if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();

  if (k === "w" || k === "arrowup")    return tryMove(0, -1, "top");
  if (k === "d" || k === "arrowright") return tryMove(1,  0, "right");
  if (k === "s" || k === "arrowdown")  return tryMove(0,  1, "bottom");
  if (k === "a" || k === "arrowleft")  return tryMove(-1, 0, "left");
});

// Animacija rešitve
function drawStep() {
  if (!animating) return;

  drawMaze();
  drawPathUntil(stepIndex + 1);

  const cell = pathCells[Math.min(stepIndex, pathCells.length - 1)];
  const [cx, cy] = cellCenter(cell);

  doakes.classList.remove("play-mode");
  doakes.style.display = "block";
  place(doakes, cx, cy);

  stepIndex++;

  if (stepIndex >= pathCells.length) {
    animating = false;
    showVictory();
    return;
  }

  setTimeout(() => requestAnimationFrame(drawStep), STEP_MS);
}

function resetAndBuild() {

  playMode = false;
  playBtn.innerText = "Igraj";

  applyResponsiveSizing();

  // pripravi nov labirint
  generateMaze();
  pathCells = solveMazeBFS();
  stepIndex = 0;
  animating = false;
  doakes.style.display = "none";
  // Dexter je na cilju
  const goal = pathCells[pathCells.length - 1];
  const [gx, gy] = cellCenter(goal);
  place(dexter, gx, gy);
  drawMaze();
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    applyResponsiveSizing();
    drawMaze();
    if (playMode) {
      drawFullPath(playerTrail, "rgba(255,0,0,0.85)");
      drawPlayerToken(playerCell);
    } else if (animating) {
      drawPathUntil(stepIndex + 1);
      const cell = pathCells[Math.min(stepIndex, pathCells.length - 1)];
      const [cx, cy] = cellCenter(cell);
      place(doakes, cx, cy);
    } else {
      if (pathCells.length) {
        const goal = pathCells[pathCells.length - 1];
        const [gx, gy] = cellCenter(goal);
        place(dexter, gx, gy);
      }
    }
  }, 120);
});

// Start
resetAndBuild();

// gumb: igraj
playBtn.addEventListener("click", () => {
  if (animating) return;
  if (!playMode) startPlay();
  else stopPlay();
});

// gumb: prikaži rešitev
showBtn.addEventListener("click", () => {
  if (playMode) stopPlay();
  if (animating) return;
  stepIndex = 0;
  animating = true;
  drawStep();
});
