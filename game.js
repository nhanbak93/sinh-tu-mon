const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CELL_SIZE = 60;
const GRID_SIZE = 10;

const START_X = 300;
const START_Y = 50;

function drawGrid(){
    for(let row=0; row<GRID_SIZE; row++){
        for(let col=0; col<GRID_SIZE; col++){
            let x = START_X + col * CELL_SIZE;
            let y = START_Y + row * CELL_SIZE;
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 2;
            ctx.strokeRect(x,y,CELL_SIZE,CELL_SIZE);
        }
    }
    ctx.fillStyle = "lime";
    ctx.fillRect(
        START_X,
        START_Y,
        CELL_SIZE,
        CELL_SIZE
    );
    ctx.fillStyle = "red";
    ctx.fillRect(
        START_X + (GRID_SIZE-1)*CELL_SIZE,
        START_Y + (GRID_SIZE-1)*CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    );
}

let money = 50;
let mauNha = 10;
let wave = 1;
let lastSpawn = Date.now();
let gameOver = false;
let grid = Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(0));
let towers = [];
let selectedTower = "normal";
let selectedTowerToDelete = null;
let deleteButtonX = 0;
let deleteButtonY = 0;
let upgradeButtonX = 0;
let upgradeButtonY = 0;
let nextMonsters = [];
let lastSpawnTime = Date.now();
let spawnDelay = 6000;
let lastMonsterType = null;

canvas.addEventListener("click", function(event){
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if(selectedTowerToDelete){
        if(
            mouseX >= deleteButtonX &&
            mouseX <= deleteButtonX + 50 &&
            mouseY >= deleteButtonY &&
            mouseY <= deleteButtonY + 20
        ){
            grid[selectedTowerToDelete.row][selectedTowerToDelete.col] = 0;
            let index = towers.indexOf(selectedTowerToDelete);
            if(index !== -1){
                towers.splice(index, 1);
            }
            for(let monster of monsters){
                let currentCol =
                    Math.floor((monster.x - START_X) / CELL_SIZE);
                let currentRow =
                    Math.floor((monster.y - START_Y) / CELL_SIZE);
                let newPath = findPath(currentRow, currentCol);
                if(newPath){
                    monster.path = newPath;
                    monster.pathIndex = 0;
                }
            }
            selectedTowerToDelete = null;
            return;
        }
        if(
            mouseX >= upgradeButtonX &&
            mouseX <= upgradeButtonX + 70 &&
            mouseY >= upgradeButtonY &&
            mouseY <= upgradeButtonY + 20
        ){
            let tower = selectedTowerToDelete;
            if(tower.level >= 5){
                return;
            }
            let cost = tower.level * 15;

            if(money >= cost){
                money -= cost;
                tower.level++;
            }
            return;
        }
    }
    
    let clickedTower = false;
    for(let tower of towers){
        let tx = START_X + tower.col * CELL_SIZE;
        let ty = START_Y + tower.row * CELL_SIZE;
        if(
            mouseX >= tx &&
            mouseX <= tx + CELL_SIZE &&
            mouseY >= ty &&
            mouseY <= ty + CELL_SIZE
        ){
            clickedTower = true;
            selectedTowerToDelete = tower;
            upgradeButtonX = tx;
            upgradeButtonY = ty - 25;
            deleteButtonX = tx + 75;
            deleteButtonY = ty - 25;
            return;
        }
    }
    if(!clickedTower){
        selectedTowerToDelete = null;
    }
    
    // Chọn tháp thường
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 100 && mouseY <= 150){
        selectedTower = "normal";
        return;
    }
    // Chọn tháp băng
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 170 && mouseY <= 220){
        selectedTower = "ice";
        return;
    }
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 240 && mouseY <= 290){
        selectedTower = "poison";
        return;
    }
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 310 && mouseY <= 360){
        selectedTower = "air";
        return;
    }
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 380 && mouseY <= 430){
        selectedTower = "energy";
        return;
    }
    const col = Math.floor((mouseX - START_X) / CELL_SIZE);
    const row = Math.floor((mouseY - START_Y) / CELL_SIZE);
    if(row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE){
        if(grid[row][col] === 0 && money >= 10){
            if((row === 0 && col === 0) || (row === 9 && col === 9)){
                return;
            }
            grid[row][col] = 1;
            let testPath = findPath();
            if (testPath === null){
                grid[row][col] = 0;
                return;
            }
            money -= 10;
            towers.push({
                row: row,
                col: col,
                type: selectedTower,
                level: 1,
                lastShot: 0
            });
            for (let monster of monsters) {
                let currentCol = Math.floor((monster.x - START_X) / CELL_SIZE);
                let currentRow = Math.floor((monster.y - START_Y) / CELL_SIZE);
                let newPath = findPath(currentRow, currentCol);
                if (newPath !== null) {
                    monster.path = newPath;
                    monster.pathIndex = 0;
                }
            }
        }
    }
});

