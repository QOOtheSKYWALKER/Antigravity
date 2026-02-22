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
        ocrValidBoard: '✅ 解析成功！',
        ocrErrorTotalMsg1: '⚠️ 認識できませんでした。',
        ocrErrorTotalReason1: 'スクリーンショットですか？（斜めから撮ったカメラ写真は認識しません）',
        ocrErrorTotalReason2: 'ライトモードですか？（ダークモードは失敗しやすいです）',
        ocrErrorTotalHint: '💡 ここに別の画像を再ドロップ、またはクリック',
        ocrSuccessMsg: '正常に完了しました！',
        ocrPlayBtn: 'PLAY (ゲーム開始)',
        ocrPartialFailMsg: 'いくつか認識できないマスがありました。',
        ocrInputBtn: '入力する',
        ocrManualWarning1: '解析した盤面になにか間違いがあるようです（重複ルール違反、または解が存在しません）。',
        ocrManualWarning2: '間違っている数字をタップして修正してください！',
        ocrManualPlayBtn: 'PLAY (再検証して開始)'
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
        ocrValidBoard: '✅ Analysis Successful!',
        ocrErrorTotalMsg1: '⚠️ Could not read the image.',
        ocrErrorTotalReason1: 'Is it a screenshot? (Photos taken at an angle might fail)',
        ocrErrorTotalReason2: 'Is it in light mode? (Dark mode is less reliable)',
        ocrErrorTotalHint: '💡 Drop another image here, or click to browse',
        ocrSuccessMsg: 'Analysis Successful!',
        ocrPlayBtn: 'PLAY (Start Game)',
        ocrPartialFailMsg: 'Some cells could not be recognized.',
        ocrInputBtn: 'Start Input',
        ocrManualWarning1: 'The analyzed board seems to have rule violations or no unique solution.',
        ocrManualWarning2: 'Tap the incorrect numbers to fix them!',
        ocrManualPlayBtn: 'PLAY (Re-verify & Start)'
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
    if (!difficulty) {
        console.warn('initGame called without difficulty. Skipping generation.');
        return;
    }

    // 選択された難易度をローカルストレージに保存
    localStorage.setItem('sudoku-difficulty', difficulty);

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
const savedDifficulty = localStorage.getItem('sudoku-difficulty') || 'easy';
initGame(savedDifficulty);

// ============================================================================
// OCR Module Integration (Ported from sudoku2)
// ============================================================================

const btnOcrOpen = document.getElementById('btn-ocr-open');
const btnOcrClose = document.getElementById('btn-ocr-close');
const ocrModal = document.getElementById('ocr-main-modal');

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const mainCanvas = document.getElementById('main-canvas');

const ocrStatus = document.getElementById('ocr-status');
const progressBar = document.getElementById('ocr-progress-bar');
const progressFill = document.getElementById('ocr-progress-fill');

let uploadedImage = null;
let cellCanvases = [];
let manualCorrectionCache = [];

let ocrLibrariesLoaded = false;

function loadOcrLibraries() {
    return new Promise((resolve, reject) => {
        if (ocrLibrariesLoaded) {
            resolve();
            return;
        }

        let loadedCount = 0;
        const totalLibs = 2; // opencv and tesseract

        const checkReady = () => {
            loadedCount++;
            if (loadedCount === totalLibs) {
                // OpenCV is async WASM; its variables might take a split second to fully bind after script loads.
                const checkCvReady = setInterval(() => {
                    if (typeof cv !== 'undefined' && cv.Mat) {
                        clearInterval(checkCvReady);
                        ocrLibrariesLoaded = true;
                        resolve();
                    }
                }, 100);
            }
        };

        const scriptCv = document.createElement('script');
        scriptCv.src = 'lib/opencv.js';
        scriptCv.async = true;
        scriptCv.onload = checkReady;
        scriptCv.onerror = reject;
        document.head.appendChild(scriptCv);

        const scriptTess = document.createElement('script');
        scriptTess.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        scriptTess.async = true;
        scriptTess.onload = checkReady;
        scriptTess.onerror = reject;
        document.head.appendChild(scriptTess);
    });
}

