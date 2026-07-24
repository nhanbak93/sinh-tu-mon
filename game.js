const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameWrapper = document.getElementById("gameWrapper");
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 700;
const GRID_SIZE = 10;
const CELL_SIZE = 60;
const START_X = 300;
const START_Y = 50;
const MAGIC_COOLDOWN = 100;
const DAMAGE_MAGIC_COOLDOWN = 100;

const amthanhphepset = new
Audio("amthanh/pheptiaset.mp3");
amthanhphepset.volume = 0.2;
const amthanhnangcap = new
Audio("amthanh/nangcap.mp3");
amthanhnangcap.volume = 0.5;
const amthanhbanthap = new
Audio("amthanh/banthap.mp3");
amthanhbanthap.volume = 0.7;
const amthanhhettien = new
Audio("amthanh/hettien.mp3");
amthanhhettien.volume = 0.2;
const amthanhnhacnen = new
Audio("amthanh/nhacnen.mp3");
amthanhnhacnen.loop = true;
amthanhnhacnen.volume = 0.2;

let magicCooldown = 0;
let damageMagicCooldown = 0;
let money = 50;
let mauNha = 10;
let wave = 1;
let lastSpawn = Date.now();
let hiddenStartTime = null;
let simulatedTime = null;
let isSimulating = false;
let pendingSpawns = [];
function gameNow() {
    return simulatedTime !== null ? simulatedTime : Date.now();
}
let gameOver = false;
let towers = [];
let selectedTower = "normal";
let selectedTowerToDelete = null;
let deleteButtonX = 0;
let deleteButtonY = 0;
let upgradeButtonX = 0;
let upgradeButtonY = 0;
let nextMonsters = [];
let lastSpawnTime = lastSpawn;
let spawnDelay = 6000;
let lastMonsterType = null;
let wakeLock = null;
let audioCtx = null;
let masterGain = null;
let compressor = null;
let soundEnabled = true;
let grid = Array.from(
    { length: GRID_SIZE },
    () => Array(GRID_SIZE).fill(0)
);
let mapSelected = false;
let currentMap = null;
let rocks = [];
const MAPS = {
    classic: {
        name: "MAP CỔ ĐIỂN",
        rocks: []
    },
    rock: {
        name: "MAP ĐÁ",
        rocks: [
            { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }, { row: 4, col: 4 },
            { row: 4, col: 5 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 7, col: 7 },
            { row: 7, col: 8 }, { row: 7, col: 9 }, { row: 0, col: 9 }, { row: 0, col: 8 }, { row: 0, col: 7 },
            { row: 1, col: 9 }, { row: 1, col: 8 }, { row: 1, col: 7 }
        ]
    }
};

function selectMap(mapName) {
    currentMap = mapName;
    mapSelected = true;
    // Xoa toan bo vat can cu
    grid = Array.from(
        { length: GRID_SIZE },
        () => Array(GRID_SIZE).fill(0)
    );
    // Lay danh sach da cua map da chon
    rocks = MAPS[mapName].rocks.map(rock => ({
        row: rock.row,
        col: rock.col
    }));
    // Danh dau cac o da = 1
    for (let rock of rocks) {
        grid[rock.row][rock.col] = 1;
    }
    // Tinh duong di ban dau
    const firstPath = findPath();
    if (firstPath === null) {
        console.error("Map nay khong co duong di!");
        mapSelected = false;
        currentMap = null;
        rocks = [];
        return;
    }
    // Bat dau dem thoi gian sinh quai tu luc chon map
    lastSpawn = Date.now();
    lastSpawnTime = Date.now();
}

function resizeGame() {
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    gameWrapper.style.transform = `scale(${scale})`;
}
resizeGame();
window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", resizeGame);

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