function findPath(startRow = 0, startCol = 0) {
    let queue = [{ row: startRow, col: startCol, path: [{ row: startRow, col: startCol }] }];
    let visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    visited[startRow][startCol] = true;
    let directions = [
        { row: 1, col: 0 },
        { row: -1, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: -1 }
    ];
    while (queue.length > 0) {
        let current = queue.shift();
        if (current.row === GRID_SIZE - 1 && current.col === GRID_SIZE - 1) {
            return current.path;
        }
        for (let dir of directions) {
            let newRow = current.row + dir.row;
            let newCol = current.col + dir.col;
            if (
                newRow >= 0 &&
                newRow < GRID_SIZE &&
                newCol >= 0 &&
                newCol < GRID_SIZE &&
                !visited[newRow][newCol] &&
                grid[newRow][newCol] === 0
            ) {
                visited[newRow][newCol] = true;
                queue.push({
                    row: newRow,
                    col: newCol,
                    path: [...current.path, { row: newRow, col: newCol }]
                });
            }
        }
    }
    return null;
}

let monsters = [];
function spawnOneMonster(hp, speed, color, size, kind = "normal") {
    let path = findPath();
    if (path === null && kind !== "fly" && kind !== "bigFly") return;
    monsters.push({
        path: path,
        pathIndex: 0,
        x: START_X + CELL_SIZE / 2,
        y: START_Y + CELL_SIZE / 2,
        hp: hp,
        maxHp: hp,
        speed: speed,
        normalSpeed: speed,
        slowUntil: 0,
        color: color,
        size: size,
        kind: kind
    });
}

function getMonsterTypeForWave(w) {
    let list;
    if (w < 5) {
        list = ["normal", "blue", "split", "thoi"];
    } else if (w % 5 === 0) {
        list = ["boss", "bigFly", "bigBlue", "splitBig", "thoiBu"];
    } else {
        list = ["normal", "blue", "fly", "split", "thoi"];
    }
    // Không cho trùng với đợt trước
    list = list.filter(type => type !== lastMonsterType);
    let type = list[Math.floor(Math.random() * list.length)];
    lastMonsterType = type;
    return type;
}

function prepareNextMonsters() {
    nextMonsters = [];
    lastMonsterType = null;
    for (let i = 0; i < 5; i++) {
        nextMonsters.push(getMonsterTypeForWave(wave + i));
    }
}

