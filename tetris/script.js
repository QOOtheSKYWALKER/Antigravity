const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

context.scale(20, 20);
nextContext.scale(20, 20);

// 盤面の背景とグリッドを描画
function drawBackground(ctx, width, height) {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, width, height);

    // グリッド線の描画
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';

    ctx.beginPath();
    // 縦線
    for (let x = 1; x < 12; x++) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 20);
    }
    // 横線
    for (let y = 1; y < 20; y++) {
        ctx.moveTo(0, y);
        ctx.lineTo(12, y);
    }
    ctx.stroke();
}

// 1ライン消去時の処理
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

// 衝突判定
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 盤面データの作成
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// テトリミノ（ブロック）の形状と色の定義
function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

// 描画メイン
function draw() {
    drawBackground(context, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 }, context);
    drawMatrix(player.matrix, player.pos, context);
}

// 各マトリックス（ブロックや盤面）を描画
const colors = [
    null,
    '#00f0f0', // I
    '#f0a000', // L
    '#0000f0', // J
    '#f0f000', // O
    '#f00000', // Z
    '#00f000', // S
    '#a000f0', // T
];

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ブロック本体
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

                // 縁取り（より立体的に見せる）
                ctx.lineWidth = 0.05;
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// 盤面とプレイヤーデータの合体
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 回転処理
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// プレイヤーのドロップ
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// プレイヤーのハードドロップ（一気に下まで）
function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--; // 衝突したので1つ戻す
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

// プレイヤーの移動
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// プレイヤーのリセット（新しいブロックの生成）
function playerReset() {
    const pieces = 'ILJOTSZ';
    if (player.next === null) {
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    player.matrix = player.next;
    player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);

    // 次のブロックのプレビュー描画
    drawNext();

    if (collide(arena, player)) {
        // ゲームオーバー：盤面をクリア
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

// プレイヤーの回転
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// スコア表示の更新
function updateScore() {
    document.getElementById('score').innerText = player.score;
}

// 次のブロックのプレビュー描画
function drawNext() {
    drawBackground(nextContext, nextCanvas.width, nextCanvas.height);
    const offset = {
        x: (nextCanvas.width / 40) - (player.next[0].length / 2),
        y: (nextCanvas.height / 40) - (player.next.length / 2)
    };
    drawMatrix(player.next, offset, nextContext);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// アニメーションループ
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

const arena = createMatrix(12, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    next: null,
    score: 0,
};

// 操作系
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerHardDrop();
    } else if (event.keyCode === 38) { // Up (Rotate)
        playerRotate(1);
    }
});

playerReset();
updateScore();
update();