function drawRocks() {
    for (let rock of rocks) {
        const x = START_X + rock.col * CELL_SIZE;
        const y = START_Y + rock.row * CELL_SIZE;
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;
        ctx.save();
        ctx.fillStyle = "#292929";
        ctx.fillRect(
            x + 3,
            y + 3,
            CELL_SIZE - 6,
            CELL_SIZE - 6
        );
        ctx.beginPath();
        ctx.moveTo(centerX - 22, centerY + 13);
        ctx.lineTo(centerX - 25, centerY - 5);
        ctx.lineTo(centerX - 14, centerY - 21);
        ctx.lineTo(centerX + 7, centerY - 24);
        ctx.lineTo(centerX + 23, centerY - 10);
        ctx.lineTo(centerX + 20, centerY + 14);
        ctx.lineTo(centerX + 6, centerY + 23);
        ctx.lineTo(centerX - 13, centerY + 21);
        ctx.closePath();
        ctx.fillStyle = "#777";
        ctx.fill();
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - 14, centerY - 13);
        ctx.lineTo(centerX + 5, centerY - 17);
        ctx.lineTo(centerX + 14, centerY - 8);
        ctx.lineTo(centerX - 7, centerY - 5);
        ctx.closePath();
        ctx.fillStyle = "#aaa";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + 2, centerY - 4);
        ctx.lineTo(centerX - 3, centerY + 4);
        ctx.lineTo(centerX + 3, centerY + 8);
        ctx.lineTo(centerX - 2, centerY + 15);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

function drawMapSelection() {
    ctx.save();
    // Nen den
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Tieu de
    ctx.fillStyle = "white";
    ctx.font = "bold 45px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        "CHỌN BẢN ĐỒ",
        GAME_WIDTH / 2,
        120
    );
    const mapWidth = 330;
    const mapHeight = 370;
    const gap = 70;
    const classicX =
        GAME_WIDTH / 2 - mapWidth - gap / 2;
    const rockX =
        GAME_WIDTH / 2 + gap / 2;
    const mapY = 210;
    // =========================
    // MAP CO DIEN
    // =========================
    ctx.fillStyle = "#222";
    ctx.fillRect(
        classicX,
        mapY,
        mapWidth,
        mapHeight
    );
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 5;
    ctx.strokeRect(
        classicX,
        mapY,
        mapWidth,
        mapHeight
    );
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 30px Arial";
    ctx.fillText(
        "MAP CỔ ĐIỂN",
        classicX + mapWidth / 2,
        mapY + 50
    );
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText(
        "Không có đá",
        classicX + mapWidth / 2,
        mapY + 105
    );
    // Ve grid nho minh hoa
    drawMapPreview(
        classicX + 65,
        mapY + 140,
        false
    );
    // =========================
    // MAP DA
    // =========================
    ctx.fillStyle = "#222";
    ctx.fillRect(
        rockX,
        mapY,
        mapWidth,
        mapHeight
    );
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 5;
    ctx.strokeRect(
        rockX,
        mapY,
        mapWidth,
        mapHeight
    );
    ctx.fillStyle = "#ffaa00";
    ctx.font = "bold 30px Arial";
    ctx.fillText(
        "MAP ĐÁ",
        rockX + mapWidth / 2,
        mapY + 50
    );
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText(
        "Có vật cản",
        rockX + mapWidth / 2,
        mapY + 105
    );
    drawMapPreview(
        rockX + 65,
        mapY + 140,
        true
    );
    ctx.restore();
}
function drawMapPreview(x, y, hasRocks) {
    const previewCell = 20;
    const previewSize = 10;
    ctx.save();
    for (let row = 0; row < previewSize; row++) {
        for (let col = 0; col < previewSize; col++) {
            ctx.strokeStyle = "#666";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                x + col * previewCell,
                y + row * previewCell,
                previewCell,
                previewCell
            );
        }
    }
    // O bat dau
    ctx.fillStyle = "lime";
    ctx.fillRect(
        x,
        y,
        previewCell,
        previewCell
    );
    // O ket thuc
    ctx.fillStyle = "red";
    ctx.fillRect(
        x + 9 * previewCell,
        y + 9 * previewCell,
        previewCell,
        previewCell
    );
    if (hasRocks) {
        ctx.fillStyle = "#777";
        for (let rock of MAPS.rock.rocks) {
            ctx.fillRect(
                x + rock.col * previewCell + 3,
                y + rock.row * previewCell + 3,
                previewCell - 6,
                previewCell - 6
            );
        }
    }
    ctx.restore();
}