function spawnMonster() {
    let kind = nextMonsters.shift();
    if (kind === "fly") {
        let hp = Math.floor(80 * Math.pow(1.012, wave - 1));
        for (let i = 0; i < 5; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 1.5, "blue", 16, "fly");
            }, i * 700);
        }
    } else if (kind === "bigFly") {
        let hp = Math.floor(180 * Math.pow(1.018, wave - 1));
        for (let i = 0; i < 2; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 1.5, "purple", 24, "bigFly");
            }, i * 700);
        }
    } else if (kind === "split") {
        let hp = Math.floor(200 * Math.pow(1.02, wave - 1));
        for (let i = 0; i < 3; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 1.2, "red", 12, "split");
            }, i * 600);
        }
    } else if (kind === "splitBig") {
        let hp = Math.floor(500 * Math.pow(1.025, wave - 1));
        spawnOneMonster(hp, 1.2, "purple", 19, "splitBig");

    } else if (kind === "boss") {
        let hp = Math.floor(500 * Math.pow(1.05, wave - 1));
        for (let i = 0; i < 2; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 2.4, "purple", 15, "boss");
            }, i * 400);
        }
    } else if (kind === "normal") {
        let hp = Math.floor(100 * Math.pow(1.035, wave - 1));
        for (let i = 0; i < 5; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 2.4, "white", 11, "normal");
            }, i * 400);
        }
    } else if (kind === "thoiBu") {
        let hp = Math.floor(1000 * Math.pow(1.06, wave - 1));
        for (let i = 0; i < 2; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 1.7, "purple", 16, "thoiBu");
            }, i * 550);
        }
    } else if (kind === "thoi") {
        let hp = Math.floor(200 * Math.pow(1.04, wave - 1));
        for (let i = 0; i < 7; i++) {
            setTimeout(function () {
                spawnOneMonster(hp, 1.7, "yellow", 11, "thoi");
            }, i * 500);
        }
    } else if (kind === "blue") {
        let blueHp = Math.floor(400 * Math.pow(1.05, wave - 1));
        for (let i = 0; i < 2; i++) {
            setTimeout(function () {
                spawnOneMonster(blueHp, 1, "green", 10, "blue");
            }, i * 700);
        }
    } else {
        let hp = Math.floor(2000 * Math.pow(1.07, wave - 1));
        spawnOneMonster(hp, 1, "purple", 15, "bigBlue");
    }
    wave++;
    nextMonsters.push(getMonsterTypeForWave(wave + 4));
}

function splitMonster(monster) {
    let childKind;
    let childHp;
    let childSpeed;
    let childColor;
    let childSize;
    if (monster.kind === "splitBig") {
        childKind = "split";
        childHp = Math.floor(350 * Math.pow(1.02, wave - 1));
        childSpeed = 1.2;
        childColor = "red";
        childSize = 14;
    } else if (monster.kind === "split") {
        childKind = "splitSmall";
        childHp = Math.floor(monster.maxHp * 0.40);
        childSpeed = 1.4;
        childColor = "red";
        childSize = 11;
    } else {
        return;
    }
    for (let i = 0; i < 2; i++) {
        monsters.push({
            x: monster.x + (i === 0 ? -8 : 8),
            y: monster.y + (i === 0 ? -4 : 4),
            path: monster.path,
            pathIndex: monster.pathIndex,
            hp: childHp,
            maxHp: childHp,
            speed: childSpeed,
            normalSpeed: childSpeed,
            slowUntil: 0,
            color: childColor,
            size: childSize,
            kind: childKind
        });
    }
}

