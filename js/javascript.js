const GRID_SIZE = 30;
let CELL = 16;
let MARGIN = 2;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const astronavt = document.getElementById("astronavt");
const raketa = document.getElementById("raketa");
const showBtn = document.getElementById("showSolution");
const playBtn = document.getElementById("playBtn");
const difficultySelect = document.getElementById("difficulty");
const timerEl = document.getElementById("timer");

// MODAL
const modal = document.getElementById("instructionsModal");
const instrBtn = document.getElementById("instructionsBtn");
const closeBtn = document.querySelector(".close");
const closeBtnBottom = document.getElementById("closeModalBtn");

instrBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
closeBtnBottom.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if(e.target == modal) modal.style.display = "none"; }

// TIMER
let timeLeftMs = 180000;
let timerId = null;
let timerEndAt = 0;

// GAME
let maze = [];
let pathCells = [];
let playMode = false;
let playerCell = null;

// ================= TIMER =================
function difficultyToMs() {
    const d = Number(difficultySelect.value);
    return d === 1 ? 180000 : d === 2 ? 120000 : 60000;
}

function formatTime(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function startTimer() {
    stopTimer();
    timeLeftMs = difficultyToMs();
    timerEndAt = Date.now() + timeLeftMs;

    timerId = setInterval(() => {
        timeLeftMs = timerEndAt - Date.now();

        if (timeLeftMs <= 0) {
            timeLeftMs = 0;
            stopTimer();
            alert("Zmanjkalo časa!");
            resetAndBuild();
        }

        timerEl.textContent = formatTime(timeLeftMs);
    }, 100);
}

// ================= CANVAS FIX =================
function applyResponsiveSizing() {
    const size = Math.min(window.innerWidth - 40, 520);
    CELL = Math.floor(size / GRID_SIZE);

    const realSize = GRID_SIZE * CELL + MARGIN * 2;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = realSize * dpr;
    canvas.height = realSize * dpr;

    canvas.style.width = realSize + "px";
    canvas.style.height = realSize + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ================= MAZE =================
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.visited = false;
        this.walls = { top: true, right: true, bottom: true, left: true };
    }
}

function generateMaze() {
    maze = [];

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            maze.push(new Cell(x, y));
        }
    }

    let stack = [];
    let current = maze[0];
    current.visited = true;

    while (true) {
        let neighbors = [];
        const {x, y} = current;

        if (y > 0 && !maze[x + (y-1)*GRID_SIZE].visited)
            neighbors.push(maze[x + (y-1)*GRID_SIZE]);

        if (x < GRID_SIZE-1 && !maze[(x+1) + y*GRID_SIZE].visited)
            neighbors.push(maze[(x+1) + y*GRID_SIZE]);

        if (y < GRID_SIZE-1 && !maze[x + (y+1)*GRID_SIZE].visited)
            neighbors.push(maze[x + (y+1)*GRID_SIZE]);

        if (x > 0 && !maze[(x-1) + y*GRID_SIZE].visited)
            neighbors.push(maze[(x-1) + y*GRID_SIZE]);

        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            stack.push(current);

            if (current.x < next.x) { current.walls.right = false; next.walls.left = false; }
            else if (current.x > next.x) { current.walls.left = false; next.walls.right = false; }
            else if (current.y < next.y) { current.walls.bottom = false; next.walls.top = false; }
            else if (current.y > next.y) { current.walls.top = false; next.walls.bottom = false; }

            next.visited = true;
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            break;
        }
    }
}

// ================= DRAW =================
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    maze.forEach(c => {
        const x = MARGIN + c.x * CELL;
        const y = MARGIN + c.y * CELL;

        ctx.beginPath();

        if (c.walls.top) ctx.moveTo(x, y), ctx.lineTo(x + CELL, y);
        if (c.walls.right) ctx.moveTo(x + CELL, y), ctx.lineTo(x + CELL, y + CELL);
        if (c.walls.bottom) ctx.moveTo(x, y + CELL), ctx.lineTo(x + CELL, y + CELL);
        if (c.walls.left) ctx.moveTo(x, y), ctx.lineTo(x, y + CELL);

        ctx.stroke();
    });
}

// ================= POSITION FIX =================
function place(el, x, y) {
    const cx = MARGIN + x * CELL + CELL / 2;
    const cy = MARGIN + y * CELL + CELL / 2;

    el.style.left = cx + "px";
    el.style.top = cy + "px";
}

// ================= SOLUTION WITH ANIMATION =================
function animateSolution(path) {
    let idx = 0;

    const interval = setInterval(() => {
        if (idx < path.length) {
            place(astronavt, path[idx].x, path[idx].y);
            idx++;
        } else {
            clearInterval(interval);
            playMode = false;
            stopTimer();
        }
    }, 200);
}

function findSolution() {
    let visited = new Set();
    let path = [];

    function dfs(cell) {
        if (!cell) return false;

        let key = cell.x + "," + cell.y;
        if (visited.has(key)) return false;

        visited.add(key);
        path.push(cell);

        if (cell.x === GRID_SIZE - 1 && cell.y === GRID_SIZE - 1) return true;

        const {x, y} = cell;

        const moves = [
            ["top", x, y-1],
            ["right", x+1, y],
            ["bottom", x, y+1],
            ["left", x-1, y]
        ];

        for (let [dir, nx, ny] of moves) {
            if (!cell.walls[dir]) {
                let next = maze[nx + ny * GRID_SIZE];
                if (dfs(next)) return true;
            }
        }

        path.pop();
        return false;
    }

    dfs(maze[0]);
    return path;
}

showBtn.onclick = () => {
    const solution = findSolution();
    animateSolution(solution);
};

// ================= RESET =================
function resetAndBuild() {
    applyResponsiveSizing();
    generateMaze();
    drawMaze();

    place(astronavt, 0, 0);  // Adjust initial position to the center of the starting cell
    place(raketa, GRID_SIZE - 1, GRID_SIZE - 1);  // Center the rocket at the exit

    playMode = false;
    playBtn.innerText = "Igraj";
    timerEl.textContent = formatTime(difficultyToMs());
}

// ================= CONTROLS =================
playBtn.onclick = () => {
    if (playMode) {
        resetAndBuild();
        stopTimer();
    } else {
        playMode = true;
        playBtn.innerText = "Reset";
        startTimer();
        playerCell = maze[0];
    }
};

window.addEventListener("keydown", (e) => {
    if (!playMode) return;

    let dx = 0, dy = 0, wall = "";

    if (e.key === "ArrowUp" || e.key === "w") { dy = -1; wall = "top"; }
    if (e.key === "ArrowDown" || e.key === "s") { dy = 1; wall = "bottom"; }
    if (e.key === "ArrowLeft" || e.key === "a") { dx = -1; wall = "left"; }
    if (e.key === "ArrowRight" || e.key === "d") { dx = 1; wall = "right"; }

    if (wall && !playerCell.walls[wall]) {
        const nx = playerCell.x + dx;
        const ny = playerCell.y + dy;

        playerCell = maze[nx + ny * GRID_SIZE];
        place(astronavt, playerCell.x, playerCell.y);

        if (nx === GRID_SIZE - 1 && ny === GRID_SIZE - 1) {
            setTimeout(() => {
                alert("Zmagal si!");
                resetAndBuild();
                stopTimer();
            }, 200);
        }
    }
});

window.addEventListener("resize", () => {
    resetAndBuild();
});

// START
resetAndBuild();
