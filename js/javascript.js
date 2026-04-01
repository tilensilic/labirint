const GRID_SIZE = 30;
let CELL = 0;
const MARGIN = 2;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const astronavt = document.getElementById("astronavt");
const raketa = document.getElementById("raketa");
const playBtn = document.getElementById("playBtn");
const showBtn = document.getElementById("showSolution");
const timerEl = document.getElementById("timer");
const difficultySelect = document.getElementById("difficulty");

let maze = [];
let playerCell = { x: 0, y: 0 };
let playMode = false;
let timerId = null;

function applyResponsiveSizing() {
    const containerWidth = document.getElementById("container").clientWidth;
    CELL = (containerWidth - (MARGIN * 2)) / GRID_SIZE;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerWidth * dpr;
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
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) maze.push(new Cell(x, y));
    }
    let stack = [];
    let current = maze[0];
    current.visited = true;
    while (true) {
        let neighbors = [];
        let { x, y } = current;
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
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    maze.forEach(c => {
        let x = MARGIN + c.x * CELL;
        let y = MARGIN + c.y * CELL;
        ctx.beginPath();
        if (c.walls.top) { ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); }
        if (c.walls.right) { ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); }
        if (c.walls.bottom) { ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); }
        if (c.walls.left) { ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); }
        ctx.stroke();
    });
}

function placeIcons() {
    const getPos = (cx, cy) => ({
        l: MARGIN + cx * CELL + CELL / 2,
        t: MARGIN + cy * CELL + CELL / 2
    });
    let p = getPos(playerCell.x, playerCell.y);
    astronavt.style.left = p.l + "px";
    astronavt.style.top = p.t + "px";

    let r = getPos(GRID_SIZE - 1, GRID_SIZE - 1);
    raketa.style.left = r.l + "px";
    raketa.style.top = r.t + "px";
}

function findPath() {
    let visited = new Set();
    let queue = [[maze[playerPosToIndex(playerCell.x, playerCell.y)]]];
    while (queue.length > 0) {
        let path = queue.shift();
        let curr = path[path.length - 1];
        if (curr.x === GRID_SIZE - 1 && curr.y === GRID_SIZE - 1) return path;
        let key = `${curr.x},${curr.y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        let moves = [
            { d: "top", dx: 0, dy: -1 }, { d: "right", dx: 1, dy: 0 },
            { d: "bottom", dx: 0, dy: 1 }, { d: "left", dx: -1, dy: 0 }
        ];
        for (let m of moves) {
            if (!curr.walls[m.d]) {
                let next = maze[playerPosToIndex(curr.x + m.dx, curr.y + m.dy)];
                queue.push([...path, next]);
            }
        }
    }
}

function playerPosToIndex(x, y) { return x + y * GRID_SIZE; }

showBtn.onclick = () => {
    if (!playMode) return;
    let path = findPath();
    let i = 0;
    playMode = false;
    clearInterval(timerId);

    let interval = setInterval(() => {
        if (i >= path.length) { clearInterval(interval); return; }
        let c = path[i];
        
        // Risanje rdeče poti na Canvas
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 3;
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(MARGIN + path[i-1].x * CELL + CELL/2, MARGIN + path[i-1].y * CELL + CELL/2);
            ctx.lineTo(MARGIN + c.x * CELL + CELL/2, MARGIN + c.y * CELL + CELL/2);
            ctx.stroke();
        }
        
        playerCell = { x: c.x, y: c.y };
        placeIcons();
        i++;
    }, 60);
};

function startTimer() {
    let totalSec = difficultySelect.value == "1" ? 180 : difficultySelect.value == "2" ? 120 : 60;
    clearInterval(timerId);
    timerId = setInterval(() => {
        totalSec--;
        let m = Math.floor(totalSec / 60);
        let s = totalSec % 60;
        timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (totalSec <= 0) { clearInterval(timerId); alert("Kisika je zmanjkalo!"); resetGame(); }
    }, 1000);
}

function resetGame() {
    applyResponsiveSizing();
    generateMaze();
    drawMaze();
    playerCell = { x: 0, y: 0 };
    placeIcons();
    playMode = false;
    playBtn.innerText = "Igraj";
    clearInterval(timerId);
}

playBtn.onclick = () => {
    if (playBtn.innerText === "Reset") { resetGame(); return; }
    playMode = true;
    playBtn.innerText = "Reset";
    startTimer();
};

window.onkeydown = (e) => {
    if (!playMode) return;
    let { x, y } = playerCell;
    let current = maze[playerPosToIndex(x, y)];
    if ((e.key === "w" || e.key === "ArrowUp") && !current.walls.top) y--;
    else if ((e.key === "s" || e.key === "ArrowDown") && !current.walls.bottom) y++;
    else if ((e.key === "a" || e.key === "ArrowLeft") && !current.walls.left) x--;
    else if ((e.key === "d" || e.key === "ArrowRight") && !current.walls.right) x++;

    if (x !== playerCell.x || y !== playerCell.y) {
        playerCell = { x, y };
        placeIcons();
        if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) {
            clearInterval(timerId);
            setTimeout(() => alert("Čestitke! Dosegli ste raketo!"), 100);
            playMode = false;
        }
    }
};

// Modalna logika
const modal = document.getElementById("instructionsModal");
document.getElementById("instructionsBtn").onclick = () => modal.style.display = "block";
document.querySelector(".close").onclick = () => modal.style.display = "none";
document.getElementById("closeModalBtn").onclick = () => modal.style.display = "none";

window.onload = resetGame;
window.onresize = resetGame;