function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
        masterGain = audioCtx.createGain();
        compressor = audioCtx.createDynamicsCompressor();
        masterGain.gain.value = 0.9;
        compressor.threshold.value = -20;
        compressor.knee.value = 20;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.18;
        masterGain.connect(compressor);
        compressor.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}
// tieng dan ban
let shootSoundCount = 0;
const MAX_SHOOT_SOUND = 3;
function playShootSound() {
    if (!soundEnabled) return;
    if (shootSoundCount >= MAX_SHOOT_SOUND) return;
    shootSoundCount++;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(500, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
        180,
        ctx.currentTime + 0.08
    );
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.08
    );
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.08);
    oscillator.onended = () => {
        shootSoundCount--;
    };
}

// quái chết
let monterDieSoundCount = 0;
const MAX_MONSTER_DIE_SOUND = 3;
function playMonsterDieSound() {
    if (!soundEnabled) return;
    if (monterDieSoundCount >= MAX_MONSTER_DIE_SOUND) return;
    monterDieSoundCount++;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
        60,
        ctx.currentTime + 0.18
    );
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.18
    );
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
    oscillator.onended = () => {
        monterDieSoundCount--;
    }
}

// đặt tháp thành công
function playPlaceTowerSound() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    function heavyHit(time) {
        // Âm trầm giống bước chân nặng
        const lowOsc = ctx.createOscillator();
        const lowGain = ctx.createGain();
        lowOsc.type = "sine";
        lowOsc.frequency.setValueAtTime(110, time);
        lowOsc.frequency.exponentialRampToValueAtTime(
            45,
            time + 0.12
        );
        lowGain.gain.setValueAtTime(6.0, time);
        lowGain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.13
        );
        lowOsc.connect(lowGain);
        lowGain.connect(masterGain);
        lowOsc.start(time);
        lowOsc.stop(time + 0.13);
        const hitOsc = ctx.createOscillator();
        const hitGain = ctx.createGain();
        hitOsc.type = "square";
        hitOsc.frequency.setValueAtTime(260, time);
        hitOsc.frequency.exponentialRampToValueAtTime(
            90,
            time + 0.055
        );
        hitGain.gain.setValueAtTime(0.5, time);
        hitGain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.06
        );
        hitOsc.connect(hitGain);
        hitGain.connect(masterGain);
        hitOsc.start(time);
        hitOsc.stop(time + 0.06);
    }
    heavyHit(ctx.currentTime);
    heavyHit(ctx.currentTime + 0.10);
}

// tieng phep quai ve star
function playSpellSound() {
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    const start = ctx.currentTime;

    function magicSweep(time, startFreq, endFreq, volume) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(
            endFreq,
            time + 0.22
        );
        gain.gain.setValueAtTime(0.02, time);
        gain.gain.exponentialRampToValueAtTime(
            volume,
            time + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(
            0.02,
            time + 0.28
        );
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.28);
    }
    // tieng cheo 1
    magicSweep(start, 280, 1100, 0.07);
    // tieng cheo 2
    magicSweep(start + 0.13, 360, 1450, 0.065);
    // Tieng vong 1
    magicSweep(start + 0.32, 420, 1050, 0.025);
    // Tieng vong 2
    magicSweep(start + 0.48, 500, 1250, 0.012);
}

