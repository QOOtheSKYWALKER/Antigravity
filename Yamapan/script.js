/**
 * ヤマパン シール点数計算アプリ
 * メインスクリプト - 画像前処理・OCR処理・シール管理・合計計算
 */

// =====================================
// 定数定義
// =====================================

/** 有効な点数のリスト */
const VALID_SCORES = [0.5, 1, 1.5, 2, 2.5, 3];

/** お皿交換に必要な点数 */
const GOAL_POINTS = 30;

/** LocalStorage キー */
const STORAGE_KEY = 'yamapan_stickers';

// =====================================
// 状態管理
// =====================================

/** シールデータの配列 [{id, score, method, timestamp}] */
let stickers = [];

/** 現在読み込まれた画像ファイル */
let currentImageFile = null;

/** OCR処理中フラグ */
let isProcessing = false;

/** OCRで検出された点数リスト（一括追加用） */
let detectedScores = [];

// =====================================
// DOM要素の取得
// =====================================

const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    previewArea: document.getElementById('preview-area'),
    previewImage: document.getElementById('preview-image'),
    previewFilename: document.getElementById('preview-filename'),
    ocrButton: document.getElementById('ocr-button'),
    progressSection: document.getElementById('progress-section'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    resultSection: document.getElementById('result-section'),
    ocrTextBox: document.getElementById('ocr-text-box'),
    detectedScoreValue: document.getElementById('detected-score-value'),
    scoreSelect: document.getElementById('score-select'),
    addScoreButton: document.getElementById('add-score-button'),
    manualScoreSelect: document.getElementById('manual-score-select'),
    manualAddButton: document.getElementById('manual-add-button'),
    stickerList: document.getElementById('sticker-list'),
    stickerCount: document.getElementById('sticker-count'),
    emptyList: document.getElementById('empty-list'),
    listActions: document.getElementById('list-actions'),
    clearAllButton: document.getElementById('clear-all-button'),
    totalValue: document.getElementById('total-value'),
    totalRemaining: document.getElementById('total-remaining'),
    goalProgressFill: document.getElementById('goal-progress-fill'),
    celebration: document.getElementById('celebration'),
    confettiContainer: document.getElementById('confetti-container'),
};

// =====================================
// 初期化
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    loadStickers();
    setupEventListeners();
    renderStickerList();
    updateTotal();
});

// =====================================
// イベントリスナーの設定
// =====================================

function setupEventListeners() {
    // ドロップゾーン クリック → ファイル選択ダイアログ
    dom.dropZone.addEventListener('click', () => {
        dom.fileInput.click();
    });

    // ファイル選択
    dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // ドラッグ&ドロップ
    dom.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropZone.classList.add('drag-over');
    });

    dom.dropZone.addEventListener('dragleave', () => {
        dom.dropZone.classList.remove('drag-over');
    });

    dom.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // OCR実行ボタン
    dom.ocrButton.addEventListener('click', () => {
        if (currentImageFile && !isProcessing) {
            runOCR(currentImageFile);
        }
    });

    // OCR結果からスコア追加
    dom.addScoreButton.addEventListener('click', () => {
        const score = parseFloat(dom.scoreSelect.value);
        addSticker(score, 'OCR');
    });

    // 手動スコア追加
    dom.manualAddButton.addEventListener('click', () => {
        const score = parseFloat(dom.manualScoreSelect.value);
        addSticker(score, '手動');
    });

    // 全削除
    dom.clearAllButton.addEventListener('click', () => {
        if (confirm('全てのシールデータを削除しますか？')) {
            stickers = [];
            saveStickers();
            renderStickerList();
            updateTotal();
        }
    });
}

// =====================================
// 画像読み込み
// =====================================

/**
 * ファイル選択時の処理
 * @param {File} file - 選択された画像ファイル
 */
function handleFileSelect(file) {
    // 画像ファイルか確認
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    currentImageFile = file;

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
        dom.previewImage.src = e.target.result;
        dom.previewArea.classList.add('visible');
        dom.previewFilename.textContent = file.name;
        dom.ocrButton.disabled = false;

        // 結果セクションを非表示にリセット
        dom.resultSection.classList.remove('visible');
    };
    reader.readAsDataURL(file);
}