// OCRモーダルの開閉
btnOcrOpen.addEventListener('click', async () => {
    // 1. まず即座にモーダルを表示する
    ocrModal.style.display = 'flex';
    document.getElementById('ocr-main-modal').querySelector('h2').textContent = t('ocrTitle');
    uploadZone.querySelectorAll('p')[0].textContent = t('ocrDropText');
    uploadZone.querySelectorAll('p')[1].textContent = t('ocrClickText');

    // UIの初期表示制御
    document.getElementById('ocr-loading-spinner').style.display = 'flex';
    uploadZone.style.display = 'none';
    document.querySelector('.ocr-canvas-container').style.display = 'none';
    document.querySelector('.ocr-progress-container').style.display = 'none';
    hideAllOcrStates();

    // 常にまっさらな状態からスタートさせる
    uploadedImage = null;
    fileInput.value = '';

    // Document elements for the correction modal (ここも先に翻訳を反映)
    document.querySelector('.ocr-correction-title-text').textContent = t('ocrCorrectionTitle');
    document.querySelector('.ocr-correction-box p').textContent = t('ocrCorrectionDesc');
    document.getElementById('modal-btn-submit').textContent = t('ocrCorrectionSubmit');
    document.getElementById('modal-btn-skip').textContent = t('ocrCorrectionSkip');

    // 2. バックグラウンドでライブラリをロードする
    try {
        await loadOcrLibraries();
        document.getElementById('ocr-loading-spinner').style.display = 'none';
        uploadZone.style.display = 'block';
    } catch (err) {
        alert("OCRライブラリの読み込みに失敗しました。ネットワークを確認してください。");
        ocrModal.style.display = 'none';
    }
});

btnOcrClose.addEventListener('click', () => {
    ocrModal.style.display = 'none';
});

// クリップボードからの「ペースト」対応（PC/スマホ）
document.addEventListener('paste', (e) => {
    // モーダルが開いていない場合は無視
    if (ocrModal.style.display === 'none' || !ocrModal.style.display) return;
    // スピナー表示中（準備前）はブロック
    if (document.getElementById('ocr-loading-spinner').style.display !== 'none') return;

    // クリップボードアイテムの中に画像があればキャッチして処理
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image/') !== -1) {
            const file = item.getAsFile();
            if (file) {
                e.preventDefault();
                handleFile(file);
                break;
            }
        }
    }
});

