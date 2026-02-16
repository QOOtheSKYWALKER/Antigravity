// ===== 状態管理 =====

let solution = [];        // 解答盤面
let board = [];            // 現在の盤面
let initialBoard = [];     // 初期盤面（リセット用）
let givenCells = [];       // 初期配置セル（変更不可）
let memos = [];            // メモデータ（各セルにSet型）
let selectedRow = 0;       // 選択中のセル行
let selectedCol = 0;       // 選択中のセル列
let memoMode = false;      // メモモード
let currentDifficulty = 'hard';
let lastInputNumber = 0;   // 直近入力数字（ハイライト用）

// Undo/Redo
const MAX_HISTORY = 127;   // 履歴の上限
let undoStack = [];         // Undo用スタック
let redoStack = [];         // Redo用スタック

// 描画キャッシュ
let cells = [];             // セルDOM要素のキャッシュ
let renderPending = false;  // 描画バッチ処理フラグ

// DOM要素
const boardEl = document.getElementById('board');
const modeDisplay = document.getElementById('mode-display');
const messageEl = document.getElementById('message');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');

// ===== パズル生成 =====

function solveSudoku(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of numbers) {
                    if (isValid(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (solveSudoku(grid)) return true;
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function isValid(grid, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
    }
    for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (grid[r][c] === num) return false;
        }
    }
    return true;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function countSolutions(grid, limit = 2) {
    let count = 0;
    function solve(g) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (g[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValid(g, row, col, num)) {
                            g[row][col] = num;
                            solve(g);
                            if (count >= limit) return;
                            g[row][col] = 0;
                        }
                    }
                    return;
                }
            }
        }
        count++;
    }
    solve(grid);
    return count;
}

function generatePuzzle(difficulty) {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(grid);
    solution = grid.map(row => [...row]);

    const removeCounts = { easy: 35, medium: 45, hard: 55 };
    let toRemove = removeCounts[difficulty] || 55;

    const positions = shuffleArray(
        Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
    );

    for (const [r, c] of positions) {
        if (toRemove <= 0) break;
        const backup = grid[r][c];
        grid[r][c] = 0;
        const testGrid = grid.map(row => [...row]);
        if (countSolutions(testGrid) !== 1) {
            grid[r][c] = backup;
        } else {
            toRemove--;
        }
    }
    return grid;
}

// ===== Undo/Redo =====

/**
 * 現在の状態のスナップショットを作成する
 * メモはArray形式で保存し、Setの生成コストを後回しにする
 */
function createSnapshot(row, col) {
    return {
        board: board.map(r => [...r]),
        memos: memos.map(r => r.map(s => [...s])),
        row: row,
        col: col
    };
}

/**
 * 内容変更の前に呼ぶ。現在の状態をUndoスタックに保存する。
 * ナビゲーション（矢印キー）では呼ばない → undoは意味のある操作単位で行われる
 */
function pushUndo() {
    undoStack.push(createSnapshot(selectedRow, selectedCol));
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
}

/**
 * 選択セルの内容に応じてハイライト対象を更新する
 * ドキュメント入力完了時以外（移動、Undo、クリアなど）は
 * カーソル下の数字をハイライト、なければハイライト解除
 */
function updateHighlight() {
    lastInputNumber = board[selectedRow][selectedCol] !== 0 ? board[selectedRow][selectedCol] : 0;
}

/**
 * Undo: 直前の状態に戻し、変更があったセルへカーソルを移動する
 */
function undo() {
    if (undoStack.length === 0) return;
    // 現在の状態をRedoスタックへ
    redoStack.push(createSnapshot(selectedRow, selectedCol));
    // 復元
    const snap = undoStack.pop();
    board = snap.board;
    memos = snap.memos.map(r => r.map(arr => new Set(arr)));
    selectedRow = snap.row;
    selectedCol = snap.col;
    updateUndoRedoButtons();
    updateHighlight();
    scheduleRender();
}

/**
 * Redo: Undoした操作をやり直し、変更があったセルへカーソルを移動する
 */
function redo() {
    if (redoStack.length === 0) return;
    // 現在の状態をUndoスタックへ
    undoStack.push(createSnapshot(selectedRow, selectedCol));
    // 復元
    const snap = redoStack.pop();
    board = snap.board;
    memos = snap.memos.map(r => r.map(arr => new Set(arr)));
    selectedRow = snap.row;
    selectedCol = snap.col;
    updateUndoRedoButtons();
    updateHighlight();
    scheduleRender();
}
// ...(中略)...
function clearCell() {
    if (givenCells[selectedRow][selectedCol]) return;
    if (board[selectedRow][selectedCol] === 0 && memos[selectedRow][selectedCol].size === 0) return;

    // 変更前の状態を保存
    pushUndo();

    board[selectedRow][selectedCol] = 0;
    memos[selectedRow][selectedCol].clear();
    updateHighlight();
    scheduleRender();
}
// ...(中略)...
function moveCell(direction) {
    let row = selectedRow;
    let col = selectedCol;

    if (direction === 'right') {
        col++;
        if (col > 8) { col = 0; row++; }
        if (row > 8) row = 0;
    } else if (direction === 'left') {
        col--;
        if (col < 0) { col = 8; row--; }
        if (row < 0) row = 8;
    } else if (direction === 'down') {
        row++;
        if (row > 8) { row = 0; col++; }
        if (col > 8) col = 0;
    } else if (direction === 'up') {
        row--;
        if (row < 0) { row = 8; col--; }
        if (col < 0) col = 8;
    }

    selectedRow = row;
    selectedCol = col;

    // 自動確定（Sudoku 2 Feature）
    if (board[row][col] === 0) {
        tryAutoFill(row, col);
    } else {
        updateHighlight();
        scheduleRender();
    }
}

