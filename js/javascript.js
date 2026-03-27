const GRID_SIZE = 30;
let CELL_SIZE = 0;
let maze = [];
let playerPos = { x: 0, y: 0 };
let playMode = false;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const astronavt = document.getElementById('astronavt');
const raketa = document.getElementById('raketa');

// Generiranje labirinta
function generateMaze() {
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
    const setPos = (el, x, y) => {
        el.style.width = CELL_SIZE + "px";
        el.style.height = CELL_SIZE + "px";
        el.style.left = (x * CELL_SIZE) + "px";
        el.style.top = (y * CELL_SIZE) + "px";
        el.style.display = "flex";
        el.style.justifyContent = "center";
        el.style.alignItems = "center";
    };
    setPos(astronavt, playerPos.x, playerPos.y);
    setPos(raketa, GRID_SIZE - 1, GRID_SIZE - 1);
}

// LOGIKA ZA REŠITEV
document.getElementById('showSolution').onclick = () => {
    if (!maze.length) return;
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
        }
    }
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

document.getElementById('playBtn').onclick = () => {
    generateMaze();
    playerPos = { x: 0, y: 0 };
    playMode = true;
    resize();
};

document.getElementById('instructionsBtn').onclick = () => document.getElementById('instructionsModal').style.display = 'block';
window.onresize = resize;
window.onload = () => { generateMaze(); resize(); };