// モバイル向け：明示的なボタンからクリップボードを読み込む
document.getElementById('btn-paste').addEventListener('click', async (e) => {
    e.stopPropagation(); // 親要素(upload-zone)のクリックによるファイル選択ダイヤログ表示を防ぐ
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
            for (const imageType of imageTypes) {
                const blob = await clipboardItem.getType(imageType);
                const file = new File([blob], "pasted-image.png", { type: imageType });
                handleFile(file);
                return;
            }
        }
        alert("クリップボードに画像が見つかりませんでした。");
    } catch (err) {
        console.error("Paste error:", err);
        alert("クリップボードへのアクセスが許可されていないか、対応していないブラウザです。「Ctrl+V」や長押しでのペーストをお試しください。");
    }
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

            ocrStatus.textContent = t('ocrStatusLoaded');

            cellCanvases = [];
            manualCorrectionCache = [];

            // 新レイアウト用の表示切り替え
            document.querySelector('.ocr-canvas-container').style.display = 'flex';
            document.querySelector('.ocr-progress-container').style.display = 'block';

            // 画像ロード直後に全自動で解析スタート！(Phase 7)
            startOCRAnalysis();
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

            // 1. 適応的2値化（反転）
            // 局所的な明るさの差を拾うため、ダークモードの暗い枠線も白く浮き上がる。
            let thresh = new cv.Mat();
            cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

            // 2. モルフォロジー演算によるライン抽出
            let horizontal = thresh.clone();
            let vertical = thresh.clone();

            let scale = 20; // 盤面サイズの1/20程度の線を拾う
            let horizontalSize = Math.floor(horizontal.cols / scale);
            let horizontalStructure = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(horizontalSize, 1));
            cv.erode(horizontal, horizontal, horizontalStructure);
            cv.dilate(horizontal, horizontal, horizontalStructure);

            let verticalSize = Math.floor(vertical.rows / scale);
            let verticalStructure = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, verticalSize));
            cv.erode(vertical, vertical, verticalStructure);
            cv.dilate(vertical, vertical, verticalStructure);

            // 3. マスクの合成（水平 + 垂直）
            let mask = new cv.Mat();
            cv.add(horizontal, vertical, mask);

            // 4. 枠（最大の正方形に近い矩形）を抽出
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            let maxArea = 0;
            let bestRect = null;

            for (let i = 0; i < contours.size(); ++i) {
                let cnt = contours.get(i);
                let rect = cv.boundingRect(cnt);
                let area = rect.width * rect.height;
                let aspect = rect.width / rect.height;

                // アスペクト比がほぼ1:1かつ十分な面積を持つものを探す
                if (aspect > 0.7 && aspect < 1.3 && area > maxArea) {
                    maxArea = area;
                    bestRect = rect;
                }
                cnt.delete(); // 個別輪郭の解放
            }

            if (!bestRect || maxArea < 10000) {
                // 枠の特定に失敗した場合はエラーとして中断する
                throw new Error("数独の枠（盤面）を特定できませんでした。スクリーンショットであること、または盤面が歪んでいないか確認してください。");
            }

            // メモリ解放: 枠検出用の中間Mat
            horizontal.delete(); vertical.delete(); mask.delete();
            horizontalStructure.delete(); verticalStructure.delete();
            contours.delete(); hierarchy.delete();
            contours = null; hierarchy = null; // 二重解放防止

            // 盤面の切り出し
            let boardMatRaw = src.roi(bestRect);
            let boardMatBig = new cv.Mat();
            let dsizeBig = new cv.Size(boardMatRaw.cols * 4, boardMatRaw.rows * 4);
            cv.resize(boardMatRaw, boardMatBig, dsizeBig, 0, 0, cv.INTER_CUBIC);

            // グローバルな2値化処理は廃止し、マス単位（Per-Cell Otsu）に変更
            // ハイライトや一部の暗いセルへの耐性を高めるため
            let grayBig = new cv.Mat();
            cv.cvtColor(boardMatBig, grayBig, cv.COLOR_RGBA2GRAY, 0);

            const cellWidthBig = grayBig.cols / 9;
            const cellHeightBig = grayBig.rows / 9;
            const marginWBig = cellWidthBig * 0.03;
            const marginHBig = cellHeightBig * 0.03;

            // --- Phase 1: 面積統計の収集 ---
            ocrStatus.textContent = '盤面の統計情報を解析中...';
            let maxAreas = [];
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    let x = Math.floor(c * cellWidthBig + marginWBig);
                    let y = Math.floor(r * cellHeightBig + marginHBig);
                    let w = Math.floor(cellWidthBig - marginWBig * 2);
                    let h = Math.floor(cellHeightBig - marginHBig * 2);

                    let rect = new cv.Rect(x, y, w, h);
                    let cellGray = grayBig.roi(rect);

                    // 各マスごとに最適なしきい値を決定
                    let cellThresh = new cv.Mat();
                    if (isDarkMode) {
                        cv.threshold(cellGray, cellThresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
                    } else {
                        cv.threshold(cellGray, cellThresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
                    }

                    let labels = new cv.Mat();
                    let stats = new cv.Mat();
                    let centroids = new cv.Mat();
                    let nLabels = cv.connectedComponentsWithStats(cellThresh, labels, stats, centroids);

                    let currentMax = 0;
                    for (let i = 1; i < nLabels; i++) {
                        let cl = stats.intAt(i, cv.CC_STAT_LEFT);
                        let ct = stats.intAt(i, cv.CC_STAT_TOP);
                        let cw = stats.intAt(i, cv.CC_STAT_WIDTH);
                        let ch = stats.intAt(i, cv.CC_STAT_HEIGHT);
                        let area = stats.intAt(i, cv.CC_STAT_AREA);

                        // 4倍解像度のため 4px マージン
                        let isTouching = (cl <= 4 || ct <= 4 || (cl + cw) >= cellThresh.cols - 4 || (ct + ch) >= cellThresh.rows - 4);
                        if (!isTouching && area > currentMax) currentMax = area;
                    }
                    if (currentMax > 0) maxAreas.push(currentMax);

                    labels.delete(); stats.delete(); centroids.delete(); cellThresh.delete(); cellGray.delete();
                }
            }

            let absoluteMaxArea = maxAreas.length > 0 ? Math.max(...maxAreas) : 0;
            let dynamicThreshold = Math.max(absoluteMaxArea * 0.25, cellWidthBig * cellHeightBig * 0.015);

            // 81個分のキャンバスを生成
            cellCanvases = [];

            // --- Phase 2: 文字の抽出と保存 ---
            ocrStatus.textContent = t('ocrStatusExtracting');
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    let x = Math.floor(col * cellWidthBig + marginWBig);
                    let y = Math.floor(row * cellHeightBig + marginHBig);
                    let w = Math.floor(cellWidthBig - marginWBig * 2);
                    let h = Math.floor(cellHeightBig - marginHBig * 2);

                    let rect = new cv.Rect(x, y, w, h);
                    let cellGray = grayBig.roi(rect);

                    // 再度2値化
                    let cellThresh = new cv.Mat();
                    if (isDarkMode) {
                        cv.threshold(cellGray, cellThresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
                    } else {
                        cv.threshold(cellGray, cellThresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
                    }

                    let processedCell = preprocessCell(cellThresh, dynamicThreshold);

                    let canvas = document.createElement('canvas');
                    canvas.width = processedCell.mat.cols;
                    canvas.height = processedCell.mat.rows;
                    cv.imshow(canvas, processedCell.mat);
                    canvas.dataset.hasDigit = processedCell.hasDigit;

                    cellCanvases.push(canvas);

                    processedCell.mat.delete();
                    cellThresh.delete();
                    cellGray.delete();
                }
            }

            src.delete(); gray.delete(); blurred.delete(); thresh.delete();
            if (contours) contours.delete();
            if (hierarchy) hierarchy.delete();
            boardMatRaw.delete(); boardMatBig.delete(); grayBig.delete();

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * セル内の数字を孤立化させ、中央に配置する前処理
 * 既に2値化された4倍解像度データを受け取り、成形を行う
 * @param {cv.Mat} thresh 2値化済みセル画像
 * @param {number} dynamicThreshold 数字として認める最小面積
 * @returns {{mat: cv.Mat, hasDigit: boolean}} 処理済みMatと、文字が存在するかのフラグ
 */