function drawMonsters() {
    for (let monster of monsters) {
        ctx.fillStyle = monster.color;
        // Quái bay: tam giác
        if (monster.kind === "fly" || monster.kind === "bigFly") {
            let endX = START_X + (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
            let endY = START_Y + (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
            let angle = Math.atan2(endY - monster.y, endX - monster.x);
            ctx.save();
            ctx.translate(monster.x, monster.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(monster.size, 0);
            ctx.lineTo(-monster.size, -monster.size / 1.2);
            ctx.lineTo(-monster.size, monster.size / 1.2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        // Quái xanh / bigBlue: hình vuông
        } else if (monster.kind === "blue" || monster.kind === "bigBlue") {
            ctx.fillRect(
                monster.x - monster.size,
                monster.y - monster.size,
                monster.size * 2,
                monster.size * 2
            );
        // Quái split: hình ngũ giác
        } else if (monster.kind === "split" || monster.kind === "splitSmall" || monster.kind === "splitBig") {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                let angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
                let x = monster.x + monster.size * Math.cos(angle);
                let y = monster.y + monster.size * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        
        } else if (monster.kind === "thoi" || monster.kind === "thoiBu") {
            ctx.beginPath();
            ctx.moveTo(monster.x, monster.y - monster.size - 2);
            ctx.lineTo(monster.x + monster.size, monster.y);
            ctx.lineTo(monster.x, monster.y + monster.size + 2);
            ctx.lineTo(monster.x - monster.size, monster.y);
            ctx.closePath();
            ctx.fill();
            // Quái thường / boss: hình tròn
        } else {
            ctx.beginPath();
            ctx.arc(monster.x, monster.y, monster.size, 0, Math.PI * 2);
            ctx.fill();
        }
        // Cây máu nền
        ctx.fillStyle = "red";
        ctx.fillRect(
            monster.x - 15,
            monster.y - 25,
            30,
            5
        );
        // Máu hiện tại
        let realHpRatio = monster.hp / monster.maxHp;
        let hpRatio = Math.pow(realHpRatio, 0.6);
        if (realHpRatio > 0 && hpRatio < 0.02) {
            hpRatio = 0.02;
        }
        ctx.fillStyle = "lime";
        ctx.fillRect(
            monster.x - 15,
            monster.y - 25,
            30 * hpRatio,
            5
        );
    }
}

function drawNextMonsters(timeLeft) {
    for (let i = 0; i < nextMonsters.length; i++) {
        let x = START_X + 15 + i * 45;
        let y = START_Y - 45;
        let kind = nextMonsters[i];
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 35, 35);
        if (kind === "normal") {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(x + 17, y + 17, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === "boss") {
            ctx.fillStyle = "purple";
            ctx.beginPath();
            ctx.arc(x + 17, y + 17, 15, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === "thoi") {
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.moveTo(x + 17, y + 5);
            ctx.lineTo(x + 27, y + 17);
            ctx.lineTo(x + 17, y + 29);
            ctx.lineTo(x + 7, y + 17);
            ctx.closePath();
            ctx.fill();
        } else if (kind === "thoiBu") {
            ctx.fillStyle = "purple";
            ctx.beginPath();
            ctx.moveTo(x + 17, y + 1);
            ctx.lineTo(x + 30, y + 17);
            ctx.lineTo(x + 17, y + 34);
            ctx.lineTo(x + 4, y + 17);
            ctx.closePath();
            ctx.fill();
        } else if (kind === "split") {
            ctx.fillStyle = "red";
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                let angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
                let px = x + 17 + 11 * Math.cos(angle);
                let py = y + 17 + 11 * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        } else if (kind === "splitBig") {
            ctx.fillStyle = "purple";
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                let angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
                let px = x + 17 + 16 * Math.cos(angle);
                let py = y + 17 + 16 * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        } else if (kind === "blue") {
            ctx.fillStyle = "green";
            ctx.fillRect(x + 8.5, y + 8.5, 17.5, 17.5);
        } else if (kind === "bigBlue") {
            ctx.fillStyle = "purple";
            ctx.fillRect(x + 5, y + 5, 25, 25);
        } else if (kind === "bigFly") {
            ctx.fillStyle = "purple";
            ctx.beginPath();
            ctx.moveTo(x + 17, y + 3);
            ctx.lineTo(x + 3, y + 31);
            ctx.lineTo(x + 31, y + 31);
            ctx.closePath();
            ctx.fill();
        } else if (kind === "fly") {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(x + 17, y + 7);
            ctx.lineTo(x + 7, y + 27);
            ctx.lineTo(x + 27, y + 27);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.font = "20px Arial";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.strokeText(timeLeft + "s", START_X + 18, START_Y + 38);
    ctx.fillText(timeLeft + "s", START_X + 18, START_Y + 38);
}

function moveMonsters() {
    for (let i = monsters.length - 1; i >= 0; i--) {
        let monster = monsters[i];
        if (monster.kind === "fly" || monster.kind === "bigFly") {
            let endX = START_X + (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
            let endY = START_Y + (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
            let dx = endX - monster.x;
            let dy = endY - monster.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < monster.speed) {
                monsters.splice(i, 1);
                mauNha -= 1;
                if (mauNha <= 0) {
                    gameOver = true;
                }
                continue;
            }
            monster.x += dx / distance * monster.speed;
            monster.y += dy / distance * monster.speed;
            continue;
        }
        if (monster.slowUntil > Date.now()) {
        } else {
            monster.speed = monster.normalSpeed;
        }
        if (monster.pathIndex >= monster.path.length - 1) {
            monsters.splice(i, 1);
            mauNha -= 1;
            if (mauNha <= 0) {
                gameOver = true;
            }
            continue;
        }
        let nextCell = monster.path[monster.pathIndex + 1];
        let targetX = START_X + nextCell.col * CELL_SIZE + CELL_SIZE / 2;
        let targetY = START_Y + nextCell.row * CELL_SIZE + CELL_SIZE / 2;
        let dx = targetX - monster.x;
        let dy = targetY - monster.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < monster.speed) {
            monster.x = targetX;
            monster.y = targetY;
            monster.pathIndex++;
        } else {
            monster.x += dx / distance * monster.speed;
            monster.y += dy / distance * monster.speed;
        }
    }
}

function drawTowers(){
    for(let tower of towers){
        let x = START_X + tower.col * CELL_SIZE;
        let y = START_Y + tower.row * CELL_SIZE;
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        if(tower.type === "air"){
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE / 2, y + 7);
            ctx.lineTo(x + 7, y + CELL_SIZE - 7);
            ctx.lineTo(x + CELL_SIZE - 7, y + CELL_SIZE - 7);
            ctx.closePath();
            ctx.fill();
        }else if(tower.type === "energy"){
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE / 2, y + 7);
            ctx.lineTo(x + CELL_SIZE - 7, y + CELL_SIZE / 2);
            ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE - 7);
            ctx.lineTo(x + 7, y + CELL_SIZE / 2);
            ctx.closePath();
            ctx.fill();
        }else if(tower.type === "normal"){
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(x + CELL_SIZE / 2, y + 7);
            ctx.lineTo(x + CELL_SIZE - 8, y + 27);
            ctx.lineTo(x + CELL_SIZE - 16, y + CELL_SIZE - 7);
            ctx.lineTo(x + 16, y + CELL_SIZE - 7);
            ctx.lineTo(x + 8, y + 27);
            ctx.closePath();
            ctx.fill();
        }else if(tower.type === "ice"){
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 7, 0, Math.PI * 2);
            ctx.fill();
        }else{
            ctx.fillStyle = "green";
            ctx.fillRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
        }
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.strokeText(
            tower.level,
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2 + 3
        );

        ctx.fillStyle = "white";
        ctx.fillText(
            tower.level,
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2 + 3
        );

        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
        ctx.lineWidth = 1;
    }
}

function drawTowerButtons(){
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Các Tháp", 950, 80);
    // Tháp thường
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 100, 50, 50);
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.moveTo(975, 103);
    ctx.lineTo(997, 120);
    ctx.lineTo(989, 147);
    ctx.lineTo(961, 147);
    ctx.lineTo(953, 120);
    ctx.closePath();
    ctx.fill();
    if(selectedTower === "normal"){
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 97, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 95, 220, 170);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Có thể bắn cả quái bộ", 1045, 125);
        ctx.fillText("lẩn quái bay. Khi đạt", 1045, 155);
        ctx.fillText("lv 5 sẽ kết liễu quái", 1045, 185);
        ctx.fillText("dưới 0.5% máu", 1045, 215);
        ctx.fillText("Sát thương đơn: 200", 1045, 245);
        ctx.lineWidth = 1;
    }
    // Tháp băng
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 170, 50, 50);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(975, 195, 22, 0, Math.PI * 2);
    ctx.fill();
    if(selectedTower === "ice"){
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 167, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 165, 220, 200);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Có thể bắn cả quái bộ", 1045, 195);
        ctx.fillText("lẩn quái bay. Làm Chậm", 1045, 225);
        ctx.fillText("tốc độ di chuyển của", 1045, 255);
        ctx.fillText("quái", 1045, 285);
        ctx.fillText("Làm chậm: 20%", 1045, 345);
        ctx.fillText("Sát thương lan: 200", 1045, 315);
        ctx.lineWidth = 1;
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 240, 50, 50);
    ctx.fillStyle = "green";
    ctx.fillRect(953, 243, 44, 44);
    if(selectedTower === "poison"){
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 237, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 235, 220, 140);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Chỉ bắn quái bộ. Gây", 1045, 265);
        ctx.fillText("sát thương lan theo %", 1045, 295);
        ctx.fillText("máu hiện tại của quái", 1045, 325);
        ctx.fillText("Sát thương lan: 9%", 1045, 355);
        ctx.lineWidth = 1;
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 310, 50, 50);
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(975, 313);
    ctx.lineTo(953, 357);
    ctx.lineTo(997, 357);
    ctx.closePath();
    ctx.fill();
    if(selectedTower === "air"){
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 307, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 305, 220, 80);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Chỉ bắn quái bay", 1045, 335);
        ctx.fillText("Sát thương đơn: 200", 1045, 365);
        ctx.lineWidth = 1;
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 380, 50, 50);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(975, 383);
    ctx.lineTo(997, 405);
    ctx.lineTo(975, 427);
    ctx.lineTo(953, 405);
    ctx.closePath();
    ctx.fill();
    if(selectedTower === "energy"){
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 377, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 375, 220, 140);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Tăng % sát thương cho", 1045, 405);
        ctx.fillText("những tháp sung quanh.", 1045, 435);
        ctx.fillText("Không tăng sát thương", 1045, 465);
        ctx.fillText("theo % máu, làm chậm", 1045, 495);
        ctx.lineWidth = 1;
    }
}