/**
 * Undo/Redoボタンの有効/無効を更新する
 */
function updateUndoRedoButtons() {
    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;
}

/**
 * 盤面を初期状態にリセットする
 */
function resetBoard() {
    board = initialBoard.map(r => [...r]);
    memos = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set())
    );
    fillAllCandidates();
    undoStack = [];
    redoStack = [];
    lastInputNumber = 0;
    messageEl.textContent = '';
    updateUndoRedoButtons();
    renderBoard();
}

// ===== 描画 =====

/**
 * requestAnimationFrameで描画をバッチ処理する
 */
function scheduleRender() {
    if (!renderPending) {
        renderPending = true;
        requestAnimationFrame(() => {
            renderPending = false;
            renderBoard();
        });
    }
}

/**
 * ゲームを初期化する
 */
function initGame(difficulty) {
    currentDifficulty = difficulty;
    messageEl.textContent = '';

    const puzzle = generatePuzzle(difficulty);
    board = puzzle.map(r => [...r]);
    initialBoard = puzzle.map(r => [...r]);
    givenCells = puzzle.map(r => r.map(v => v !== 0));
    memos = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set())
    );

    // 空白セルに候補をすべて埋める (Sudoku 2 Feature)
    fillAllCandidates();

    selectedRow = 0;
    selectedCol = 0;
    lastInputNumber = 0;
    undoStack = [];
    redoStack = [];

    buildBoard();
    renderBoard();
    updateUndoRedoButtons();
}

/**
 * 空白セルに入り得るすべての数字をメモに追加する
 */
function fillAllCandidates() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                const candidates = new Set();
                for (let num = 1; num <= 9; num++) {
                    if (!hasConflict(r, c, num)) {
                        candidates.add(num);
                    }
                }
                memos[r][c] = candidates;
            }
        }
    }
}

/**
 * 自動確定を試みる
 * 1. Naked Single: 候補が1つだけなら確定
 * 2. Hidden Single: 行・列・ブロック内で唯一の候補なら確定
 */
function tryAutoFill(row, col) {
    // 既に数字が入っている場合は何もしない
    if (board[row][col] !== 0) {
        updateHighlight();
        scheduleRender();
        return;
    }

    const memo = memos[row][col];

    // 1. Naked Single
    if (memo.size === 1) {
        const num = [...memo][0];
        inputNumber(num, true);
        return;
    }

    // 2. Hidden Single
    for (const num of memo) {
        if (checkHiddenSingle(row, col, num)) {
            inputNumber(num, true);
            return;
        }
    }

    // 確定できなかった場合
    updateHighlight();
    scheduleRender();
}

/**
 * 指定した数字が、その行・列・ブロック内で唯一このセルにしか候補がないか判定
 */
function checkHiddenSingle(row, col, num) {
    // 行チェック
    let foundInRow = false;
    for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === 0 && memos[row][c].has(num)) {
            foundInRow = true;
            break;
        }
    }
    if (!foundInRow) return true;

    // 列チェック
    let foundInCol = false;
    for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === 0 && memos[r][col].has(num)) {
            foundInCol = true;
            break;
        }
    }
    if (!foundInCol) return true;

    // ブロックチェック
    let foundInBlock = false;
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if ((r !== row || c !== col) && board[r][c] === 0 && memos[r][c].has(num)) {
                foundInBlock = true;
                break;
            }
        }
    }
    if (!foundInBlock) return true;

    return false;
}

/**
 * DOM要素を構築する（initGame時に1回だけ）
 */
function buildBoard() {
    boardEl.innerHTML = '';
    cells = [];

    for (let row = 0; row < 9; row++) {
        cells[row] = [];
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            if (col % 3 === 2 && col !== 8) cell.classList.add('border-right');
            if (row % 3 === 2 && row !== 8) cell.classList.add('border-bottom');

            cell.addEventListener('click', ((r, c) => () => {
                selectedRow = r;
                selectedCol = c;
                // 自動確定 (Sudoku 2 Feature)
                tryAutoFill(r, c);
            })(row, col));

            cells[row][col] = cell;
            boardEl.appendChild(cell);
        }
    }
}

/**
 * 盤面の表示を更新する（DOM要素は再利用、中身だけ更新）
 */
