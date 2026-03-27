const GRID_SIZE = 30;
let CELL = 16, MARGIN = 2;
const canvas = document.getElementById("canvas"), ctx = canvas.getContext("2d");
const astronavt = document.getElementById("astronavt"), raketa = document.getElementById("raketa");
const playBtn = document.getElementById("playBtn"), showBtn = document.getElementById("showSolution");
const timerEl = document.getElementById("timer"), difficultySelect = document.getElementById("difficulty");

let maze = [], playerCell = null, playMode = false, timerId = null;

// Modalna logika
const modal = document.getElementById("instructionsModal");
document.getElementById("instructionsBtn").onclick = () => modal.style.display = "block";
document.querySelector(".close").onclick = () => modal.style.display = "none";
document.getElementById("closeModalBtn").onclick = () => modal.style.display = "none";

function applyResponsiveSizing() {
    const available = Math.min(500, window.innerWidth - 60, window.innerHeight - 300);
    CELL = Math.floor(available / GRID_SIZE);
    const logicalSize = GRID_SIZE * CELL + MARGIN * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    canvas.style.width = logicalSize + "px";
    canvas.style.height = logicalSize + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if(maze.length) drawMaze();
    updatePositions();
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
    let stack = [], current = maze[0];
    current.visited = true;
    while (true) {
        let neighbors = [];
        const {x, y} = current;
        if (y > 0 && !maze[x + (y-1)*GRID_SIZE].visited) neighbors.push(maze[x + (y-1)*GRID_SIZE]);
        if (x < GRID_SIZE-1 && !maze[(x+1) + y*GRID_SIZE].visited) neighbors.push(maze[(x+1) + y*GRID_SIZE]);
        if (y < GRID_SIZE-1 && !maze[x + (y+1)*GRID_SIZE].visited) neighbors.push(maze[x + (y+1)*GRID_SIZE]);
        if (x > 0 && !maze[(x-1) + y*GRID_SIZE].visited) neighbors.push(maze[(x-1) + y*GRID_SIZE]);
        if (neighbors.length) {
            let next = neighbors[Math.floor(Math.random()*neighbors.length)];
            stack.push(current);
            if (current.x < next.x) { current.walls.right = false; next.walls.left = false; }
            else if (current.x > next.x) { current.walls.left = false; next.walls.right = false; }
            else if (current.y < next.y) { current.walls.bottom = false; next.walls.top = false; }
            else if (current.y > next.y) { current.walls.top = false; next.walls.bottom = false; }
            next.visited = true; current = next;
        } else if (stack.length) current = stack.pop(); else break;
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

function updatePositions() {
    if (!playerCell) playerCell = maze[0];
    const place = (el, x, y) => {
        const cx = MARGIN + x * CELL + CELL/2, cy = MARGIN + y * CELL + CELL/2;
        el.style.left = (cx - el.offsetWidth/2) + "px";
        el.style.top = (cy - el.offsetHeight/2) + "px";
    };
    place(astronavt, playerCell.x, playerCell.y);
    place(raketa, GRID_SIZE-1, GRID_SIZE-1);
}

// Funkcija za rešitev
showBtn.onclick = () => {
    if (!maze.length) return;
    const end = maze[maze.length - 1];
    let queue = [[playerCell]], visited = new Set([`${playerCell.x},${playerCell.y}`]);
    while (queue.length) {
        let path = queue.shift(), curr = path[path.length - 1];
        if (curr === end) {
            ctx.strokeStyle = "#ff3333"; ctx.lineWidth = 3; ctx.beginPath();
            path.forEach((c, i) => {
                const x = MARGIN + c.x * CELL + CELL/2, y = MARGIN + c.y * CELL + CELL/2;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            return;
        }
        [[0,-1,'top'], [1,0,'right'], [0,1,'bottom'], [-1,0,'left']].forEach(([dx, dy, w]) => {
            if (!curr.walls[w]) {
                let next = maze[(curr.x + dx) + (curr.y + dy) * GRID_SIZE];
                if (!visited.has(`${next.x},${next.y}`)) {
                    visited.add(`${next.x},${next.y}`);
                    queue.push([...path, next]);
                }
            }
        });
    }
};

playBtn.onclick = () => {
    generateMaze(); drawMaze(); playerCell = maze[0];
    playMode = true; playBtn.innerText = "Reset"; updatePositions();
};

window.onkeydown = (e) => {
    if (!playMode) return;
    let dx = 0, dy = 0, w = "";
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "w") { dy = -1; w = "top"; }
    else if (key === "arrowdown" || key === "s") { dy = 1; w = "bottom"; }
    else if (key === "arrowleft" || key === "a") { dx = -1; w = "left"; }
    else if (key === "arrowright" || key === "d") { dx = 1; w = "right"; }
    if (w && !playerCell.walls[w]) {
        playerCell = maze[(playerCell.x + dx) + (playerCell.y + dy) * GRID_SIZE];
        updatePositions();
        if (playerCell.x === GRID_SIZE-1 && playerCell.y === GRID_SIZE-1) alert("Zmaga!");
    }
};

window.onload = applyResponsiveSizing;
window.onresize = applyResponsiveSizing;
