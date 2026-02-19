// ===== 多言語対応 (i18n) =====

const translations = {
    ja: {
        reset: '最初に戻す',
        input: '入力',
        memo: '📝',
        undoTitle: '元に戻す (Ctrl+Z)',
        redoTitle: 'やり直す (Ctrl+Y)',
        clear: '🎉 クリア！',
        conflictFound: '矛盾が見つかりました！',
        memoDone: '候補をメモしました 📝',
        rocketFilled: '🚀 確定セルを埋めました',
        themeDark: '🌙 ダーク',
        themeLight: '☀️ ライト',
        themeSystem: '🖥️ 端末設定',
        guideMove: '← → ↑ ↓ : セル移動',
        guideNumber: '1〜9 : 数字入力',
        guideDel: 'Del / BS : 消去',
        guideMemo: 'Space : メモ切替',
        guideUndo: 'Ctrl/⌘+Z : 元に戻す',
        guideRedo: 'Ctrl/⌘+Y : やり直す',
        modeInput: '入力モード',
        modeMemo: 'メモモード📝',
    },
    en: {
        reset: 'Reset',
        input: 'Input',
        memo: '📝',
        undoTitle: 'Undo (Ctrl+Z)',
        redoTitle: 'Redo (Ctrl+Y)',
        clear: '🎉 Cleared!',
        conflictFound: 'Conflict found!',
        memoDone: 'Candidates noted 📝',
        rocketFilled: '🚀 Filled certain cells',
        themeDark: '🌙 Dark',
        themeLight: '☀️ Light',
        themeSystem: '🖥️ System',
        guideMove: '← → ↑ ↓ : Move cell',
        guideNumber: '1-9 : Enter number',
        guideDel: 'Del / BS : Delete',
        guideMemo: 'Space : Toggle memo',
        guideUndo: 'Ctrl/⌘+Z : Undo',
        guideRedo: 'Ctrl/⌘+Y : Redo',
        modeInput: 'Input Mode',
        modeMemo: 'Memo Mode 📝',
    }
};

let currentLang = localStorage.getItem('sudoku-lang') || 'ja';

// 翻訳関数
function t(key) {
    return translations[currentLang]?.[key] || translations.ja[key] || key;
}

// 言語をDOMに反映する
function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sudoku-lang', lang);

    // data-i18n 属性を持つ要素のtextContentを更新
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang]?.[key]) {
            el.textContent = translations[lang][key];
        }
    });

    // data-i18n-title 属性を持つ要素のtitleを更新
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[lang]?.[key]) {
            el.title = translations[lang][key];
        }
    });

    // data-i18n-option 属性を持つ<option>のtextContentを更新
    document.querySelectorAll('[data-i18n-option]').forEach(el => {
        const key = el.getAttribute('data-i18n-option');
        if (translations[lang]?.[key]) {
            el.textContent = translations[lang][key];
        }
    });

    // html lang属性を更新
    document.documentElement.lang = lang === 'en' ? 'en' : 'ja';
}

// ===== テーマ切り替え =====

function applyTheme(theme) {
    localStorage.setItem('sudoku-theme', theme);
    if (theme === 'system') {
        // 端末の設定に合わせる
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// システムテーマ変更の監視
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('sudoku-theme') === 'system') {
        applyTheme('system');
    }
});

// 初期化: テーマと言語を適用
(function initSettings() {
    const savedTheme = localStorage.getItem('sudoku-theme') || 'dark';
    const savedLang = localStorage.getItem('sudoku-lang') || 'ja';

    // プルダウンの選択状態を復元
    const themeSelect = document.getElementById('theme-select');
    const langSelect = document.getElementById('lang-select');
    if (themeSelect) themeSelect.value = savedTheme;
    if (langSelect) langSelect.value = savedLang;

    applyTheme(savedTheme);
    applyLanguage(savedLang);

    // イベントリスナー
    themeSelect?.addEventListener('change', (e) => applyTheme(e.target.value));
    langSelect?.addEventListener('change', (e) => applyLanguage(e.target.value));
})();

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
let generationId = 0;      // パズル生成ID（キャンセル検出用）

// Undo/Redo
const MAX_HISTORY = 127;   // 履歴の上限
let undoStack = [];         // Undo用スタック
let redoStack = [];         // Redo用スタック

// 描画キャッシュ
let cells = [];             // セルDOM要素のキャッシュ
let cellStateCache = [];    // 描画状態キャッシュ
let renderPending = false;  // 描画バッチ処理フラグ

