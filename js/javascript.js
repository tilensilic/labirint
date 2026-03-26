const GRID_SIZE = 30;
let CELL = 16;
let MARGIN = 2;
const STEP_MS = 50;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const astronavt = document.getElementById("astronavt");
const raketa = document.getElementById("raketa");
const showBtn = document.getElementById("showSolution");
const playBtn = document.getElementById("playBtn");
const difficultySelect = document.getElementById("difficulty");
const timerEl = document.getElementById("timer");

// Modal logika
const modal = document.getElementById("instructionsModal");
const instrBtn = document.getElementById("instructionsBtn");
const closeBtn = document.querySelector(".close");

instrBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if(e.target == modal) modal.style.display = "none"; }

let timeLeftMs = 180000;
let timerId = null;
let timerEndAt = 0;
let maze = [];
let pathCells = [];
let animating = false;
let stepIndex = 0;
let playMode = false;
let playerCell = null;
let playerTrail = [];

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

function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

function startTimer() {
    stopTimer();
    timeLeftMs = difficultyToMs();
    timerEndAt = Date.now() + timeLeftMs;
    timerId = setInterval(() => {
        timeLeftMs = timerEndAt - Date.now();
        if (timeLeftMs <= 0) { timeLeftMs = 0; stopTimer(); timeUp(); }
        timerEl.textContent = formatTime(timeLeftMs);
    }, 100);
}

function timeUp() {
    playMode = false;
    alert("Čas je potekel!");
    resetAndBuild();
}

function applyResponsiveSizing() {
    const available = Math.min(560, window.innerWidth - 48);
    CELL = Math.floor(available / GRID_SIZE);
    const logicalSize = GRID_SIZE * CELL + MARGIN * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    canvas.style.width = logicalSize + "px";
    canvas.style.height = logicalSize + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

class Cell {
    constructor(x, y) {
        this.x = x; this.y = y; this.visited = false;
        this.walls = { top: true, right: true, bottom: true, left: true };
    }
}

function generateMaze() {
    maze = [];
    for (let y = 0; y < GRID_SIZE; y++) 
        for (let x = 0; x < GRID_SIZE; x++) maze.push(new Cell(x, y));

    const stack = [];
    let current = maze[0];
    current.visited = true;

    while (true) {
        let neighbors = [];
        const {x, y} = current;
        if (y > 0 && !maze[x + (y-1)*GRID_SIZE].visited) neighbors.push(maze[x + (y-1)*GRID_SIZE]);
        if (x < GRID_SIZE-1 && !maze[(x+1) + y*GRID_SIZE].visited) neighbors.push(maze[(x+1) + y*GRID_SIZE]);
        if (y < GRID_SIZE-1 && !maze[x + (y+1)*GRID_SIZE].visited) neighbors.push(maze[x + (y+1)*GRID_SIZE]);
        if (x > 0 && !maze[(x-1) + y*GRID_SIZE].visited) neighbors.push(maze[(x-1) + y*GRID_SIZE]);

        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random()*neighbors.length)];
            stack.push(current);
            if (current.x < next.x) { current.walls.right = false; next.walls.left = false; }
            else if (current.x > next.x) { current.walls.left = false; next.walls.right = false; }
            else if (current.y < next.y) { current.walls.bottom = false; next.walls.top = false; }
            else if (current.y > next.y) { current.walls.top = false; next.walls.bottom = false; }
            next.visited = true; current = next;
        } else if (stack.length > 0) current = stack.pop();
        else break;
    }
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white"; ctx.lineWidth = 2;
    maze.forEach(c => {
        const x = MARGIN + c.x * CELL, y = MARGIN + c.y * CELL;
        ctx.beginPath();
        if (c.walls.top) { ctx.moveTo(x,y); ctx.lineTo(x+CELL,y); }
        if (c.walls.right) { ctx.moveTo(x+CELL,y); ctx.lineTo(x+CELL,y+CELL); }
        if (c.walls.bottom) { ctx.moveTo(x,y+CELL); ctx.lineTo(x+CELL,y+CELL); }
        if (c.walls.left) { ctx.moveTo(x,y); ctx.lineTo(x,y+CELL); }
        ctx.stroke();
    });
}

function place(el, x, y) {
    const cx = MARGIN + x * CELL + CELL/2;
    const cy = MARGIN + y * CELL + CELL/2;
    el.style.left = (cx - el.offsetWidth/2) + "px";
    el.style.top = (cy - el.offsetHeight/2) + "px";
}

function resetAndBuild() {
    applyResponsiveSizing();
    generateMaze();
    drawMaze();
    place(astronavt, 0, 0);
    place(raketa, GRID_SIZE-1, GRID_SIZE-1);
    playMode = false; playBtn.innerText = "Igraj";
}

playBtn.onclick = () => {
    if (playMode) { resetAndBuild(); stopTimer(); }
    else { playMode = true; playBtn.innerText = "Ponastavi"; startTimer(); playerCell = maze[0]; }
};

window.onkeydown = (e) => {
    if (!playMode) return;
    const key = e.key;
    let dx = 0, dy = 0, wall = "";
    if (key === "ArrowUp" || key === "w") { dy = -1; wall = "top"; }
    else if (key === "ArrowDown" || key === "s") { dy = 1; wall = "bottom"; }
    else if (key === "ArrowLeft" || key === "a") { dx = -1; wall = "left"; }
    else if (key === "ArrowRight" || key === "d") { dx = 1; wall = "right"; }
    
    if (wall && !playerCell.walls[wall]) {
        playerCell = maze[(playerCell.x + dx) + (playerCell.y + dy) * GRID_SIZE];
        place(astronavt, playerCell.x, playerCell.y);
        if (playerCell.x === GRID_SIZE-1 && playerCell.y === GRID_SIZE-1) {
            alert("Zmaga!"); stopTimer(); resetAndBuild();
        }
    }
};

window.onload = resetAndBuild;