let bullets = [];
function towerShoot(){
    let now = Date.now();
    for(let tower of towers){
        if(tower.type === "energy"){
            continue;
        }
        if(!tower.lastShot){
            tower.lastShot = 0;
        }
        let tx = START_X + tower.col * CELL_SIZE + CELL_SIZE / 2;
        let ty = START_Y + tower.row * CELL_SIZE + CELL_SIZE / 2;
        for(let monster of monsters){
            if (tower.type === "poison" && (monster.kind === "fly" || monster.kind === "bigFly")) {
                continue;
            }
            if (tower.type === "air" && ! (monster.kind === "fly" || monster.kind === "bigFly")) {
                continue;
            }
            let dx = monster.x - tx;
            let dy = monster.y - ty;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let range = 150;
            if (tower.type === "air") {
                range = 270;
            }
            if (tower.type === "normal") {
                range = 210;
            }
            if(dist < range && now - tower.lastShot > 800){
                let damage = 200;
                if(tower.type === "ice"){
                    damage = 100 + tower.level * 100;
                }
                else if(tower.type === "air"){
                    damage = (0 - 100) + tower.level * 300;
                }
                else if(tower.type === "normal"){
                    damage = (0 - 100) + tower.level * 300;
                    if (tower.level === 5 && monster.hp <= monster.maxHp * 0.005) {
                        damage = monster.hp;
                    }
                }
                let buff = 1;
                for(let otherTower of towers){
                    if(otherTower.type === "energy"){
                        let ex = START_X + otherTower.col * CELL_SIZE + CELL_SIZE / 2;
                        let ey = START_Y + otherTower.row * CELL_SIZE + CELL_SIZE / 2;
                        let dxBuff = ex - tx;
                        let dyBuff = ey - ty;
                        let distBuff = Math.sqrt(dxBuff * dxBuff + dyBuff * dyBuff);
                        if(distBuff <= 90){
                            let energyBuff = [0.03, 0.07, 0.11, 0.15, 0.20];
                            buff += energyBuff[Math.min(otherTower.level, 5) - 1];
                        }
                    }
                }
                damage = Math.floor(damage * buff);

                bullets.push({
                    x: tx,
                    y: ty,
                    target: monster,
                    speed: 5,
                    damage: damage,
                    type: tower.type,
                    level: tower.level
                });
                tower.lastShot = now;
                    break;
            }
        }
    }
}