function renderBoard() {
    const selectedVal = board[selectedRow][selectedCol];
    const targetNumber = selectedVal !== 0 ? selectedVal : lastInputNumber;
    const selBoxRow = Math.floor(selectedRow / 3);
    const selBoxCol = Math.floor(selectedCol / 3);

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = cells[row][col];
            const value = board[row][col];

            // クラスを文字列で一括設定（classList操作より高速）
            let cls = 'cell';
            if (col % 3 === 2 && col !== 8) cls += ' border-right';
            if (row % 3 === 2 && row !== 8) cls += ' border-bottom';
            if (givenCells[row][col]) cls += ' given';

            if (row === selectedRow && col === selectedCol) {
                cls += ' selected';
            } else if (row === selectedRow || col === selectedCol ||
                (Math.floor(row / 3) === selBoxRow && Math.floor(col / 3) === selBoxCol)) {
                cls += ' highlighted';
            }

            if (value !== 0 && targetNumber !== 0 && value === targetNumber &&
                !(row === selectedRow && col === selectedCol)) {
                cls += ' same-number';
            }

            if (value !== 0 && !givenCells[row][col] && hasConflict(row, col, value)) {
                cls += ' error';
            }

            cell.className = cls;

            // セル内容の更新
            if (value !== 0) {
                if (cell.childElementCount > 0 || cell.textContent !== String(value)) {
                    cell.textContent = value;
                }
            } else if (memos[row][col].size > 0) {
                cell.textContent = '';
                const memoGrid = document.createElement('div');
                memoGrid.className = 'memo-grid';
                for (let n = 1; n <= 9; n++) {
                    const span = document.createElement('span');
                    if (memos[row][col].has(n)) {
                        span.textContent = n;
                        if (targetNumber !== 0 && n === targetNumber) {
                            span.classList.add('memo-highlight');
                        }
                    }
                    memoGrid.appendChild(span);
                }
                cell.appendChild(memoGrid);
            } else {
                if (cell.textContent !== '' || cell.childElementCount > 0) {
                    cell.textContent = '';
                }
            }
        }
    }
}

// ===== ルールチェック =====

function hasConflict(row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (x !== col && board[row][x] === num) return true;
    }
    for (let x = 0; x < 9; x++) {
        if (x !== row && board[x][col] === num) return true;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (!(r === row && c === col) && board[r][c] === num) return true;
        }
    }
    return false;
}

function checkWin() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== solution[row][col]) return false;
        }
    }
    return true;
}

// ===== 入力処理 =====

function inputNumber(num, forceInput = false) {
    if (givenCells[selectedRow][selectedCol]) return;

    // 変更前の状態を保存
    pushUndo();

    if (memoMode && !forceInput) {
        if (board[selectedRow][selectedCol] !== 0) return;
        const memo = memos[selectedRow][selectedCol];
        if (memo.has(num)) {
            memo.delete(num);
        } else {
            memo.add(num);
        }
    } else {
        board[selectedRow][selectedCol] = num;
        memos[selectedRow][selectedCol].clear();
        if (!hasConflict(selectedRow, selectedCol, num)) {
            clearRelatedMemos(selectedRow, selectedCol, num);
        }
    }

    lastInputNumber = num;
    scheduleRender();

    if ((!memoMode || forceInput) && checkWin()) {
        messageEl.textContent = '🎉 クリア！';
    }
}

function clearRelatedMemos(row, col, num) {
    for (let c = 0; c < 9; c++) {
        if (c !== col) memos[row][c].delete(num);
    }
    for (let r = 0; r < 9; r++) {
        if (r !== row) memos[r][col].delete(num);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if (r !== row || c !== col) memos[r][c].delete(num);
        }
    }
}

function toggleMemoMode() {
    memoMode = !memoMode;
    modeDisplay.textContent = memoMode ? 'メモモード' : '入力モード';
    modeDisplay.className = memoMode ? 'mode-display memo-on' : 'mode-display';
}



// ===== キーボード操作 =====

document.addEventListener('keydown', (e) => {
    // Undo: Ctrl+Z / Cmd+Z
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
    }
    // Redo: Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
        return;
    }

    if (e.key === 'ArrowUp') { e.preventDefault(); moveCell('up'); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveCell('down'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveCell('left'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); moveCell('right'); }
    else if (e.key >= '1' && e.key <= '9') { inputNumber(parseInt(e.key)); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); clearCell(); }
    else if (e.code === 'Space' || e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMemoMode(); }
});

// ===== ボタンイベント =====

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        initGame(btn.dataset.level);
    });
});

document.getElementById('btn-new').addEventListener('click', () => {
    initGame(currentDifficulty);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('本当に最初の状態に戻しますか？\n入力した数字やメモはすべて消去されます。')) {
        resetBoard();
    }
});

btnUndo.addEventListener('click', () => undo());
btnRedo.addEventListener('click', () => redo());

// ===== ゲーム開始 =====

initGame('hard');
