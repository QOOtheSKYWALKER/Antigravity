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
        confirmReset: '現在の盤面をリセットしますか？',
        resetConfirmTitle: '確認',
        yes: 'はい',
        no: 'いいえ',
        importOcr: '📷 取込',
        ocrTitle: '📷 画像から盤面を読み込む',
        ocrDropText: 'ここに数独の画像（スクショ等）をドラッグ＆ドロップ',
        ocrClickText: 'またはクリックしてファイルを選択',
        ocrAnalyzeBtn: '解析開始 (OCR)',
        ocrStatusLoaded: '画像がロードされました。解析を開始してください。',
        ocrStatusLoading: 'Tesseract.js OCRエンジンをロード中...',
        ocrStatusExtracting: '81マスを個別に解析中...',
        ocrStatusSuccess: '解析完了！',
        ocrStatusError: '画像処理または解析中にエラーが発生しました。',
        ocrCorrectionTitle: '認識エラー',
        ocrCorrectionDesc: 'このマスの数字は何ですか？',
        ocrCorrectionSubmit: '確定 (Enter)',
        ocrCorrectionSkip: '空マスにする (Esc)',
        ocrInvalidBoard: '認識された盤面が不正か、唯一解を持ちません。手動で修正してください。',
        ocrValidBoard: '✅ 解析成功！'
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
        confirmReset: 'Reset the current board?',
        resetConfirmTitle: 'Confirm',
        yes: 'Yes',
        no: 'No',
        importOcr: '📷 Scan',
        ocrTitle: '📷 Load Board from Image',
        ocrDropText: 'Drag & Drop a Sudoku image (screenshot) here',
        ocrClickText: 'or click to select a file',
        ocrAnalyzeBtn: 'Start Analysis (OCR)',
        ocrStatusLoaded: 'Image loaded. Waiting for analysis.',
        ocrStatusLoading: 'Loading Tesseract.js OCR engine...',
        ocrStatusExtracting: 'Analyzing 81 cells individually...',
        ocrStatusSuccess: 'Analysis Complete!',
        ocrStatusError: 'An error occurred during image processing or analysis.',
        ocrCorrectionTitle: 'Recognition Error',
        ocrCorrectionDesc: 'What is the number in this cell?',
        ocrCorrectionSubmit: 'Submit (Enter)',
        ocrCorrectionSkip: 'Leave Empty (Esc)',
        ocrInvalidBoard: 'The recognized board is invalid or has no unique solution. Please correct manually.',
        ocrValidBoard: '✅ Analysis Successful!'
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
let currentTechnique = ''; // 現在のパズルの最高難易度テクニック
let lastActionWasRocket = false; // ロケットボタンの連続押下判定用

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

function initGame(difficulty) {
    currentDifficulty = difficulty;

    // UI: Set active button immediately (no generating state)
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level === difficulty) {
            btn.classList.add('active');
        }
    });

    // 同期処理でパズルを即座に生成
    const result = SudokuLogicalSolver.generatePuzzle(difficulty);

    solution = result.solution;
    board = result.puzzle.map(r => [...r]);
    initialBoard = result.puzzle.map(r => [...r]);
    givenCells = result.puzzle.map(r => r.map(v => v !== 0));
    memos = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set())
    );

    // Reset Game State
    selectedRow = 0;
    selectedCol = 0;
    lastInputNumber = 0;
    undoStack = [];
    redoStack = [];

    currentTechnique = result.technique;
    messageEl.textContent = '🧠 ' + currentTechnique;
    updateUndoRedoButtons();
    renderBoard();
    lastActionWasRocket = false;
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
    messageEl.textContent = '🧠 ' + currentTechnique;
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

        // 同じ難易度で既にアクティブなら何もしない
        initGame(level);
    });
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm(t('confirmReset'))) {
        resetBoard();
    }
});