// Tiếng tia sét
function playLightningSound() {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const start = ctx.currentTime;
    // Tạo tiếng nhiễu điện
    function createNoise(time, duration, volume) {
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        noise.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1800, time);
        filter.frequency.exponentialRampToValueAtTime(
            350,
            time + duration
        );
        filter.Q.value = 0.8;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(volume, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + duration
        );
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(time);
        noise.stop(time + duration);
    }
    // Tạo tiếng nổ trầm
    function thunderBoom(time, frequency, duration, volume) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(frequency, time);
        osc.frequency.exponentialRampToValueAtTime(
            35,
            time + duration
        );
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(
            volume,
            time + 0.01
        );
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + duration
        );
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + duration);
    }
    // Tia điện đầu tiên
    createNoise(start, 0.12, 0.22);
    // Tia điện thứ hai
    createNoise(start + 0.06, 0.18, 0.16);
    // Tiếng nổ trầm
    thunderBoom(start + 0.02, 140, 0.45, 0.18);
    // Tia điện vang phía sau
    createNoise(start + 0.22, 0.28, 0.07);
}

async function keepScreenOn() {
    if (!("wakeLock" in navigator)) {
        alert("trình duyệt ko giữ sáng màng hình. hãy mở bằng google chrome");
        return;
    }
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("bật giữ màng hình sáng");
        wakeLock.addEventListener("release", () => {
            console.log("tắt giữ màng hình sáng");
            wakeLock = null;
            });
        } catch (error) {
            alert("ko bật đc giữ màng hình sáng: " + error.message);
            console.log(error);
        }
}
async function releaseScreenLock() {
    if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
    }
}