// =====================================
// 画像前処理（Canvas）
// =====================================

/**
 * 画像をCanvasで前処理し、OCR用に最適化する
 * 赤いシール上の白い数字を読み取りやすくする
 * @param {string} imageUrl - 画像のURL
 * @returns {Promise<string>} 前処理済み画像のdata URL
 */
function preprocessImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 画像サイズを適度にリサイズ（大きすぎるとOCRが遅い）
            const maxDim = 2000;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                const scale = maxDim / Math.max(w, h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);

            // ピクセルデータを取得
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;

            // 赤いシール上の白い数字を検出するため、
            // 赤色部分を黒、白い部分をそのまま残す処理をする
            // シールの赤: R高 G低 B低 → 反転してコントラスト強調
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // 赤色の判定：R成分が高く、Gが低く、Bが低い
                const isRed = r > 150 && g < 120 && b < 120;
                // 赤い背景上の白い文字：明るさが高い
                const brightness = (r + g + b) / 3;
                const isWhiteOnRed = r > 180 && g > 180 && b > 180;

                if (isRed) {
                    // 赤い背景→黒にする（テキストの背景を統一）
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                } else if (isWhiteOnRed || brightness > 200) {
                    // 白い部分→白のまま（数字テキスト）
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                } else {
                    // その他の部分→グレースケール化
                    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    // 閾値処理：暗い部分は黒、明るい部分は白
                    const bw = gray > 160 ? 255 : 0;
                    data[i] = bw;
                    data[i + 1] = bw;
                    data[i + 2] = bw;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

// =====================================
// OCR処理
// =====================================

/**
 * Tesseract.jsによるOCR実行（前処理付き）
 * @param {File} imageFile - OCR対象画像ファイル
 */
async function runOCR(imageFile) {
    if (isProcessing) return;
    isProcessing = true;

    // UI更新: 処理開始
    dom.ocrButton.disabled = true;
    dom.ocrButton.textContent = '⏳ 読み取り中...';
    dom.progressSection.classList.add('visible');
    dom.progressBar.style.width = '0%';
    dom.progressText.textContent = '画像を前処理中...';
    dom.resultSection.classList.remove('visible');

    try {
        // 画像URLを作成
        const imageUrl = URL.createObjectURL(imageFile);

        // 画像の前処理
        dom.progressBar.style.width = '10%';
        const preprocessedUrl = await preprocessImage(imageUrl);
        URL.revokeObjectURL(imageUrl);

        dom.progressText.textContent = 'OCRエンジンを準備中...';
        dom.progressBar.style.width = '20%';

        // Tesseract.jsでOCR実行（前処理済み画像を使用）
        const result = await Tesseract.recognize(
            preprocessedUrl,
            'eng',
            {
                logger: (info) => {
                    if (info.status === 'recognizing text') {
                        const percent = Math.round(20 + info.progress * 70);
                        dom.progressBar.style.width = `${percent}%`;
                        dom.progressText.textContent = `テキストを認識中... ${Math.round(info.progress * 100)}%`;
                    } else if (info.status === 'loading language traineddata') {
                        const percent = Math.round(info.progress * 100);
                        dom.progressText.textContent = `言語データを読み込み中... ${percent}%`;
                    } else if (info.status === 'initializing api') {
                        dom.progressText.textContent = 'OCRエンジンを初期化中...';
                    }
                },
                tessedit_char_whitelist: '0123456789. ',
                tessedit_pageseg_mode: '6',
            }
        );

        dom.progressBar.style.width = '95%';
        dom.progressText.textContent = '結果を解析中...';

        // OCR結果を処理
        const ocrText = result.data.text.trim();
        processOCRResult(ocrText);

        dom.progressBar.style.width = '100%';

    } catch (error) {
        console.error('OCRエラー:', error);
        dom.progressText.textContent = 'エラーが発生しました';
        alert('OCR処理中にエラーが発生しました。\n別の画像で試してみてください。');
    } finally {
        isProcessing = false;
        dom.ocrButton.disabled = false;
        dom.ocrButton.textContent = '🔍 シールを読み取る';
        setTimeout(() => {
            dom.progressSection.classList.remove('visible');
        }, 1000);
    }
}

/**
 * OCR結果からスコアを抽出し表示
 * @param {string} text - OCRで認識されたテキスト
 */
function processOCRResult(text) {
    // 結果セクションを表示
    dom.resultSection.classList.add('visible');
    dom.ocrTextBox.textContent = text || '（テキストが検出されませんでした）';

    // 複数の点数を抽出
    const scores = extractAllScores(text);
    detectedScores = scores;

    // 検出された点数リストを表示
    renderDetectedScores(scores);

    // 結果セクションまでスクロール
    dom.resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * テキストから有効な点数をすべて抽出
 * @param {string} text - OCRテキスト
 * @returns {number[]} 検出された有効な点数の配列
 */
function extractAllScores(text) {
    if (!text) return [];

    const scores = [];

    // 行ごとに分割して処理
    const lines = text.split(/[\n\r]+/);

    for (const line of lines) {
        // 各行から数値パターンを抽出
        const cleaned = line.replace(/\s+/g, ' ').trim();
        // 小数点を含む数値パターン
        const matches = cleaned.match(/\d+\.?\d*/g);

        if (!matches) continue;

        for (const match of matches) {
            const num = parseFloat(match);
            if (VALID_SCORES.includes(num)) {
                scores.push(num);
            }
        }
    }

    return scores;
}

/**
 * 検出されたスコアリストを結果セクションに表示
 * @param {number[]} scores - 検出された点数配列
 */
function renderDetectedScores(scores) {
    const detectedArea = document.getElementById('detected-score');

    if (scores.length === 0) {
        detectedArea.innerHTML = `
      <div style="text-align: center; width: 100%;">
        <div style="font-size: 1.5rem; margin-bottom: 8px;">🤔</div>
        <span class="detected-score-label">点数を検出できませんでした</span>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
          下のセレクターから手動で追加してください
        </p>
      </div>
    `;
        return;
    }

    // 点数をグループ化してカウント
    const scoreCounts = {};
    for (const s of scores) {
        scoreCounts[s] = (scoreCounts[s] || 0) + 1;
    }

    const total = scores.reduce((sum, s) => sum + s, 0);
    const roundedTotal = Math.round(total * 10) / 10;

    let html = `
    <div style="width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span class="detected-score-label">🎯 検出結果: ${scores.length}枚のシール</span>
        <div>
          <span class="detected-score-value" style="font-size: 1.5rem;">${roundedTotal}</span>
          <span class="detected-score-unit">点</span>
        </div>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
  `;

    // 各点数ごとのバッジを表示
    const sortedScores = Object.keys(scoreCounts).sort((a, b) => parseFloat(b) - parseFloat(a));
    for (const score of sortedScores) {
        const count = scoreCounts[score];
        html += `
      <div style="background: rgba(244, 114, 182, 0.15); border: 1px solid rgba(244, 114, 182, 0.3); 
                  border-radius: 8px; padding: 6px 12px; font-size: 0.85rem;">
        <strong style="color: var(--accent-pink-light);">${score}点</strong>
        <span style="color: var(--text-muted);"> × ${count}</span>
      </div>
    `;
    }

    html += `
      </div>
      <button class="btn btn-primary" id="add-all-detected" style="margin-top: 0; font-size: 0.85rem; padding: 10px 20px;">
        ✅ ${scores.length}枚すべて追加する
      </button>
    </div>
  `;

    detectedArea.innerHTML = html;

    // 一括追加ボタンのイベント
    document.getElementById('add-all-detected').addEventListener('click', () => {
        for (const score of detectedScores) {
            addSticker(score, 'OCR');
        }
        detectedScores = [];
        // ボタンを無効化
        const btn = document.getElementById('add-all-detected');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '✅ 追加しました！';
            btn.style.opacity = '0.5';
        }
    });
}

// =====================================
// シール管理
// =====================================

/**
 * シールを追加
 * @param {number} score - 点数
 * @param {string} method - 追加方法（'OCR' or '手動'）
 */
function addSticker(score, method) {
    const sticker = {
        id: Date.now() + Math.random(),
        score: score,
        method: method,
        timestamp: new Date().toISOString(),
    };

    stickers.push(sticker);
    saveStickers();
    renderStickerList();
    updateTotal();
}

/**
 * シールを削除
 * @param {number} id - シールのID
 */
function removeSticker(id) {
    stickers = stickers.filter((s) => s.id !== id);
    saveStickers();
    renderStickerList();
    updateTotal();
}

// =====================================
// 表示更新
// =====================================

/** シール一覧の再描画 */
function renderStickerList() {
    // 空リスト表示の切り替え
    if (stickers.length === 0) {
        dom.emptyList.style.display = 'block';
        dom.listActions.style.display = 'none';
        dom.stickerCount.textContent = '0枚';
        const items = dom.stickerList.querySelectorAll('.sticker-item');
        items.forEach((item) => item.remove());
        return;
    }

    dom.emptyList.style.display = 'none';
    dom.listActions.style.display = 'flex';
    dom.stickerCount.textContent = `${stickers.length}枚`;

    // 既存のシール要素を全削除
    const existingItems = dom.stickerList.querySelectorAll('.sticker-item');
    existingItems.forEach((item) => item.remove());

    // シールを再描画
    stickers.forEach((sticker, index) => {
        const li = document.createElement('li');
        li.className = 'sticker-item';
        li.innerHTML = `
      <div class="sticker-info">
        <span class="sticker-number">#${index + 1}</span>
        <span class="sticker-score">${sticker.score} 点</span>
        <span class="sticker-method">${sticker.method}</span>
      </div>
      <div class="sticker-actions">
        <button class="btn-icon" onclick="removeSticker(${sticker.id})" title="削除">✕</button>
      </div>
    `;
        dom.stickerList.appendChild(li);
    });
}

/** 合計の更新 */
function updateTotal() {
    const total = stickers.reduce((sum, s) => sum + s.score, 0);
    const roundedTotal = Math.round(total * 10) / 10;

    dom.totalValue.textContent = roundedTotal;

    // プログレスバー
    const progress = Math.min((roundedTotal / GOAL_POINTS) * 100, 100);
    dom.goalProgressFill.style.width = `${progress}%`;

    // 残り点数
    if (roundedTotal >= GOAL_POINTS) {
        dom.totalRemaining.textContent = '🎉 目標達成！お皿と交換できます！';
        dom.goalProgressFill.classList.add('complete');
        showCelebration();
    } else {
        const remaining = Math.round((GOAL_POINTS - roundedTotal) * 10) / 10;
        dom.totalRemaining.textContent = `あと ${remaining} 点でお皿と交換！`;
        dom.goalProgressFill.classList.remove('complete');
        dom.celebration.classList.remove('visible');
    }
}

// =====================================
// お祝い演出
// =====================================

/** 達成時のお祝いアニメーション */
function showCelebration() {
    dom.celebration.classList.add('visible');
    spawnConfetti();
}

/** 紙吹雪を生成 */
function spawnConfetti() {
    dom.confettiContainer.innerHTML = '';
    const colors = ['#f472b6', '#fbb6ce', '#fbbf24', '#34d399', '#818cf8', '#fb923c'];
    const shapes = ['●', '■', '▲', '🌸', '✿'];

    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.fontSize = `${Math.random() * 12 + 8}px`;
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
        dom.confettiContainer.appendChild(confetti);
    }

    setTimeout(() => {
        dom.confettiContainer.innerHTML = '';
    }, 5000);
}

// =====================================
// データ永続化（LocalStorage）
// =====================================

/** シールデータを保存 */
function saveStickers() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers));
    } catch (e) {
        console.warn('LocalStorageへの保存に失敗しました:', e);
    }
}

/** シールデータを読み込み */
function loadStickers() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            stickers = JSON.parse(data);
        }
    } catch (e) {
        console.warn('LocalStorageからの読み込みに失敗しました:', e);
        stickers = [];
    }
}