function preprocessCell(thresh, dynamicThreshold) {
    // 連結成分解析による数字の特定
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

        // 枠線の除去: 4x超解像のため 4px マージン
        let isTouchingBorder = (left <= 4 || top <= 4 || (left + width) >= thresh.cols - 4 || (top + height) >= thresh.rows - 4);

        if (!isTouchingBorder) {
            if (area > maxArea) {
                maxArea = area;
                bestRect = new cv.Rect(left, top, width, height);
            }
        }
    }

    // 出力用のキャンバスを作成（白背景）
    let output = new cv.Mat.ones(thresh.rows, thresh.cols, cv.CV_8UC1);
    output.setTo(new cv.Scalar(255)); // 白で埋める

    let hasDigit = false;

    // 数字が見つかった場合、中央に配置
    if (bestRect && maxArea >= dynamicThreshold) {
        hasDigit = true;
        let digitROI = thresh.roi(bestRect);

        let targetX = Math.floor((output.cols - bestRect.width) / 2);
        let targetY = Math.floor((output.rows - bestRect.height) / 2);
        let targetRect = new cv.Rect(targetX, targetY, bestRect.width, bestRect.height);

        let processedDigit = new cv.Mat();
        // 白背景用反転（文字を黒にする）
        cv.bitwise_not(digitROI, processedDigit);
        processedDigit.copyTo(output.roi(targetRect));

        processedDigit.delete();
        digitROI.delete();
    }

    // メモリ解放
    labels.delete(); stats.delete(); centroids.delete();

    return { mat: output, hasDigit: hasDigit };
}

// 対話的エラー修正モーダルのPromiseラッパー（一括リスト版）
function showBulkCorrectionModal(groups) {
    return new Promise((resolve) => {
        const modal = document.getElementById('ocr-correction-modal');
        const listContainer = document.getElementById('ocr-correction-list');
        const btnSubmit = document.getElementById('modal-btn-submit');
        const btnSkip = document.getElementById('modal-btn-skip');
        const stepCounter = document.getElementById('modal-step-counter');

        listContainer.innerHTML = '';
        stepCounter.textContent = `(${groups.length} groups)`;

        const inputMap = new Map(); // group -> input element

        groups.forEach((group, i) => {
            const item = document.createElement('div');
            item.className = 'correction-item';

            const img = document.createElement('img');
            img.src = group.canvas.toDataURL('image/png');
            img.alt = `cell-${i}`;

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '9';
            input.placeholder = '?';
            input.inputMode = 'numeric';
            input.pattern = '[0-9]*';

            // Enterキーで次の入力欄へ移動、または確定
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const inputs = Array.from(listContainer.querySelectorAll('input'));
                    const idx = inputs.indexOf(input);
                    if (idx < inputs.length - 1) {
                        inputs[idx + 1].focus();
                    } else {
                        onSubmit();
                    }
                }
            });

            item.appendChild(img);
            item.appendChild(input);
            listContainer.appendChild(item);
            inputMap.set(group, input);
        });

        modal.style.display = 'flex';
        // 最初の入力欄にフォーカス
        const firstInput = listContainer.querySelector('input');
        if (firstInput) firstInput.focus();

        const cleanupAndResolve = (results) => {
            modal.style.display = 'none';
            btnSubmit.removeEventListener('click', onSubmit);
            btnSkip.removeEventListener('click', onSkip);
            window.removeEventListener('keydown', onGlobalKeydown);
            resolve(results);
        };

        const onSubmit = () => {
            const results = [];
            groups.forEach(group => {
                const input = inputMap.get(group);
                const val = parseInt(input.value) || 0;
                results.push({ group, val });
            });
            cleanupAndResolve(results);
        };

        const onSkip = () => {
            const results = groups.map(group => ({ group, val: 0 }));
            cleanupAndResolve(results);
        };

        const onGlobalKeydown = (e) => {
            if (e.key === 'Escape') {
                onSkip();
            }
        };

        btnSubmit.addEventListener('click', onSubmit);
        btnSkip.addEventListener('click', onSkip);
        window.addEventListener('keydown', onGlobalKeydown);
    });
}