canvas.addEventListener("click", function(event){
    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    if (!mapSelected) {
        const mapWidth = 330;
        const mapHeight = 370;
        const gap = 70;
        const classicX =
            GAME_WIDTH / 2 - mapWidth - gap / 2;
        const rockX =
            GAME_WIDTH / 2 + gap / 2;
        const mapY = 210;
        // Bam map co dien
        if (
            mouseX >= classicX &&
            mouseX <= classicX + mapWidth &&
            mouseY >= mapY &&
            mouseY <= mapY + mapHeight
        ) {
            selectMap("classic");
            return;
        }
        // Bam map da
        if (
            mouseX >= rockX &&
            mouseX <= rockX + mapWidth &&
            mouseY >= mapY &&
            mouseY <= mapY + mapHeight
        ) {
            selectMap("rock");
            return;
        }
        // Bam ngoai 2 map thi khong lam gi
        return;
    }
    // Bấm nút xoá và nâng cấp
    if(selectedTowerToDelete){
        if(
            mouseX >= deleteButtonX &&
            mouseX <= deleteButtonX + 50 &&
            mouseY >= deleteButtonY - 30 &&
            mouseY <= deleteButtonY + 20
        ){
            let refund = 5
            for (let i = 1; i < selectedTowerToDelete.level; i++) {
                refund += (i * 20) / 2;
            }
            money += refund;
            amthanhbanthap.currentTime = 0;
            amthanhbanthap.play();
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
            mouseY >= upgradeButtonY - 30 &&
            mouseY <= upgradeButtonY + 20
        ){
            let tower = selectedTowerToDelete;
            if(tower.level >= 5){
                return;
            }
            let cost = tower.level * 20;

            if(money >= cost){
                money -= cost;
                tower.level++;
                amthanhnangcap.currentTime = 0;
                amthanhnangcap.play();
            } else {
                amthanhhettien.currentTime = 0;
                amthanhhettien.play();
            }
            return;
        }
    }
    
    // Bấm nút tháp
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
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 500 && mouseY <= 550){
        selectedTower = "magic";
        if (magicCooldown <= 0) {
            resetAllMonstersToStart();
            magicCooldown = MAGIC_COOLDOWN;
            playSpellSound();
        }
        return;
    }
    if(mouseX >= 950 && mouseX <= 1000 && mouseY >= 570 && mouseY <= 620){
        selectedTower = "damageMagic";
        if (damageMagicCooldown <= 0) {
            damageAllMonsters();
            damageMagicCooldown = DAMAGE_MAGIC_COOLDOWN;
            amthanhphepset.currentTime = 0;
            amthanhphepset.play();
        }
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
            playPlaceTowerSound();
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

function resetAllMonstersToStart() {
    let i = 0;
    for (let monster of monsters) {
        monster.path = findPath(0, 0);
        monster.pathIndex = 1;
        monster.x = START_X + CELL_SIZE / 2;
        monster.y = START_Y + CELL_SIZE / 2 + i * 3;
        i++;
    }
}

function damageAllMonsters() {
    for (let monster of monsters) {
        const percentDamage = monster.hp * 0.35;
        const totalDamage = percentDamage + 5000;
        monster.hp -= totalDamage;
        if (monster.hp <= monster.maxHp * 0.02) {
            monster.hp = 0;
        }
        if (monster.hp < 0){
            monster.hp = 0;
        }
    }
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
}

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

function queueMonster(delay, hp, speed, color, size, kind) {
    pendingSpawns.push({
        spawnAt: gameNow() + delay,
        hp: hp,
        speed: speed,
        color: color,
        size: size,
        kind: kind
    });
}

function processPendingSpawns() {
    for (let i = pendingSpawns.length - 1; i >= 0; i--) {
        let item = pendingSpawns[i];
        if (gameNow() >= item.spawnAt) {
            spawnOneMonster(
                item.hp,
                item.speed,
                item.color,
                item.size,
                item.kind
            );
            pendingSpawns.splice(i, 1);
        }
    }
}

function spawnMonster() {
    let kind = nextMonsters.shift();
    if (kind === "fly") {
        let rate = 1.045 - Math.floor((wave - 1) / 100) * 0.035;
        rate = Math.max(rate, 1.0025);
        let growth = 1;
        for (let i = 1; i < wave; i++) {
            let r = 1.045 - Math.floor((i - 1) / 100) * 0.035;
            r = Math.max(r, 1.0025);
            growth *= r;
        }
        let hp = Math.floor(80 * growth);
        for (let i = 0; i < 5; i++) {
            queueMonster(i * 700, hp, 1.5, "blue", 16, "fly");
        }
    } else if (kind === "bigFly") {
        let rate = 1.05 - Math.floor((wave - 1) / 100) * 0.035;
        rate = Math.max(rate, 1.0035);
        let growth = 1;
        for (let i = 1; i < wave; i++) {
            let r = 1.05 - Math.floor((i - 1) / 100) * 0.035;
            r = Math.max(r, 1.0035);
            growth *= r;
        }
        let hp = Math.floor(200 * growth);
        for (let i = 0; i < 2; i++) {
            queueMonster(i * 700, hp, 1.65, "purple", 24, "bigFly");
        }
    } else if (kind === "split") {
        let hp = Math.floor(200 * Math.pow(1.025, wave - 1));
        for (let i = 0; i < 3; i++) {
            queueMonster(i * 600, hp, 1.2, "red", 12, "split");
        }
    } else if (kind === "splitBig") {
        let hp = Math.floor(800 * Math.pow(1.08, wave - 1));
        spawnOneMonster(hp, 1.35, "purple", 19, "splitBig");

    } else if (kind === "boss") {
        let hp = Math.floor(800 * Math.pow(1.09, wave - 1));
        for (let i = 0; i < 2; i++) {
            queueMonster(i * 400, hp, 2.65, "purple", 15, "boss");
        }
    } else if (kind === "normal") {
        let hp = Math.floor(150 * Math.pow(1.03, wave - 1));
        for (let i = 0; i < 5; i++) {
            queueMonster(i * 400, hp, 2.4, "white", 11, "normal");
        }
    } else if (kind === "thoiBu") {
        let hp = Math.floor(1000 * Math.pow(1.135, wave - 1));
        for (let i = 0; i < 2; i++) {
            queueMonster(i * 550, hp, 1.9, "purple", 16, "thoiBu");
        }
    } else if (kind === "thoi") {
        let hp = Math.floor(200 * Math.pow(1.045, wave - 1));
        for (let i = 0; i < 7; i++) {
            queueMonster(i * 500, hp, 1.7, "yellow", 11, "thoi");
        }
    } else if (kind === "blue") {
        let blueHp = Math.floor(400 * Math.pow(1.06, wave - 1));
        for (let i = 0; i < 2; i++) {
            queueMonster(i * 700, blueHp, 1, "green", 10, "blue");
        }
    } else {
        let hp = Math.floor(2000 * Math.pow(1.18, wave - 1));
        spawnOneMonster(hp, 1.2, "purple", 15, "bigBlue");
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
        if (kind === "boss" || kind === "thoiBu" || kind === "splitBig" || kind === "bigBlue" || kind === "bigFly") {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
        }
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

function moveMonsters(deltaTime) {
    for (let i = monsters.length - 1; i >= 0; i--) {
        let monster = monsters[i];
        if (monster.kind === "fly" || monster.kind === "bigFly") {
            let endX = START_X + (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
            let endY = START_Y + (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
            let dx = endX - monster.x;
            let dy = endY - monster.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let moveSpeed = monster.speed * deltaTime;
            if (distance <= moveSpeed) {
                monsters.splice(i, 1);
                mauNha -= 1;
                if (mauNha <= 0) {
                    gameOver = true;
                    releaseScreenLock();
                }
                continue;
            }
            monster.x += dx / distance * moveSpeed;
            monster.y += dy / distance * moveSpeed;
            continue;
        }
        if (monster.slowUntil > gameNow()) {
        } else {
            monster.speed = monster.normalSpeed;
        }
        if (monster.pathIndex >= monster.path.length - 1) {
            monsters.splice(i, 1);
            mauNha -= 1;
            if (mauNha <= 0) {
                gameOver = true;
                releaseScreenLock();
            }
            continue;
        }
        let nextCell = monster.path[monster.pathIndex + 1];
        let targetX = START_X + nextCell.col * CELL_SIZE + CELL_SIZE / 2;
        let targetY = START_Y + nextCell.row * CELL_SIZE + CELL_SIZE / 2;
        let dx = targetX - monster.x;
        let dy = targetY - monster.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let moveSpeed = monster.speed * deltaTime;
        if (distance < moveSpeed) {
            monster.x = targetX;
            monster.y = targetY;
            monster.pathIndex++;
        } else {
            monster.x += dx / distance * moveSpeed;
            monster.y += dy / distance * moveSpeed;
        }
    }
}

function drawGameOver() {
    if (!gameOver) return;
    // Nền đen mờ phủ toàn màn hình game
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "red";
    ctx.font = "bold 55px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.fillText(
        `Bạn đã vượt qua vòng ${wave}`,
        canvas.width / 2,
        canvas.height / 2
    );
    // Hiện nút chơi lại
    const restartBtn = document.getElementById("restartBtn");
    restartBtn.style.display = "block";
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
    ctx.fillText("Các Phép", 950, 480);
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
    // Nút phép
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 500, 50, 50);
    ctx.fillStyle = "purple";
    ctx.beginPath();
    ctx.arc(975, 525, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(975, 525, 11, 0, Math.PI * 2);
    ctx.stroke();
    if (magicCooldown > 0) {
        ctx.fillStyle = "rgba(50,50,50,0.8)";
        ctx.fillRect(963, 515, 24, 20);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            Math.ceil(magicCooldown),
            975,
            525
        );
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }
    if (selectedTower === "magic") {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 497, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 495, 220, 80);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Đưa tất cả quái về vị trí", 1045, 525);
        ctx.fillText("bắt đầu", 1045, 555);
        ctx.lineWidth = 1;
    }
    // Nút phép sát thương
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(950, 570, 50, 50);
    ctx.fillStyle =
        damageMagicCooldown > 0 ? "#555" : "darkred";
    ctx.fillRect(953, 573, 44, 44);
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(978, 577);
    ctx.lineTo(965, 597);
    ctx.lineTo(974, 597);
    ctx.lineTo(968, 615);
    ctx.lineTo(989, 590);
    ctx.lineTo(980, 590);
    ctx.closePath();
    ctx.fill();
    if (damageMagicCooldown > 0) {
        ctx.fillStyle = "rgba(50,50,50,0.8)";
        ctx.fillRect(963, 585, 24, 20);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            Math.ceil(damageMagicCooldown),
            975,
            595
        );
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }
    if (selectedTower === "damageMagic") {
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(947, 567, 56, 56);
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(1030, 565, 220, 110);
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Tất cả quái bị giảm 35%", 1045, 595);
        ctx.fillText("máu và 5000 sát thương", 1045, 625);
        ctx.fillText("kết liễu quái dưới 2%HP", 1045, 655);
        ctx.lineWidth = 1;
    }
}

let bullets = [];
function towerShoot(){
    let now = gameNow();
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
                if (!isSimulating) {
                    playShootSound();
                }
                tower.lastShot = now;
                    break;
            }
        }
    }
}