// DOM要素
const boardEl = document.getElementById('board');
const memoToggle = document.getElementById('memo-toggle');
const labelInput = document.getElementById('label-input');
const labelMemo = document.getElementById('label-memo');
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
    let attempts = 0;
    const maxAttempts = 1000;
    const startTime = Date.now();
    console.log(`Generating ${difficulty} puzzle...`);


    // 難易度ごとの抜くマス数の範囲（全難易度で共通化）
    const removeRanges = {
        easy: [44, 54],
        medium: [54, 64],
        hard: [54, 64]
    };

    // フォールバック優先度（目標に近い難易度を優先保存）
    // mediumはeasy(Hidden Single)へのフォールバックを許可
    const fallbackRank = {
        easy: { 'basic': 1 },
        medium: { 'easy': 1 },
        hard: { 'medium': 2, 'easy': 1 }
    };

    const difficultyStats = {};
    let bestFallback = null;       // 最も近い難易度のパズルを保存
    let bestFallbackSolution = null; // フォールバック候補の解答
    let bestFallbackRank = 0;

    // 高速タイムアウト: 2秒以内に見つからなければフォールバック
    const fastTimeout = 2000;

    while (attempts < maxAttempts) {
        attempts++;
        const elapsed = Date.now() - startTime;

        // タイムアウト: まずフォールバックパズルがあればそれを返す
        if (elapsed > fastTimeout) {
            if (bestFallback) {
                console.log(`${difficulty} パズル生成: ${elapsed}ms でフォールバック使用 (${attempts}回試行)`);
                solution = bestFallbackSolution;
                return bestFallback;
            }
            // フォールバックもなければさらに探す（最大8秒）
            if (elapsed > 8000) {
                console.warn(`${difficulty} パズルの生成がタイムアウト (${attempts}回試行)`);
                console.log('生成された難易度の分布:', difficultyStats);
                break;
            }
        }

        // 1. 完全な解答を作成
        const completeGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
        solveSudoku(completeGrid);

        // 2. 解答をコピー
        const currentSolution = completeGrid.map(row => [...row]);
        const puzzleGrid = completeGrid.map(row => [...row]);

        // 3. マスを抜く（範囲内でランダム化）
        const [minRemove, maxRemove] = removeRanges[difficulty] || [40, 48];
        let toRemove = minRemove + Math.floor(Math.random() * (maxRemove - minRemove + 1));

        const positions = shuffleArray(
            Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
        );

        for (const [r, c] of positions) {
            if (toRemove <= 0) break;
            const backup = puzzleGrid[r][c];
            puzzleGrid[r][c] = 0;

            const solutions = countSolutions(puzzleGrid.map(row => [...row]), 2);
            if (solutions !== 1) {
                puzzleGrid[r][c] = backup;
            } else {
                toRemove--;
            }
        }

        // 4. 論理ソルバーで難易度判定
        const solver = new SudokuLogicalSolver(puzzleGrid);
        const result = solver.solve();

        // 統計追跡
        const d = result.solved ? result.difficulty : 'unsolved';
        difficultyStats[d] = (difficultyStats[d] || 0) + 1;

        // 完全一致
        if (result.solved && result.difficulty === difficulty) {
            solution = currentSolution;
            return puzzleGrid;
        }
        // フォールバック候補の保存（目標に最も近いものを保持）
        if (result.solved) {
            const rank = (fallbackRank[difficulty] || {})[result.difficulty] || 0;
            if (rank > bestFallbackRank) {
                bestFallbackRank = rank;
                bestFallback = puzzleGrid;
                bestFallbackSolution = currentSolution;
            }
        }
    }

    // 最終フォールバック
    if (bestFallback) {
        console.log(`${difficulty} パズル: フォールバック候補を使用`);
        solution = bestFallbackSolution;
        return bestFallback;
    }

    console.warn(`${difficulty} パズルの生成に失敗。最終フォールバック実行`);
    return generateFallback();
}

// フォールバック: 難易度チェックなしで返す
function generateFallback() {
    const completeGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(completeGrid);
    solution = completeGrid.map(row => [...row]);
    const puzzleGrid = completeGrid.map(row => [...row]);

    const positions = shuffleArray(
        Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
    );
    let toRemove = 40;
    for (const [r, c] of positions) {
        if (toRemove <= 0) break;
        const backup = puzzleGrid[r][c];
        puzzleGrid[r][c] = 0;
        if (countSolutions(puzzleGrid.map(row => [...row]), 2) !== 1) {
            puzzleGrid[r][c] = backup;
        } else {
            toRemove--;
        }
    }
    return puzzleGrid;
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
    updateHighlight();
    scheduleRender();
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
    undoStack = [];
    redoStack = [];
    lastInputNumber = 0;
    messageEl.textContent = '';
    updateUndoRedoButtons();
    renderBoard();
    lastActionWasRocket = false;
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
 * DOM要素を構築する（initGame時に1回だけ）
 */
function buildBoard() {
    boardEl.innerHTML = '';
    cells = [];
    cellStateCache = Array.from({ length: 9 }, () => new Array(9).fill(null));

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
                updateHighlight();
                scheduleRender();
            })(row, col));

            cells[row][col] = cell;
            boardEl.appendChild(cell);
        }
    }
}