// --- Phase 7 dynamic state variables ---
let currentOcrCorrectionQueue = [];
let currentGridResult = [];
let finalValidatedGrid = null;

function hideAllOcrStates() {
    const states = ['ocr-state-success', 'ocr-state-partial-fail', 'ocr-state-manual-grid'];
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const progressContainer = document.querySelector('.ocr-progress-container');
    if (progressContainer) progressContainer.style.display = 'none';
    const canvasContainer = document.querySelector('.ocr-canvas-container');
    if (canvasContainer) canvasContainer.style.display = 'none';
    const defaultMsg = document.getElementById('upload-default-msg');
    if (defaultMsg) defaultMsg.style.display = 'block';
    const errorMsg = document.getElementById('upload-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';

    // 右側の表示物リセット
    const parsedPreview = document.getElementById('ocr-parsed-preview');
    const manualGrid = document.getElementById('ocr-manual-grid');
    const previewLabel = document.getElementById('ocr-preview-label');
    if (parsedPreview) parsedPreview.style.display = 'none';
    if (manualGrid) manualGrid.style.display = 'none';
    if (previewLabel) previewLabel.textContent = 'Parsed Grid';
}

/**
 * 解析済みの盤面プレビューを生成する
 */
function renderParsedPreview(grid1D, unrecognizedIndices = []) {
    const previewContainer = document.getElementById('ocr-parsed-preview');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    grid1D.forEach((num, idx) => {
        const cell = document.createElement('div');
        cell.className = 'preview-cell';

        // unrecognizedIndicesが数値の配列、または {index: i, ...} のオブジェクト配列である場合の両方を想定
        const isUnrecognized = unrecognizedIndices.some(item =>
            (typeof item === 'number' ? item === idx : (item && item.index === idx))
        );

        if (isUnrecognized) {
            cell.textContent = '?'; // 半角?に変更
            cell.classList.add('unrecognized');
        } else if (num !== 0) {
            cell.textContent = num;
        } else {
            cell.innerHTML = '&nbsp;'; // 空マスが詰まるのを防ぐ
        }

        previewContainer.appendChild(cell);
    });
}

function applyGridToBoardAndCloseModal(grid2D) {
    const solver = new SudokuLogicalSolver(grid2D);
    const result = solver.solve();

    const solutionGrid = grid2D.map(row => [...row]);
    SudokuLogicalSolver.solveSudoku(solutionGrid);
    solution = solutionGrid;

    initialBoard = grid2D.map(row => [...row]);
    board = grid2D.map(row => [...row]);
    givenCells = grid2D.map(row => row.map(v => v !== 0));

    memos = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    undoStack = [];
    redoStack = [];
    selectedRow = 0;
    selectedCol = 0;
    lastInputNumber = 0;
    lastActionWasRocket = false;

    const techLevel = result.solved ? result.technique : 'Extreme';
    messageEl.textContent = '🧠 ' + techLevel;
    currentTechnique = techLevel;

    ocrModal.style.display = 'none';
    renderBoard();
    updateUndoRedoButtons();
}

document.getElementById('btn-state-play').addEventListener('click', () => {
    if (finalValidatedGrid) {
        applyGridToBoardAndCloseModal(finalValidatedGrid);
    }
});

// 手動による未認識マスの補正を開始（State Cでの「入力する」またはグリッドクリック時）
async function startManualCorrectionFlow() {
    if (document.getElementById('ocr-state-partial-fail').style.display === 'none' &&
        document.getElementById('ocr-correction-modal').style.display !== 'none') {
        return; // 既に実行中なら何もしない
    }

    try {
        document.getElementById('ocr-state-partial-fail').style.display = 'none';
        ocrStatus.textContent = '未認識の数字をグループ化して、一括で補正します...';
        ocrStatus.style.color = '#ffcc00';

        // --- ステップ 1: 未認識セルの事前グループ化 ---
        const groups = []; // { canvas, indices: [] }
        for (const item of currentOcrCorrectionQueue) {
            let matchedGroup = null;
            if (groups.length > 0) {
                let itemMat = cv.imread(item.canvas);
                cv.cvtColor(itemMat, itemMat, cv.COLOR_RGBA2GRAY, 0);

                for (const group of groups) {
                    let groupMat = cv.imread(group.canvas);
                    cv.cvtColor(groupMat, groupMat, cv.COLOR_RGBA2GRAY, 0);

                    let res = new cv.Mat();
                    cv.matchTemplate(itemMat, groupMat, res, cv.TM_CCOEFF_NORMED);
                    let mm = cv.minMaxLoc(res);

                    if (mm.maxVal > 0.85) { // ユーザー指定の 0.85
                        matchedGroup = group;
                        res.delete(); groupMat.delete();
                        break;
                    }
                    res.delete(); groupMat.delete();
                }
                itemMat.delete();
            }

            if (matchedGroup) {
                matchedGroup.indices.push(item.index);
            } else {
                groups.push({ canvas: item.canvas, indices: [item.index] });
            }
        }

        // --- ステップ 2: グループ単位での対話的修正 ---
        const results = await showBulkCorrectionModal(groups);

        for (const res of results) {
            const { group, val } = res;
            // グループ全体に回答を適用
            for (const idx of group.indices) {
                currentGridResult[idx] = val;
            }

            // キャッシュへの登録
            if (val !== 0) {
                let cacheMat = cv.imread(group.canvas);
                cv.cvtColor(cacheMat, cacheMat, cv.COLOR_RGBA2GRAY, 0);
                manualCorrectionCache.push({ mat: cacheMat, digit: val });
            }
        }

        // 補正後、再度検証へ
        proceedToValidation(currentGridResult, true);
    } catch (err) {
        console.error(err);
        ocrStatus.textContent = err.toString();
    }
}

document.getElementById('btn-state-input').addEventListener('click', startManualCorrectionFlow);
document.getElementById('ocr-parsed-preview').addEventListener('click', startManualCorrectionFlow);

function proceedToValidation(grid1D, autoPlay = false) {
    const grid2D = [];
    for (let r = 0; r < 9; r++) {
        grid2D.push(grid1D.slice(r * 9, r * 9 + 9));
    }
    // 成功時も画像プレビューが見えるようにする
    document.querySelector('.ocr-canvas-container').style.display = 'flex';
    validateAndApplyOcrGrid(grid2D, autoPlay);
}

// 自動解析トリガー関数
async function startOCRAnalysis() {
    hideAllOcrStates();

    // 解析中はアップロードエリアを完全に隠す
    uploadZone.style.display = 'none';

    ocrStatus.style.color = '#ffcc00';
    ocrStatus.textContent = t('ocrStatusLoading');

    // コンテナたちが非表示にならないように強制
    document.querySelector('.ocr-progress-container').style.display = 'block';
    document.querySelector('.ocr-canvas-container').style.display = 'flex';
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    try {
        if (typeof cv === 'undefined') {
            throw new Error('OpenCV.js is not loaded yet.');
        }

        await processImageWithOpenCV();

        const gridResult = new Array(81).fill(0);
        const cellCanvasesWithDigits = [];

        for (let i = 0; i < 81; i++) {
            if (cellCanvases[i].dataset.hasDigit === 'true') {
                cellCanvasesWithDigits.push({ index: i, canvas: cellCanvases[i] });
            }
        }

        // --- ステップ 1: 事前グループ化 (一致度85%) ---
        const groups = []; // { canvases: [], indices: [] }
        for (const item of cellCanvasesWithDigits) {
            let matchedGroup = null;
            let itemMat = cv.imread(item.canvas);
            cv.cvtColor(itemMat, itemMat, cv.COLOR_RGBA2GRAY, 0);

            for (const group of groups) {
                let repCanvas = group.canvases[0];
                let repMat = cv.imread(repCanvas);
                cv.cvtColor(repMat, repMat, cv.COLOR_RGBA2GRAY, 0);

                let res = new cv.Mat();
                cv.matchTemplate(itemMat, repMat, res, cv.TM_CCOEFF_NORMED);
                let mm = cv.minMaxLoc(res);

                if (mm.maxVal > 0.85) {
                    matchedGroup = group;
                    res.delete(); repMat.delete();
                    break;
                }
                res.delete(); repMat.delete();
            }
            itemMat.delete();

            if (matchedGroup) {
                matchedGroup.canvases.push(item.canvas);
                matchedGroup.indices.push(item.index);
            } else {
                groups.push({ canvases: [item.canvas], indices: [item.index] });
            }
        }

        // --- ステップ 2: グループ単位でのOCR処理 ---
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR
        });

        ocrStatus.textContent = t('ocrStatusExtracting');
        const correctionQueue = [];
        let processedCellsCount = 0;

        for (const group of groups) {
            let recognizedNum = 0;

            // まずはキャッシュ（過去の手入力修正結果）と照合
            if (manualCorrectionCache.length > 0) {
                let repCanvas = group.canvases[0];
                let currentMat = cv.imread(repCanvas);
                cv.cvtColor(currentMat, currentMat, cv.COLOR_RGBA2GRAY, 0);

                for (const cache of manualCorrectionCache) {
                    let res = new cv.Mat();
                    cv.matchTemplate(currentMat, cache.mat, res, cv.TM_CCOEFF_NORMED);
                    let mm = cv.minMaxLoc(res);
                    if (mm.maxVal > 0.85) {
                        recognizedNum = cache.digit;
                        res.delete();
                        break;
                    }
                    res.delete();
                }
                currentMat.delete();
            }

            // キャッシュになければOCR
            if (recognizedNum === 0) {
                for (const canvas of group.canvases) {
                    const ret = await worker.recognize(canvas);
                    const text = ret.data.text.trim();
                    let num = 0;
                    if (text.length === 1 && text >= '1' && text <= '9') {
                        num = parseInt(text, 10);
                    }

                    if (num !== 0) {
                        recognizedNum = num;
                        break; // 誰か1人でも成功すればそのグループは確定
                    }
                }
            }

            if (recognizedNum !== 0) {
                for (const idx of group.indices) {
                    gridResult[idx] = recognizedNum;
                }
            } else {
                // グループ全員失敗した場合は後で手入力
                for (const idx of group.indices) {
                    correctionQueue.push({ index: idx, canvas: cellCanvases[idx] });
                }
            }

            processedCellsCount += group.indices.length;
            progressFill.style.width = `${Math.round((processedCellsCount / 81) * 100)}%`;
        }

        await worker.terminate();

        // --- ルーティング判定 ---
        if (gridResult.every(n => n === 0)) {
            // ルートB: 全損
            progressBar.style.display = 'none';
            ocrStatus.textContent = '';
            document.querySelector('.ocr-progress-container').style.display = 'none';

            // アップロードエリアを再表示し、エラーメッセージに切り替える
            uploadZone.style.display = 'block';
            document.getElementById('upload-default-msg').style.display = 'none';
            document.getElementById('upload-error-msg').style.display = 'block';
            return;
        }

        if (correctionQueue.length > 0) {
            // ルートC: 部分エラー
            progressBar.style.display = 'none';
            ocrStatus.textContent = '';
            document.querySelector('.ocr-progress-container').style.display = 'none';
            document.querySelector('.ocr-canvas-container').style.display = 'flex';

            currentOcrCorrectionQueue = correctionQueue;
            currentGridResult = gridResult;

            // 部分エラー画面でも画像と認識結果を並べて表示
            document.querySelector('.ocr-canvas-container').style.display = 'flex';
            document.getElementById('ocr-parsed-preview').style.display = 'grid';
            document.getElementById('ocr-manual-grid').style.display = 'none';
            document.getElementById('ocr-preview-label').textContent = 'Parsed Grid';

            renderParsedPreview(gridResult, correctionQueue);
            document.getElementById('ocr-state-partial-fail').style.display = 'flex';
            return;
        }

        // 全て認識成功
        document.querySelector('.ocr-canvas-container').style.display = 'flex';
        document.getElementById('ocr-parsed-preview').style.display = 'grid';
        document.getElementById('ocr-manual-grid').style.display = 'none';
        renderParsedPreview(gridResult);
        proceedToValidation(gridResult);

    } catch (err) {
        console.error(err);
        ocrStatus.style.color = '#ff6666';
        ocrStatus.textContent = `${t('ocrStatusError')} : ${err.toString()}`;
        progressBar.style.display = 'none';
    }
}