function moveBullets(deltaTime = 1) {
    for(let i = bullets.length - 1; i >= 0; i--){
        let bullet = bullets[i];
        if(!monsters.includes(bullet.target)){
            bullets.splice(i, 1);
            continue;
        }
        let dx = bullet.target.x - bullet.x;
        let dy = bullet.target.y - bullet.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let bulletMove = bullet.speed * deltaTime;
        if(dist < bulletMove){
            let affectedMonsters = [];
            if(bullet.type === "poison" || bullet.type === "ice"){
                for(let other of monsters){
                    if ( bullet.type === "poison" && (other.kind === "fly" || other.kind === "bigFly")) {
                        continue;
                    }
                    let dx2 = other.x - bullet.target.x;
                    let dy2 = other.y - bullet.target.y;
                    let dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                    if(dist2 < 100){
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
                    m.slowUntil = gameNow() + 2000;
                }
            }
            bullets.splice(i, 1);
            for(let j = monsters.length - 1; j >= 0; j--){
                if(monsters[j].hp <= 0){
                    if (!isSimulating) {
                        playMonsterDieSound();
                    }
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
            bullet.x += dx / dist * bulletMove;
            bullet.y += dy / dist * bulletMove;
        }
    }
}

function drawBullets(){
    for(let bullet of bullets){
        if (bullet.type === "normal") {
            ctx.fillStyle = "red";
        } else if (bullet.type === "ice") {
            ctx.fillStyle = "white";
        } else if (bullet.type === "poison") {
            ctx.fillStyle = "green";
        } else if (bullet.type === "air") {
            ctx.fillStyle = "blue";
        } else {
            ctx.fillStyle = "yellow";
        }

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

let lastFrameTime = performance.now();
function gameLoop(currentTime) {
    let deltaTime = (currentTime - lastFrameTime) / 16.6667;
    lastFrameTime = currentTime;
    deltaTime = Math.min(deltaTime, 2);

    ctx.fillStyle = "rgb(30,30,30)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!mapSelected) {
        drawMapSelection();
        requestAnimationFrame(gameLoop);
        return;
    }
    // thời gian Hồi Phép
    if (magicCooldown > 0) {
        magicCooldown -= deltaTime / 60;
        if (magicCooldown < 0) {
            magicCooldown = 0;
        }
    }
    if (damageMagicCooldown > 0) {
        damageMagicCooldown -= deltaTime / 60;
        if (damageMagicCooldown < 0) {
            damageMagicCooldown = 0;
        }
    }
    while (!gameOver && gameNow() - lastSpawn >= spawnDelay) {
        spawnMonster();
        lastSpawn += spawnDelay;
    }
    processPendingSpawns();
    moveMonsters(deltaTime);
    if (!gameOver) {
        towerShoot();
        moveBullets(deltaTime);
    }
    let timeLeft = Math.ceil((spawnDelay - (Date.now() - lastSpawn)) / 1000);
    if (timeLeft < 0) timeLeft = 0;
    drawGrid();
    amthanhnhacnen.play();
    drawRocks();
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
        let refund = 5;
        for (let i = 1; i < selectedTowerToDelete.level; i++) {
            refund += (i * 20) / 2;
        }
        ctx.fillStyle = "red";
        ctx.fillRect(deleteButtonX, deleteButtonY - 30, 50, 50);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "14px Arial";
        ctx.fillText("Bán", deleteButtonX + 24, deleteButtonY - 7);
        ctx.font = "12px Arial";
        ctx.fillText(refund + " vàng", deleteButtonX + 24, deleteButtonY + 7);

        let upgradeCost = selectedTowerToDelete.level < 5 ? selectedTowerToDelete.level * 20 : 0;
        ctx.fillStyle = "orange";
        ctx.fillRect(upgradeButtonX, upgradeButtonY - 30, 70, 50);
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText("Nâng Cấp", upgradeButtonX + 34, upgradeButtonY - 7);
        ctx.font = "12px Arial";
        ctx.fillText(selectedTowerToDelete.level < 5 ? upgradeCost + " vàng" : "MAX", upgradeButtonX + 34, upgradeButtonY + 7);

        ctx.textAlign = "left";


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
    if (gameOver) {
        drawGameOver();
        return;
    }
    requestAnimationFrame(gameLoop);
}

prepareNextMonsters();
requestAnimationFrame(gameLoop);

document.addEventListener("pointerdown", () => {
    if (!gameOver && wakeLock === null) {
        keepScreenOn();
    }
});
function simulateHiddenTime(hiddenMilliseconds) {
    const STEP_MS = 100;
    let remaining = hiddenMilliseconds;
    isSimulating = true;
    let oldSoundEnabled = soundEnabled;
    soundEnabled = false;
    simulatedTime = hiddenStartTime;
    while (remaining > 0 && !gameOver) {
        let stepMs = Math.min(STEP_MS, remaining);
        let deltaTime = stepMs / 16.6667;
        simulatedTime += stepMs;
        while (!gameOver && gameNow() - lastSpawn >= spawnDelay) {
            spawnMonster();
            lastSpawn += spawnDelay;
        }
        processPendingSpawns();
        moveMonsters(deltaTime);
        if (!gameOver) {
            towerShoot();
            moveBullets(deltaTime);
        }
        if (mauNha <= 0) {
            mauNha = 0;
            gameOver = true;
            releaseScreenLock();
            break;
        }
        remaining -= stepMs;
    }
    simulatedTime = null;
    soundEnabled = oldSoundEnabled;
    isSimulating = false;
}
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (!gameOver && mapSelected) {
            hiddenStartTime = Date.now();
        }
        return;
    }
    if (
        document.visibilityState === "visible" &&
        hiddenStartTime !== null &&
        !gameOver
    ) {
        let hiddenDuration = Date.now() - hiddenStartTime;
        if (hiddenDuration > 120000) {
            gameOver = true;
            releaseScreenLock();
        } else {
            simulateHiddenTime(hiddenDuration);
        }
        hiddenStartTime = null;
        lastFrameTime = performance.now();
    }
});

const fullscreenBtn = document.getElementById("fullscreenBtn");
fullscreenBtn.addEventListener("click", async () => {
    if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
    } else {
        await document.exitFullscreen();
    }
});

const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", function () {
    location.reload();
});