// ... (DOM要素の定義など) ...

/**
 * 盤面の表示を更新する（DOM要素は再利用、中身だけ更新）
 * モバイルパフォーマンス最適化: 状態に変更がない場合はDOM操作をスキップする
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
            const memoSet = memos[row][col];

            // 1. クラス名の構築
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

            // 衝突判定は重いので、変更があった場合やエラー表示が必要な場合のみ計算したいが、
            // 盤面全体の整合性は常にチェックする必要があるため、ここは維持。
            // ただし hasConflict 自体は軽量な配列アクセスのみ。
            if (value !== 0 && !givenCells[row][col] && hasConflict(row, col, value)) {
                cls += ' error';
            }

            // 2. メモの署名 (内容 + ハイライト対象)
            // メモの内容が変わっていなくても、targetNumberが変わればハイライトが変わるため、targetNumberも含める
            let memoSig = '';
            if (value === 0 && memoSet.size > 0) {
                // Setの順序は保証されないが、要素が数字のみなのでソートして文字列化
                // メモが頻繁に書き換わることは少ないので、このコストはDOM生成より低い
                memoSig = Array.from(memoSet).sort().join(',') + '|' + targetNumber;
            }

            // 3. 状態の署名を作成 (クラス名 + 値 + メモ署名)
            const newSig = `${cls}|${value}|${memoSig}`;

            // 4. キャッシュと比較 (変更がなければスキップ)
            if (cellStateCache[row][col] === newSig) {
                continue;
            }

            // 5. DOM更新
            cellStateCache[row][col] = newSig;
            cell.className = cls;

            if (value !== 0) {
                if (cell.childElementCount > 0 || cell.textContent !== String(value)) {
                    cell.textContent = value;
                }
            } else if (memoSet.size > 0) {
                // メモの再描画
                // ここはDOM生成コストがかかるが、Diffingにより頻度は激減する
                cell.textContent = '';
                const memoGrid = document.createElement('div');
                memoGrid.className = 'memo-grid';
                for (let n = 1; n <= 9; n++) {
                    const span = document.createElement('span');
                    if (memoSet.has(n)) {
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
    updateKeypadStatus();
}

function updateKeypadStatus() {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = board[r][c];
            if (val >= 1 && val <= 9) {
                counts[val]++;
            }
        }
    }

    document.querySelectorAll('.key-btn').forEach(btn => {
        const num = parseInt(btn.dataset.num);
        if (num) {
            btn.classList.toggle('completed', counts[num] >= 9);
        }
    });
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

function inputNumber(num) {
    if (givenCells[selectedRow][selectedCol]) return;

    // 変更前の状態を保存
    pushUndo();

    if (memoMode) {
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
    lastActionWasRocket = false;

    if (!memoMode && checkWin()) {
        messageEl.textContent = t('clear');
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
    memoToggle.checked = memoMode;
    labelInput.classList.toggle('active', !memoMode);
    labelMemo.classList.toggle('active', memoMode);
    messageEl.textContent = memoMode ? t('modeMemo') : t('modeInput');
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
        const level = btn.dataset.level;

        // 同じ難易度で生成中なら何もしない
        if (btn.classList.contains('generating')) return;

        // 生成IDをインクリメント（前回の生成結果を無効化）
        const thisGenId = ++generationId;

        // ボタン状態を即座に更新
        const allBtns = document.querySelectorAll('.diff-btn');
        allBtns.forEach(b => {
            b.classList.remove('active');
            b.classList.remove('generating');
        });
        btn.classList.add('active');
        btn.classList.add('generating');

        // 二重RAFで描画完了を保証してから同期的な生成を開始
        // 1回目のRAF: DOMの変更がレイアウトに反映される
        // 2回目のRAF: ブラウザが1回目の変更を描画した後に実行される
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // この生成がキャンセルされていないか確認
                if (thisGenId !== generationId) return;

                initGame(level);
                btn.classList.remove('generating');
            });
        });
    });
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('本当に最初の状態に戻しますか？ / Reset to initial state?\n入力した数字やメモはすべて消去されます。\nAll input and memos will be cleared.')) {
        resetBoard();
    }
});

const btnRocket = document.getElementById('btn-rocket');
let lastActionWasRocket = false; // ロケットボタンの連続押下判定用

// ...(中略)...

// ===== Rocket Button Logic =====

function handleRocket() {
    // 0. Undo保存（1ステップとして扱う）
    pushUndo();

    let changesMade = false;
    let conflictFound = false;
    let memoFilled = false;

    // 1. Auto-fill Singles (Loop until no more singles or conflict)
    // ユーザー要望: "確定できるマスが無くなるまで繰り返してください。なお、埋められる数字に矛盾を見つけた場合、そこで処理を終え..."
    // "矛盾"の定義: Solverが矛盾を検知した場合、あるいは候補がないセルが発生した場合。

    // Solverを使って推論
    // 毎回Solverインスタンスを作り直す（現在の盤面状態を反映）
    // ループ制限を設ける（無限ループ防止）
    for (let i = 0; i < 81; i++) {
        const solver = new SudokuLogicalSolver(board); // memosはSolver内で再計算されるので渡さなくて良い（Solverは純粋なロジックで候補を出す）

        // Solverの候補（candidates）と現在のメモ（memos）は別物。
        // Rocketボタンの「確定」は「論理的に1つしか入らない場所」

        // Solverで1ステップ進める（Naked Single + Hidden Single）
        let stepChanged = false;
        if (solver.applyNakedSingle()) stepChanged = true;
        else if (solver.applyHiddenSingle()) stepChanged = true;

        if (stepChanged) {
            changesMade = true;
            // Solverのgrid変更をboardに反映
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] === 0 && solver.grid[r][c] !== 0) {
                        const num = solver.grid[r][c];
                        // 矛盾チェック
                        if (hasConflict(r, c, num)) {
                            conflictFound = true;
                        }
                        board[r][c] = num;
                        memos[r][c].clear();
                        clearRelatedMemos(r, c, num);
                    }
                }
            }
        }

        if (conflictFound || !stepChanged) break;
    }

    if (conflictFound) {
        messageEl.textContent = t('conflictFound');
    }

    // 2. Auto-fill Memos (Conditions: No changes by singles AND previous action was Rocket AND empty cells exist)
    if (!changesMade && !conflictFound && lastActionWasRocket) {
        // メモ含めて何も入力されていないマスが一つでもあった場合 -> 実行
        // 未確定の全てのマスにおいて、そのマスに入りうる数字を全てメモ

        let hasEmptyNoMemo = false;
        let hasEmpty = false;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    hasEmpty = true;
                    if (memos[r][c].size === 0) hasEmptyNoMemo = true;
                }
            }
        }

        if (hasEmptyNoMemo && hasEmpty) {
            const solver = new SudokuLogicalSolver(board);
            // 初期化時点での候補を取得
            // SolverのcandidatesはSetの配列
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] === 0) {
                        // Solverの候補をUIのメモに反映
                        const cands = solver.candidates[r][c];
                        if (cands) {
                            memos[r][c] = new Set(cands);
                        }
                    }
                }
            }
            changesMade = true;
            memoFilled = true;
            messageEl.textContent = t('memoDone');
        }
    }

    // UI更新
    updateHighlight();
    scheduleRender();
    if (checkWin()) {
        messageEl.textContent = '🎉 クリア！';
    } else if (changesMade && !conflictFound && !memoFilled) {
        messageEl.textContent = t('rocketFilled');
    }

    lastActionWasRocket = true; // フラグセット
}



btnRocket.addEventListener('click', () => {
    handleRocket();
    // ボタンのフォーカスを外す（キーボード操作の邪魔にならないように）
    btnRocket.blur();
});

// ===== メモトグルスイッチ =====
memoToggle.addEventListener('change', () => {
    memoMode = memoToggle.checked;
    labelInput.classList.toggle('active', !memoMode);
    labelMemo.classList.toggle('active', memoMode);
    messageEl.textContent = memoMode ? t('modeMemo') : t('modeInput');
});

labelInput.addEventListener('click', () => {
    if (memoMode) toggleMemoMode();
});

labelMemo.addEventListener('click', () => {
    if (!memoMode) toggleMemoMode();
});

// ===== キーパッド入力 =====
document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const num = btn.dataset.num;
        if (num) {
            inputNumber(parseInt(num));
        } else if (btn.id === 'key-delete') {
            clearCell();
        }
        btn.blur();
    });
});

btnUndo.addEventListener('click', () => undo());
btnRedo.addEventListener('click', () => redo());

// ===== ゲーム開始 =====

initGame('hard');