/**
 * 81マスのgrid2D配列を受け取り、ルール違反や解の有無を判定してフロー分岐
 */
function validateAndApplyOcrGrid(grid2D, autoPlay = false) {
    let isRuleValid = true;
    let givenCount = 0;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const num = grid2D[r][c];
            if (num !== 0) {
                givenCount++;
                grid2D[r][c] = 0;
                if (!SudokuLogicalSolver.isValid(grid2D, r, c, num)) {
                    isRuleValid = false;
                }
                grid2D[r][c] = num;
            }
        }
    }

    // 数独が唯一解を持つための数学的最小ヒント数は17
    if (givenCount < 17) {
        isRuleValid = false;
    }

    let isSolvable = false;
    if (isRuleValid) {
        const gridCopy = grid2D.map(row => [...row]);
        // 解が2個以上見つかった時点で停止させる（ limit = 2 ）
        const solutionsCount = SudokuLogicalSolver.countSolutions(gridCopy, 2);
        isSolvable = (solutionsCount === 1); // 唯一解のみを受け入れる
    }

    progressBar.style.display = 'none';
    ocrStatus.textContent = '';
    document.querySelector('.ocr-progress-container').style.display = 'none';

    if (isRuleValid && isSolvable) {
        if (autoPlay) {
            applyGridToBoardAndCloseModal(grid2D);
        } else {
            // ルートA: 正常終了！ここで「PLAY」を見せる
            finalValidatedGrid = grid2D;
            document.getElementById('ocr-state-success').style.display = 'flex';

            // 画像とプレビューを並べて表示
            document.querySelector('.ocr-canvas-container').style.display = 'flex';
            document.getElementById('ocr-parsed-preview').style.display = 'grid';
            document.getElementById('ocr-manual-grid').style.display = 'none';
            document.getElementById('ocr-preview-label').textContent = 'Parsed Grid';
            renderParsedPreview(grid2D.flat());
        }
    } else {
        // ルートD: ルール違反 or 解なし or 複数解 -> 手動グリッドへ
        const manualStatePanel = document.getElementById('ocr-state-manual-grid');
        manualStatePanel.style.display = 'flex';
        document.querySelector('.ocr-canvas-container').style.display = 'flex';

        // メッセージを強調表示
        const warningText = manualStatePanel.querySelector('p:nth-child(2)');
        if (warningText) {
            warningText.style.backgroundColor = 'rgba(255, 204, 0, 0.2)';
            warningText.style.padding = '5px';
            warningText.style.borderRadius = '4px';
            warningText.innerHTML = '⚠️ <strong>まだ間違いがあります。</strong>盤面を修正してからもう一度PLAYを押してください。';
        }

        // 右側をインタラクティブグリッドに切り替え
        document.getElementById('ocr-parsed-preview').style.display = 'none';
        document.getElementById('ocr-manual-grid').style.display = 'grid';
        document.getElementById('ocr-preview-label').textContent = 'Correction Grid';

        renderManualCorrectionGrid(grid2D);
    }
}