function moveBullets(){
    for(let i = bullets.length - 1; i >= 0; i--){
        let bullet = bullets[i];
        if(!monsters.includes(bullet.target)){
            bullets.splice(i, 1);
            continue;
        }
        let dx = bullet.target.x - bullet.x;
        let dy = bullet.target.y - bullet.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < bullet.speed){
            let affectedMonsters = [];
            if(bullet.type === "poison" || bullet.type === "ice"){
                for(let other of monsters){
                    let dx2 = other.x - bullet.target.x;
                    let dy2 = other.y - bullet.target.y;
                    let dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if(dist2 < 80){
                        affectedMonsters.push(other);
                    }
                }
            }else{
                affectedMonsters.push(bullet.target);
            }
            for(let m of affectedMonsters){
                if(bullet.type === "poison"){
                    m.hp -= m.hp * (0.09 * bullet.level);
                }else{
                    m.hp -= bullet.damage;
                }
                if(bullet.type === "ice"){
                    let slowRate = Math.max(0.5, 0.8 - (bullet.level - 1) * 0.06);
                    m.speed = m.normalSpeed * slowRate;
                    m.slowUntil = Date.now() + 2000;
                }
            }
            bullets.splice(i, 1);
            for(let j = monsters.length - 1; j >= 0; j--){
                if(monsters[j].hp <= 0){
                    if (monsters[j].kind === "split" || monsters[j].kind === "splitBig"){
                        splitMonster(monsters[j]);
                    }
                    if(monsters[j].kind === "bigBlue"){
                        money += 15;
                    }else  if(monsters[j].color === "purple"){
                        money += 7;
                    }else if(monsters[j].kind === "blue"){
                        money += 4;
                    }else{
                        money += 2;
                    }
                    monsters.splice(j, 1);
                }
            }
        }else{
            bullet.x += dx / dist * bullet.speed;
            bullet.y += dy / dist * bullet.speed;
        }
    }
}