const btnRocket = document.getElementById('btn-rocket');

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

        if (hasEmpty) {
            const solver = new SudokuLogicalSolver(board);
            // 最初からLocked Candidatesを適用して除外できる候補を減らしておく
            solver.applyLockedCandidates();

            if (hasEmptyNoMemo) {
                // メモが空のマスが1つでもあれば、全空きマスに対して一括入力
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (board[r][c] === 0) {
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
            } else {
                // 全てのマスにメモが入っている場合、確定マスから類推した論理的候補とIntersectしてトリミングする
                let memoRemoved = false;
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (board[r][c] === 0) {
                            const validCands = solver.candidates[r][c];
                            const currentMemo = memos[r][c];
                            for (const val of currentMemo) {
                                if (!validCands.has(val)) {
                                    currentMemo.delete(val);
                                    memoRemoved = true;
                                }
                            }
                        }
                    }
                }

                if (memoRemoved) {
                    changesMade = true;
                    memoFilled = true;
                    messageEl.textContent = '🧠 Locked Candidates';
                }
            }
        }
    }

    // UI更新
    updateHighlight();
    scheduleRender();
    if (checkWin()) {
        messageEl.textContent = t('clear');
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

buildBoard();
initGame('hard');

// ============================================================================
// OCR Module Integration (Ported from sudoku2)
// ============================================================================

const btnOcrOpen = document.getElementById('btn-ocr-open');
const btnOcrClose = document.getElementById('btn-ocr-close');
const ocrModal = document.getElementById('ocr-main-modal');

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const mainCanvas = document.getElementById('main-canvas');
const cellsContainer = document.getElementById('cells-container');
const btnAnalyze = document.getElementById('btn-analyze');
const ocrResult = document.getElementById('ocr-result');
const ocrStatus = document.getElementById('ocr-status');
const progressBar = document.getElementById('ocr-progress-bar');
const progressFill = document.getElementById('ocr-progress-fill');

let uploadedImage = null;
let cellCanvases = [];
let manualCorrectionCache = [];

// OCRモーダルの開閉
btnOcrOpen.addEventListener('click', () => {
    ocrModal.style.display = 'flex';
    document.getElementById('ocr-main-modal').querySelector('h2').textContent = t('ocrTitle');
    uploadZone.querySelectorAll('p')[0].textContent = t('ocrDropText');
    uploadZone.querySelectorAll('p')[1].textContent = t('ocrClickText');
    btnAnalyze.textContent = t('ocrAnalyzeBtn');
    if (!uploadedImage) {
        ocrStatus.textContent = '';
    } else {
        ocrStatus.textContent = t('ocrStatusLoaded');
    }

    // Document elements for the correction modal
    document.querySelector('.ocr-correction-box h3').textContent = t('ocrCorrectionTitle');
    document.querySelector('.ocr-correction-box p').textContent = t('ocrCorrectionDesc');
    document.getElementById('modal-btn-submit').textContent = t('ocrCorrectionSubmit');
    document.getElementById('modal-btn-skip').textContent = t('ocrCorrectionSkip');
});

btnOcrClose.addEventListener('click', () => {
    ocrModal.style.display = 'none';
});

// ファイル読み込み処理
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;

            // キャンバスに全体画像を描画
            const ctx = mainCanvas.getContext('2d');
            mainCanvas.width = img.width;
            mainCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            btnAnalyze.disabled = false;
            ocrStatus.textContent = t('ocrStatusLoaded');
            ocrResult.textContent = '';
            progressBar.style.display = 'none';
            cellsContainer.innerHTML = '';
            cellCanvases = [];
            manualCorrectionCache = [];
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// イベントリスナー（アップロード関連）
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

uploadZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

/**
 * 画像の前処理と81分割（OpenCV.js使用）
 */
function processImageWithOpenCV() {
    return new Promise((resolve, reject) => {
        try {
            let src = cv.imread(mainCanvas);
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

            let isDarkMode = false;
            let meanVal = cv.mean(gray);
            if (meanVal[0] < 128) {
                isDarkMode = true;
            }

            let blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

            let thresh = new cv.Mat();
            if (isDarkMode) {
                cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, -2);
            } else {
                cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
            }

            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            let maxArea = 0;
            let maxContourIndex = -1;
            for (let i = 0; i < contours.size(); ++i) {
                let cnt = contours.get(i);
                let area = cv.contourArea(cnt);
                if (area > maxArea) {
                    maxArea = area;
                    maxContourIndex = i;
                }
            }

            if (maxContourIndex === -1) {
                throw new Error("盤面の輪郭が見つかりませんでした。");
            }

            let cnt = contours.get(maxContourIndex);
            let rect = cv.boundingRect(cnt);

            let boardMat = src.roi(rect);

            cellsContainer.innerHTML = '';
            cellCanvases = [];

            let cellWidth = boardMat.cols / 9;
            let cellHeight = boardMat.rows / 9;

            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    let cellRect = new cv.Rect(
                        Math.round(col * cellWidth),
                        Math.round(row * cellHeight),
                        Math.round(cellWidth),
                        Math.round(cellHeight)
                    );

                    let cellMat = boardMat.roi(cellRect);
                    let processedCell = preprocessCell(cellMat, isDarkMode);

                    let canvas = document.createElement('canvas');
                    canvas.width = processedCell.mat.cols;
                    canvas.height = processedCell.mat.rows;
                    cv.imshow(canvas, processedCell.mat);
                    canvas.dataset.hasDigit = processedCell.hasDigit;

                    cellsContainer.appendChild(canvas);
                    cellCanvases.push(canvas);

                    processedCell.mat.delete();
                    cellMat.delete();
                }
            }

            src.delete(); gray.delete(); blurred.delete(); thresh.delete();
            contours.delete(); hierarchy.delete(); boardMat.delete();

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function preprocessCell(cellMat, isDarkMode) {
    let gray = new cv.Mat();
    cv.cvtColor(cellMat, gray, cv.COLOR_RGBA2GRAY, 0);

    let thresh = new cv.Mat();
    if (isDarkMode) {
        cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    } else {
        cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
    }

    let labels = new cv.Mat();
    let stats = new cv.Mat();
    let centroids = new cv.Mat();
    let nLabels = cv.connectedComponentsWithStats(thresh, labels, stats, centroids);

    let maxArea = 0;
    let bestRect = null;

    for (let i = 1; i < nLabels; i++) {
        let left = stats.intAt(i, cv.CC_STAT_LEFT);
        let top = stats.intAt(i, cv.CC_STAT_TOP);
        let width = stats.intAt(i, cv.CC_STAT_WIDTH);
        let height = stats.intAt(i, cv.CC_STAT_HEIGHT);
        let area = stats.intAt(i, cv.CC_STAT_AREA);

        let isTouchingBorder = (left <= 1 || top <= 1 || (left + width) >= thresh.cols - 1 || (top + height) >= thresh.rows - 1);

        if (!isTouchingBorder) {
            if (area > maxArea) {
                maxArea = area;
                bestRect = new cv.Rect(left, top, width, height);
            }
        }
    }

    let output = new cv.Mat.ones(thresh.rows, thresh.cols, cv.CV_8UC1);
    output.setTo(new cv.Scalar(255));

    let hasDigit = false;

    if (bestRect && maxArea > (thresh.rows * thresh.cols * 0.005)) {
        hasDigit = true;
        let digitROI = thresh.roi(bestRect);
        let targetX = Math.floor((output.cols - bestRect.width) / 2);
        let targetY = Math.floor((output.rows - bestRect.height) / 2);
        let targetRect = new cv.Rect(targetX, targetY, bestRect.width, bestRect.height);

        let processedDigit = new cv.Mat();
        cv.bitwise_not(digitROI, processedDigit);
        processedDigit.copyTo(output.roi(targetRect));

        processedDigit.delete();
        digitROI.delete();
    }

    gray.delete(); thresh.delete();
    labels.delete(); stats.delete(); centroids.delete();

    return { mat: output, hasDigit: hasDigit };
}

// 対話的エラー修正モーダルのPromiseラッパー
function showModalPrompt(canvas) {
    return new Promise((resolve) => {
        const modal = document.getElementById('ocr-correction-modal');
        const img = document.getElementById('modal-cell-image');
        const input = document.getElementById('modal-digit-input');
        const btnSubmit = document.getElementById('modal-btn-submit');
        const btnSkip = document.getElementById('modal-btn-skip');

        img.src = canvas.toDataURL('image/png');
        input.value = '';

        modal.style.display = 'flex';
        input.focus();

        const cleanupAndResolve = (value) => {
            modal.style.display = 'none';
            btnSubmit.removeEventListener('click', onSubmit);
            btnSkip.removeEventListener('click', onSkip);
            input.removeEventListener('keydown', onKeydown);
            resolve(value);
        };

        const onSubmit = () => {
            const val = parseInt(input.value);
            if (!isNaN(val) && val >= 1 && val <= 9) {
                cleanupAndResolve(val);
            } else {
                input.focus();
            }
        };

        const onSkip = () => {
            cleanupAndResolve(0);
        };

        const onKeydown = (e) => {
            if (e.key === 'Enter') {
                onSubmit();
            } else if (e.key === 'Escape') {
                onSkip();
            }
        };

        btnSubmit.addEventListener('click', onSubmit);
        btnSkip.addEventListener('click', onSkip);
        input.addEventListener('keydown', onKeydown);
    });
}

// OCR解析 
btnAnalyze.addEventListener('click', async () => {
    btnAnalyze.disabled = true;
    ocrStatus.style.color = '#ffcc00';
    ocrStatus.textContent = t('ocrStatusLoading');
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    ocrResult.style.display = 'block';
    ocrResult.textContent = 'OpenCV Processing...';

    try {
        if (typeof cv === 'undefined') {
            throw new Error('OpenCV.js is not loaded yet.');
        }

        await processImageWithOpenCV();

        const gridResult = [];

        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR
        });

        ocrStatus.textContent = t('ocrStatusExtracting');
        ocrResult.textContent = 'Tesseract OCR Started...';

        for (let i = 0; i < 81; i++) {
            const canvas = cellCanvases[i];
            const definitelyHasDigit = canvas.dataset.hasDigit === 'true';

            const ret = await worker.recognize(canvas);
            const text = ret.data.text.trim();

            let num = text.length > 0 && !isNaN(parseInt(text)) ? parseInt(text) : 0;

            if (definitelyHasDigit && num === 0) {
                canvas.style.border = '3px solid #ff0000';

                let matchedNumber = null;
                if (manualCorrectionCache.length > 0) {
                    let currentMat = cv.imread(canvas);
                    cv.cvtColor(currentMat, currentMat, cv.COLOR_RGBA2GRAY, 0);

                    for (const cache of manualCorrectionCache) {
                        let result = new cv.Mat();
                        cv.matchTemplate(currentMat, cache.mat, result, cv.TM_CCOEFF_NORMED);
                        let minMax = cv.minMaxLoc(result);

                        if (minMax.maxVal > 0.95) {
                            matchedNumber = cache.digit;
                            console.log(`Matched cached digit ${matchedNumber} with confidence ${minMax.maxVal}`);
                            result.delete();
                            break;
                        }
                        result.delete();
                    }
                    currentMat.delete();
                }

                if (matchedNumber !== null) {
                    num = matchedNumber;
                } else {
                    num = await showModalPrompt(canvas);

                    if (num !== 0) {
                        let cacheMat = cv.imread(canvas);
                        cv.cvtColor(cacheMat, cacheMat, cv.COLOR_RGBA2GRAY, 0);
                        manualCorrectionCache.push({ mat: cacheMat, digit: num });
                    }
                }

                canvas.style.border = '1px solid var(--border-color)';
            }

            gridResult.push(num);
            progressFill.style.width = `${Math.round(((i + 1) / 81) * 100)}%`;
        }

        ocrStatus.style.color = '#66ffaa';
        ocrStatus.textContent = t('ocrStatusSuccess');

        await worker.terminate();

        // ----------------------------------------------------
        // Phase 3: メインUIのソルバーに渡して盤面を構築する
        // ----------------------------------------------------
        ocrResult.textContent = 'Validating Solvability...';

        ocrResult.textContent = 'Validating Solvability...';

        // 1次元配列を2次元配列に変換
        const grid2D = [];
        for (let r = 0; r < 9; r++) {
            grid2D.push(gridResult.slice(r * 9, r * 9 + 9));
        }

        // 初期盤面のルール違反（行・列・ブロック内の重複）がないかチェック
        let isRuleValid = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const num = grid2D[r][c];
                if (num !== 0) {
                    grid2D[r][c] = 0; // 一旦空にする
                    if (!SudokuLogicalSolver.isValid(grid2D, r, c, num)) {
                        isRuleValid = false;
                    }
                    grid2D[r][c] = num; // 戻す
                }
            }
        }

        // 唯一解を持つかどうかの検証
        let hasUniqueSolution = false;
        if (isRuleValid) {
            // grid2Dをコピーして渡す（solveメソッドが盤面を破壊する可能性があるため）
            const gridCopy = grid2D.map(row => [...row]);
            const solutionsCount = SudokuLogicalSolver.countSolutions(gridCopy, 2);
            hasUniqueSolution = (solutionsCount === 1);
        }

        if (isRuleValid && hasUniqueSolution) {
            // 難易度（テクニック）判定のために論理ソルバーを回す
            const solver = new SudokuLogicalSolver(grid2D);
            const result = solver.solve(); // 人間的ロジックで解ける限界まで解く

            // 最終解答を生成して保存しておく
            const solutionGrid = grid2D.map(row => [...row]);
            SudokuLogicalSolver.solveSudoku(solutionGrid);
            solution = solutionGrid;

            // 解析完了：UIの盤面を初期化してモーダルを閉じる
            ocrResult.textContent = t('ocrValidBoard');

            // 盤面データをメインアプリの変数に適用
            initialBoard = grid2D.map(row => [...row]);
            board = grid2D.map(row => [...row]);
            givenCells = grid2D.map(row => row.map(v => v !== 0));

            // ゲームステートのリセット
            memos = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
            undoStack = [];
            redoStack = [];
            selectedRow = 0;
            selectedCol = 0;
            lastInputNumber = 0;
            lastActionWasRocket = false;

            // スキルレベルを表示 (論理ソルバーで解けた場合はそのスキル、解けなかった場合は 'Extreme (Manual Logic Failed)' など)
            const techLevel = result.solved ? result.technique : 'Extreme';
            messageEl.textContent = '🧠 ' + techLevel;
            currentTechnique = techLevel;

            // モーダルを閉じて画面を再描画
            setTimeout(() => {
                ocrModal.style.display = 'none';
                renderBoard();
                updateUndoRedoButtons();
            }, 500);

        } else {
            let errorMsg = !isRuleValid
                ? '盤面にルール違反（同じ列・行・ブロックに重複）があります。'
                : '問題が複数解を持つか、解が存在しません。';

            ocrResult.textContent = t('ocrInvalidBoard') + '\n詳細: ' + errorMsg + '\n\n' + JSON.stringify(grid2D);
            ocrResult.style.color = '#ff6666';
        }

    } catch (err) {
        console.error(err);
        ocrStatus.style.color = '#ff6666';
        ocrStatus.textContent = t('ocrStatusError');
        ocrResult.textContent = err.toString();
        progressBar.style.display = 'none';
    } finally {
        btnAnalyze.disabled = false;
    }
});