/**
 * 手動修正用の81マスグリッドを構築する
 */
function renderManualCorrectionGrid(grid2D) {
    const gridContainer = document.getElementById('ocr-manual-grid');
    gridContainer.innerHTML = '';

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = document.createElement('input');
            input.type = 'text'; // スマホのBS問題回避のためtextを使うが入力補助は数値
            input.inputMode = 'numeric';
            input.pattern = '[0-9]*';
            input.dataset.row = r;
            input.dataset.col = c;

            const num = grid2D[r][c];
            if (num !== 0) {
                input.value = num;
            }

            input.addEventListener('keydown', (e) => {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                    e.preventDefault();
                }
            });
            input.addEventListener('focus', () => input.select());
            input.addEventListener('click', () => input.select());
            input.addEventListener('input', (e) => {
                // 数字以外を除外
                let val = input.value.replace(/[^0-9]/g, '');
                // 1桁のみ、かつ「0」は空欄として扱う
                if (val.length > 1) {
                    val = val.slice(0, 1);
                }
                if (val === '0') {
                    val = '';
                }
                input.value = val;
            });

            gridContainer.appendChild(input);
        }
    }
}

/**
 * 手動修正グリッドからのPLAYボタン処理
 */
document.getElementById('btn-manual-play').addEventListener('click', () => {
    const inputs = document.querySelectorAll('#ocr-manual-grid input');
    const newGrid2D = Array.from({ length: 9 }, () => Array(9).fill(0));

    inputs.forEach(input => {
        const r = parseInt(input.dataset.row, 10);
        const c = parseInt(input.dataset.col, 10);
        const val = parseInt(input.value, 10);
        if (!isNaN(val) && val >= 1 && val <= 9) {
            newGrid2D[r][c] = val;
        }
    });

    // 隠して再検証
    document.getElementById('ocr-state-manual-grid').style.display = 'none';
    validateAndApplyOcrGrid(newGrid2D, true);
});
