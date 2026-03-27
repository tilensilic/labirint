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
let CELL_SIZE = 0;
let maze = [];
let playerPos = { x: 0, y: 0 };
let playMode = false;

class Cell {
    constructor(x, y) {
        this.x = x; this.y = y; this.visited = false;
        this.walls = { top: true, right: true, bottom: true, left: true };
    }
}
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const astronavt = document.getElementById('astronavt');
const raketa = document.getElementById('raketa');

// Generiranje labirinta
function generateMaze() {
    maze = [];
    for (let y = 0; y < GRID_SIZE; y++) 
        for (let x = 0; x < GRID_SIZE; x++) maze.push(new Cell(x, y));
    let stack = [], current = maze[0];
    maze = Array.from({ length: GRID_SIZE }, (_, y) => 
        Array.from({ length: GRID_SIZE }, (_, x) => ({
            x, y, visited: false, walls: { top: true, right: true, bottom: true, left: true }
        }))
    );

    let stack = [];
    let current = maze[0][0];
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
        const { x, y } = current;
        if (y > 0 && !maze[y - 1][x].visited) neighbors.push({ n: maze[y - 1][x], w: 'top', rw: 'bottom' });
        if (x < GRID_SIZE - 1 && !maze[y][x + 1].visited) neighbors.push({ n: maze[y][x + 1], w: 'right', rw: 'left' });
        if (y < GRID_SIZE - 1 && !maze[y + 1][x].visited) neighbors.push({ n: maze[y + 1][x], w: 'bottom', rw: 'top' });
        if (x > 0 && !maze[y][x - 1].visited) neighbors.push({ n: maze[y][x - 1], w: 'left', rw: 'right' });

        if (neighbors.length > 0) {
            let { n, w, rw } = neighbors[Math.floor(Math.random() * neighbors.length)];
            current.walls[w] = false;
            n.walls[rw] = false;
            n.visited = true;
            stack.push(current);
            if (current.x < next.x) { current.walls.right = false; next.walls.left = false; }
            else if (current.x > next.x) { current.walls.left = false; next.walls.right = false; }
            else if (current.y < next.y) { current.walls.bottom = false; next.walls.top = false; }
            else if (current.y > next.y) { current.walls.top = false; next.walls.bottom = false; }
            next.visited = true; current = next;
        } else if (stack.length) current = stack.pop(); else break;
            current = n;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else break;
    }
}

function resize() {
    const container = document.getElementById('container');
    const size = container.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    CELL_SIZE = size / GRID_SIZE;
    drawMaze();
    updatePositions();
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
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = maze[y][x];
            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;
            ctx.beginPath();
            if (cell.walls.top) { ctx.moveTo(px, py); ctx.lineTo(px + CELL_SIZE, py); }
            if (cell.walls.right) { ctx.moveTo(px + CELL_SIZE, py); ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE); }
            if (cell.walls.bottom) { ctx.moveTo(px, py + CELL_SIZE); ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE); }
            if (cell.walls.left) { ctx.moveTo(px, py); ctx.lineTo(px, py + CELL_SIZE); }
            ctx.stroke();
        }
    }
}

function updatePositions() {
    if (!playerCell) playerCell = maze[0];
    const place = (el, x, y) => {
        const cx = MARGIN + x * CELL + CELL/2, cy = MARGIN + y * CELL + CELL/2;
        el.style.left = (cx - el.offsetWidth/2) + "px";
        el.style.top = (cy - el.offsetHeight/2) + "px";
    const setPos = (el, x, y) => {
        el.style.width = CELL_SIZE + "px";
        el.style.height = CELL_SIZE + "px";
        el.style.left = (x * CELL_SIZE) + "px";
        el.style.top = (y * CELL_SIZE) + "px";
        el.style.display = "flex";
        el.style.justifyContent = "center";
        el.style.alignItems = "center";
    };
    place(astronavt, playerCell.x, playerCell.y);
    place(raketa, GRID_SIZE-1, GRID_SIZE-1);
    setPos(astronavt, playerPos.x, playerPos.y);
    setPos(raketa, GRID_SIZE - 1, GRID_SIZE - 1);
}

// Funkcija za rešitev
showBtn.onclick = () => {
// LOGIKA ZA REŠITEV
document.getElementById('showSolution').onclick = () => {
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
    const endX = GRID_SIZE - 1, endY = GRID_SIZE - 1;
    let queue = [[maze[playerPos.y][playerPos.x]]];
    let visited = new Set([`${playerPos.x},${playerPos.y}`]);

    while (queue.length > 0) {
        let path = queue.shift();
        let curr = path[path.length - 1];

        if (curr.x === endX && curr.y === endY) {
            drawPath(path);
            return;
        }
        [[0,-1,'top'], [1,0,'right'], [0,1,'bottom'], [-1,0,'left']].forEach(([dx, dy, w]) => {
            if (!curr.walls[w]) {
                let next = maze[(curr.x + dx) + (curr.y + dy) * GRID_SIZE];
                if (!visited.has(`${next.x},${next.y}`)) {
                    visited.add(`${next.x},${next.y}`);
                    queue.push([...path, next]);

        const moves = [
            { x: 0, y: -1, w: 'top' }, { x: 1, y: 0, w: 'right' },
            { x: 0, y: 1, w: 'bottom' }, { x: -1, y: 0, w: 'left' }
        ];

        for (let m of moves) {
            if (!curr.walls[m.w]) {
                let nx = curr.x + m.x, ny = curr.y + m.y;
                if (!visited.has(`${nx},${ny}`)) {
                    visited.add(`${nx},${ny}`);
                    queue.push([...path, maze[ny][nx]]);
                }
            }
        });
        }
    }
};

playBtn.onclick = () => {
    generateMaze(); drawMaze(); playerCell = maze[0];
    playMode = true; playBtn.innerText = "Reset"; updatePositions();
};
function drawPath(path) {
    drawMaze();
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 4;
    ctx.beginPath();
    path.forEach((c, i) => {
        const x = c.x * CELL_SIZE + CELL_SIZE / 2;
        const y = c.y * CELL_SIZE + CELL_SIZE / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

// Kontrole
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
    let key = e.key.toLowerCase();
    let curr = maze[playerPos.y][playerPos.x];
    if ((key === 'w' || key === 'arrowup') && !curr.walls.top) playerPos.y--;
    else if ((key === 's' || key === 'arrowdown') && !curr.walls.bottom) playerPos.y++;
    else if ((key === 'a' || key === 'arrowleft') && !curr.walls.left) playerPos.x--;
    else if ((key === 'd' || key === 'arrowright') && !curr.walls.right) playerPos.x++;
    updatePositions();
    if (playerPos.x === GRID_SIZE - 1 && playerPos.y === GRID_SIZE - 1) {
        alert("Zmaga!");
        playMode = false;
    }
};

window.onload = applyResponsiveSizing;
window.onresize = applyResponsiveSizing;
document.getElementById('playBtn').onclick = () => {
    generateMaze();
    playerPos = { x: 0, y: 0 };
    playMode = true;
    resize();
};

document.getElementById('instructionsBtn').onclick = () => document.getElementById('instructionsModal').style.display = 'block';
window.onresize = resize;
window.onload = () => { generateMaze(); resize(); };