function drawBullets(){
    for(let bullet of bullets){
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameLoop(){
    ctx.fillStyle = "rgb(30,30,30)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(gameOver){
        ctx.fillStyle = "red";
        ctx.font = "70px Arial";
        ctx.fillText("GAME OVER", 430, 350);
        return;
    }
    if(!gameOver && Date.now() - lastSpawn > spawnDelay){
        spawnMonster();
        lastSpawn = Date.now();
    }
    moveMonsters();
    towerShoot();
    moveBullets();
    let timeLeft = Math.ceil((spawnDelay - (Date.now() - lastSpawn)) / 1000);
    if (timeLeft < 0) timeLeft = 0;
    drawGrid();
    drawTowers();
    drawTowerButtons();
    drawNextMonsters(timeLeft);
    if (selectedTowerToDelete) {
        // ===== VẼ VÒNG TRÒN TẦM BẮN =====
        let selectedX =
            START_X +
            selectedTowerToDelete.col * CELL_SIZE +
            CELL_SIZE / 2;
        let selectedY =
            START_Y +
            selectedTowerToDelete.row * CELL_SIZE +
            CELL_SIZE / 2;
        let selectedRange = 150;
        if (selectedTowerToDelete.type === "air") {
            selectedRange = 270;
        }
        if (selectedTowerToDelete.type === "normal") {
            selectedRange = 210;
        }
        if (selectedTowerToDelete.type === "energy") {
            selectedRange = 90;
        }
        ctx.beginPath();
        ctx.arc(selectedX, selectedY, selectedRange, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        // Tránh lineWidth làm ảnh hưởng các hình vẽ phía sau
        ctx.lineWidth = 1;
        // ===== NÚT XÓA =====
        ctx.fillStyle = "red";
        ctx.fillRect(deleteButtonX, deleteButtonY, 50, 20);
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText("Xóa", deleteButtonX + 8, deleteButtonY + 15);

        ctx.fillStyle = "orange";
        ctx.fillRect(upgradeButtonX, upgradeButtonY, 70, 20);
        ctx.fillStyle = "black";
        ctx.fillText("Nâng Cấp", upgradeButtonX + 5, upgradeButtonY + 15);

        // ===== HIỆN CHỈ SỐ THÁP =====
        let lv = selectedTowerToDelete.level;
        let nextLv = lv + 1;
        if(nextLv > 5) nextLv = 5;

        let infoX = upgradeButtonX;
        let infoY = upgradeButtonY + 40;

        let buff = 1;

        for(let otherTower of towers){
            if(otherTower.type == "energy"){
                let ex = START_X + otherTower.col * CELL_SIZE + CELL_SIZE / 2;
                let ey = START_Y + otherTower.row * CELL_SIZE + CELL_SIZE / 2;

                let sx = START_X + selectedTowerToDelete.col * CELL_SIZE + CELL_SIZE / 2;
                let sy = START_Y + selectedTowerToDelete.row * CELL_SIZE + CELL_SIZE / 2;

                let dxBuff = ex - sx;
                let dyBuff = ey - sy;
                let distBuff = Math.sqrt(dxBuff * dxBuff + dyBuff * dyBuff);

                if(distBuff <= 90){
                    let energyBuff = [0.03, 0.07, 0.11, 0.15, 0.20];
                    buff += energyBuff[Math.min(otherTower.level, 5) - 1];
                }
            }
        }

        // bảng đen mờ
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(infoX - 8, infoY - 22, 225, 135);

        ctx.font = "13px Arial";

        // tiêu đề cột
        ctx.fillStyle = "yellow";
        ctx.fillText("Hiện Tại", infoX + 90, infoY);
        ctx.fillText("Cấp Sau", infoX + 155, infoY);

        // level
        ctx.fillStyle = "white";
        ctx.fillText("Level", infoX, infoY + 22);
        ctx.fillText(lv + "/5", infoX + 105, infoY + 22);
        ctx.fillText(nextLv + "/5", infoX + 170, infoY + 22);

        // nếu có energy buff
        if(buff > 1 && selectedTowerToDelete.type !== "poison" && selectedTowerToDelete.type !== "energy"){
            ctx.fillStyle = "yellow";
            ctx.fillText("Tăng Sát Thương +" + Math.round((buff - 1) * 100) + "%", infoX, infoY + 88);
        }

        // ===== NORMAL =====
        if(selectedTowerToDelete.type == "normal"){
            let damage = (0 - 100) + lv * 300;
            let nextDamage = (0 - 100) + nextLv * 300;

            damage = Math.floor(damage * buff);
            nextDamage = Math.floor(nextDamage * buff);

            ctx.fillStyle = "white";
            ctx.fillText("Sát Thương", infoX, infoY + 44);
            ctx.fillText(damage, infoX + 105, infoY + 44);
            ctx.fillText(nextDamage, infoX + 170, infoY + 44);
        }

        // ===== ICE =====
        if(selectedTowerToDelete.type == "ice"){
            let damage = Math.floor((100 + lv * 100) * buff);
            let nextDamage = Math.floor((100 + nextLv * 100) * buff);

            let slow = Math.round((1 - Math.max(0.5, 0.8 - (lv - 1) * 0.06)) * 100);
            let nextSlow = Math.round((1 - Math.max(0.5, 0.8 - (nextLv - 1) * 0.06)) * 100);

            ctx.fillStyle = "white";
            ctx.fillText("Sát Thương", infoX, infoY + 44);
            ctx.fillText(damage, infoX + 105, infoY + 44);
            ctx.fillText(nextDamage, infoX + 170, infoY + 44);

            ctx.fillText("Làm Chậm", infoX, infoY + 66);
            ctx.fillText(slow + "%", infoX + 105, infoY + 66);
            ctx.fillText(nextSlow + "%", infoX + 170, infoY + 66);
        }

        // ===== POISON =====
        if(selectedTowerToDelete.type == "poison"){
            let poison = 9 * lv;
            let nextPoison = 9 * nextLv;

            ctx.fillStyle = "white";
            ctx.fillText("Sát Thương", infoX, infoY + 44);
            ctx.fillText(poison + "%", infoX + 105, infoY + 44);
            ctx.fillText(nextPoison + "%", infoX + 170, infoY + 44);
        }

        // ===== AIR =====
        if(selectedTowerToDelete.type == "air"){
            let damage = Math.floor(((0 - 100) + lv * 300) * buff);
            let nextDamage = Math.floor(((0 - 100) + nextLv * 300) * buff);

            ctx.fillStyle = "white";
            ctx.fillText("Sát Thương", infoX, infoY + 44);
            ctx.fillText(damage, infoX + 105, infoY + 44);
            ctx.fillText(nextDamage, infoX + 170, infoY + 44);
        }

        // ===== ENERGY =====
        if(selectedTowerToDelete.type == "energy"){
            ctx.fillStyle = "white";
            ctx.fillText("Buff dame", infoX, infoY + 44);
            ctx.fillText("+20%", infoX + 105, infoY + 44);
            ctx.fillText("+20%", infoX + 170, infoY + 44);
        }
    }
    drawMonsters();
    drawBullets();
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText("Tiền: " + money, 20, 50);
    ctx.fillText("Máu: " + mauNha, 20, 90);
    ctx.fillText("Vòng: " + wave, 20, 130);
    requestAnimationFrame(gameLoop);
}

prepareNextMonsters();
gameLoop();