/**
 * ヤマパン シール点数計算アプリ v3
 * OpenCV.jsを使用した台紙マトリクス・テンプレートマッチング方式
 */

// =====================================
// 定数と状態管理
// =====================================
const VALID_SCORES = [0.5, 1, 1.5, 2, 2.5, 3];
const GOAL_POINTS = 30;
const STORAGE_KEY_STICKERS = 'yamapan_v3_stickers';
const STORAGE_KEY_TEMPLATES = 'yamapan_v3_templates';

let stickers = [];
let templates = {}; // { '0.5': rawDataURL, ... }
let currentImage = null; // HTMLImageElement
let currentCells = []; // 30個のセルのデータURL
let currentDetectedResults = []; // 解析結果 { score, dataUrl }

// 四隅の座標状態（Canvas上の座標）
const defaultCorners = [
    { x: 50, y: 50 },          // 左上
    { x: 350, y: 50 },         // 右上
    { x: 350, y: 450 },        // 右下
    { x: 50, y: 450 }          // 左下
];
let corners = [...defaultCorners];
let draggingPoint = -1;
let canvasScale = 1;

// =====================================
// DOM要素
// =====================================
const dom = {
    // Tabs
    tabScan: document.getElementById('tab-scan'),
    tabTemplates: document.getElementById('tab-templates'),
    tabHistory: document.getElementById('tab-history'),
    viewScan: document.getElementById('view-scan'),
    viewTemplates: document.getElementById('view-templates'),
    viewHistory: document.getElementById('view-history'),

    // Scan View
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    inputCard: document.getElementById('input-card'),
    cornersCard: document.getElementById('corners-card'),
    canvas: document.getElementById('image-canvas'),
    analyzeBtn: document.getElementById('analyze-button'),
    progressSection: document.getElementById('progress-section'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    resultCard: document.getElementById('result-card'),
    matrixGrid: document.getElementById('matrix-grid'),
    unregisteredWarning: document.getElementById('unregistered-warning'),
    goToTemplateBtn: document.getElementById('go-to-template-btn'),
    detectedScoreDiv: document.getElementById('detected-score'),
    confirmAddBtn: document.getElementById('confirm-add-button'),

    // Templates View
    templateList: document.getElementById('template-list'),
    clearTemplatesBtn: document.getElementById('clear-templates-btn'),

    // History View
    stickerCount: document.getElementById('sticker-count'),
    stickerList: document.getElementById('sticker-list'),
    emptyList: document.getElementById('empty-list'),
    listActions: document.getElementById('list-actions'),
    clearAllBtn: document.getElementById('clear-all-button'),
    manualScoreSelect: document.getElementById('manual-score-select'),
    manualAddBtn: document.getElementById('manual-add-button'),

    // Total Card
    totalValue: document.getElementById('total-value'),
    totalRemaining: document.getElementById('total-remaining'),
    goalProgressFill: document.getElementById('goal-progress-fill'),
    celebration: document.getElementById('celebration'),
    confettiContainer: document.getElementById('confetti-container'),

    // Modal
    modal: document.getElementById('template-modal'),
    modalTargetScore: document.getElementById('modal-target-score'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    modalMatrixGrid: document.getElementById('modal-matrix-grid')
};

let currentAssigningScore = null;

// =====================================
// 初期化・イベントリスナー
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupTabs();
    setupFileInput();
    setupCanvasEvents();
    setupButtons();
    renderTemplateList();
    renderStickerList();
    updateTotal();
});

// OpenCVの準備完了コールバック
function onOpenCvReady() {
    cv['onRuntimeInitialized'] = () => {
        document.getElementById('opencv-loading').classList.add('hidden');
        console.log('OpenCV.js is ready.');
    };
}

function setupTabs() {
    const tabs = [
        { btn: dom.tabScan, view: dom.viewScan },
        { btn: dom.tabTemplates, view: dom.viewTemplates },
        { btn: dom.tabHistory, view: dom.viewHistory }
    ];

    tabs.forEach(tab => {
        tab.btn.addEventListener('click', () => {
            tabs.forEach(t => {
                t.btn.classList.remove('active');
                t.view.classList.add('hidden');
            });
            tab.btn.classList.add('active');
            tab.view.classList.remove('hidden');
            if (tab.btn === dom.tabHistory) renderStickerList();
            if (tab.btn === dom.tabTemplates) renderTemplateList();
        });
    });
}

function setupFileInput() {
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    dom.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropZone.classList.add('drag-over'); });
    dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('drag-over'));
    dom.dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dom.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleImageFile(e.dataTransfer.files[0]);
    });
    dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleImageFile(e.target.files[0]);
    });
}

function setupButtons() {
    dom.analyzeBtn.addEventListener('click', analyzeMatrix);

    dom.goToTemplateBtn.addEventListener('click', () => {
        dom.tabTemplates.click();
    });

    dom.confirmAddBtn.addEventListener('click', () => {
        if (currentDetectedResults.length === 0) return;
        currentDetectedResults.forEach(res => {
            addSticker(res.score, 'マトリクス解析');
        });
        dom.tabHistory.click();

        // 解析結果をリセット
        dom.resultCard.classList.add('hidden');
        dom.cornersCard.classList.add('hidden');
        dom.inputCard.style.display = 'block';
        currentImage = null;
        currentCells = [];
    });

    dom.manualAddBtn.addEventListener('click', () => {
        addSticker(parseFloat(dom.manualScoreSelect.value), '手動');
    });

    dom.clearAllBtn.addEventListener('click', () => {
        if (confirm('履歴を全て削除しますか？')) {
            stickers = [];
            saveData();
            renderStickerList();
            updateTotal();
        }
    });

    dom.clearTemplatesBtn.addEventListener('click', () => {
        if (confirm('登録済みの参考画像（辞書）をリセットしますか？')) {
            templates = {};
            saveData();
            renderTemplateList();
        }
    });

    dom.closeModalBtn.addEventListener('click', closeModal);
}

// =====================================
// Canvas 四隅の指定ロジック
// =====================================
function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください'); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            dom.inputCard.style.display = 'none';
            dom.cornersCard.classList.remove('hidden');
            dom.resultCard.classList.add('hidden');

            // display: none が解除された後でclientWidthを取得して初期化
            setTimeout(() => {
                initCanvas();
            }, 50);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function initCanvas() {
    const canvas = dom.canvas;
    const ctx = canvas.getContext('2d');

    // 表示用のサイズ調整
    const maxWidth = dom.cornersCard.clientWidth - 40; // padding分引く
    let w = currentImage.width;
    let h = currentImage.height;

    if (w > maxWidth) {
        h = h * (maxWidth / w);
        w = maxWidth;
    }

    canvas.width = w;
    canvas.height = h;
    canvasScale = currentImage.width / w;

    // 四隅の初期位置（画像の端から少し内側）
    const padding = Math.min(w, h) * 0.1;
    corners = [
        { x: padding, y: padding },
        { x: w - padding, y: padding },
        { x: w - padding, y: h - padding },
        { x: padding, y: h - padding }
    ];

    drawCanvas();
}

function drawCanvas() {
    if (!currentImage) return;
    const canvas = dom.canvas;
    const ctx = canvas.getContext('2d');

    // 画像描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // 四辺の描画
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)'; // accent pink
    ctx.lineWidth = 2;
    ctx.stroke();

    // グリッド線（5x6のガイド）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    // 縦線
    for (let i = 1; i < 5; i++) {
        const t = i / 5;
        const topX = corners[0].x + (corners[1].x - corners[0].x) * t;
        const topY = corners[0].y + (corners[1].y - corners[0].y) * t;
        const botX = corners[3].x + (corners[2].x - corners[3].x) * t;
        const botY = corners[3].y + (corners[2].y - corners[3].y) * t;
        ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(botX, botY); ctx.stroke();
    }
    // 横線
    for (let i = 1; i < 6; i++) {
        const t = i / 6;
        const leftX = corners[0].x + (corners[3].x - corners[0].x) * t;
        const leftY = corners[0].y + (corners[3].y - corners[0].y) * t;
        const rightX = corners[1].x + (corners[2].x - corners[1].x) * t;
        const rightY = corners[1].y + (corners[2].y - corners[1].y) * t;
        ctx.beginPath(); ctx.moveTo(leftX, leftY); ctx.lineTo(rightX, rightY); ctx.stroke();
    }

    // 四隅の点
    corners.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = (draggingPoint === i) ? '#db2777' : '#f472b6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 番号
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(i + 1, p.x - 3, p.y - 12);
    });
}

function setupCanvasEvents() {
    const canvas = dom.canvas;

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function onDown(e) {
        e.preventDefault(); // スクロール防止
        const pos = getMousePos(e);
        // ヒットテスト (半径15ピクセルの当たり判定)
        for (let i = 0; i < corners.length; i++) {
            const dx = pos.x - corners[i].x;
            const dy = pos.y - corners[i].y;
            if (dx * dx + dy * dy < 225) {
                draggingPoint = i;
                drawCanvas();
                break;
            }
        }
    }

    function onMove(e) {
        if (draggingPoint === -1) return;
        e.preventDefault();
        const pos = getMousePos(e);
        // 境界制限
        corners[draggingPoint].x = Math.max(0, Math.min(canvas.width, pos.x));
        corners[draggingPoint].y = Math.max(0, Math.min(canvas.height, pos.y));
        drawCanvas();
    }

    function onUp(e) {
        if (draggingPoint !== -1) {
            draggingPoint = -1;
            drawCanvas();
        }
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
}

// =====================================
// OpenCV.js マトリクス解析とマッチング
// =====================================
async function analyzeMatrix() {
    if (typeof cv === 'undefined' || !cv.Mat) {
        alert('OpenCV.jsがロードされるまでお待ちください。'); return;
    }

    dom.analyzeBtn.disabled = true;
    dom.resultCard.classList.remove('hidden');
    dom.progressSection.classList.add('visible');
    dom.progressBar.style.width = '20%';
    dom.progressText.textContent = '射影変換（歪み補正）を実行中...';

    // JSスレッドブロックを防ぐためタイマーで分離
    setTimeout(() => performPerspectiveTransform(), 100);
}

function performPerspectiveTransform() {
    try {
        // 元画像サイズの座標に変換
        const srcPoints = corners.map(p => ({ x: p.x * canvasScale, y: p.y * canvasScale }));

        let src = cv.imread(currentImage);

        // ゴールサイズ (横5マス × 縦6マス) => (500 x 600 ピクセルが計算しやすい)
        const cellW = 100;
        const cellH = 100;
        const dstW = cellW * 5;
        const dstH = cellH * 6;
        let dst = new cv.Mat();

        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            srcPoints[0].x, srcPoints[0].y,
            srcPoints[1].x, srcPoints[1].y,
            srcPoints[2].x, srcPoints[2].y,
            srcPoints[3].x, srcPoints[3].y
        ]);
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            dstW, 0,
            dstW, dstH,
            0, dstH
        ]);

        let M = cv.getPerspectiveTransform(srcTri, dstTri);
        let dsize = new cv.Size(dstW, dstH);
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        dom.progressBar.style.width = '50%';
        dom.progressText.textContent = 'マス目の切り出し中...';

        // 30マスに切り出してDataURLにする
        currentCells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                let rect = new cv.Rect(col * cellW, row * cellH, cellW, cellH);
                let cellMat = dst.roi(rect);
                // Canvasを介してDataURL化
                let tempCanvas = document.createElement('canvas');
                cv.imshow(tempCanvas, cellMat);
                currentCells.push(tempCanvas.toDataURL('image/jpeg', 0.8));
                cellMat.delete();
            }
        }

        src.delete(); dst.delete(); M.delete(); srcTri.delete(); dstTri.delete();

        dom.progressBar.style.width = '80%';
        dom.progressText.textContent = '辞書からシールを検出中...';

        setTimeout(() => performTemplateMatching(), 100);
    } catch (err) {
        console.error(err);
        alert('解析中にエラーが発生しました。');
        dom.analyzeBtn.disabled = false;
        dom.progressSection.classList.remove('visible');
    }
}

function performTemplateMatching() {
    // 辞書に登録があるか確認
    const registeredScores = Object.keys(templates);
    const hasTemplates = registeredScores.length > 0;

    if (!hasTemplates) {
        dom.unregisteredWarning.classList.remove('hidden');
        dom.detectedScoreDiv.innerHTML = '';
        dom.confirmAddBtn.disabled = true;
    } else {
        dom.unregisteredWarning.classList.add('hidden');
        dom.confirmAddBtn.disabled = false;
    }

    currentDetectedResults = [];
    dom.matrixGrid.innerHTML = '';

    // 非同期でテンプレート画像を読み込むためのPromise配列
    const templateImages = {};
    const loadPromises = registeredScores.map(score => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => { templateImages[score] = img; resolve(); };
            img.src = templates[score];
        });
    });

    const isCellRed = (cellImg) => {
        // 簡単な色判定。赤色成分が多ければシールとみなす処理（OpenCVなしの単純なHTML Canvas走査）
        let c = document.createElement('canvas');
        c.width = 100; c.height = 100;
        let ctx = c.getContext('2d');
        ctx.drawImage(cellImg, 0, 0);
        let data = ctx.getImageData(0, 0, 100, 100).data;
        let redPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i + 1], b = data[i + 2];
            // 赤の条件
            if (r > 150 && g < 120 && b < 120) redPixels++;
        }
        // ピクセルの10%以上が赤ならシールと判定
        return (redPixels / (100 * 100)) > 0.05;
    };

    Promise.all(loadPromises).then(() => {
        let totalScore = 0;
        let scoreCounts = {};

        // 30のセルを処理
        let processedCount = 0;

        currentCells.forEach((cellDataUrl, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'matrix-cell';
            const img = new Image();
            img.src = cellDataUrl;

            const overlay = document.createElement('div');
            overlay.className = 'matrix-cell-overlay';

            cellDiv.appendChild(img);
            cellDiv.appendChild(overlay);
            dom.matrixGrid.appendChild(cellDiv);

            img.onload = () => {
                if (!hasTemplates) {
                    overlay.classList.add('unknown');
                    overlay.textContent = '?';
                } else {
                    // シール（赤い）があるか判定
                    if (!isCellRed(img)) {
                        overlay.classList.add('empty');
                        overlay.textContent = '空';
                    } else {
                        // テンプレートマッチング実行
                        let bestMatch = { score: null, val: -1 };

                        let cellMat = cv.imread(img);

                        for (const score of Object.keys(templateImages)) {
                            let tempMat = cv.imread(templateImages[score]);

                            // グレースケールでマッチング
                            let cellGray = new cv.Mat();
                            let tempGray = new cv.Mat();
                            cv.cvtColor(cellMat, cellGray, cv.COLOR_RGBA2GRAY);
                            cv.cvtColor(tempMat, tempGray, cv.COLOR_RGBA2GRAY);

                            let result = new cv.Mat();
                            // TM_CCOEFF_NORMED: 1に近いほど一致
                            cv.matchTemplate(cellGray, tempGray, result, cv.TM_CCOEFF_NORMED);
                            let minMax = cv.minMaxLoc(result);

                            if (minMax.maxVal > bestMatch.val) {
                                bestMatch = { score: score, val: minMax.maxVal };
                            }

                            cellGray.delete(); tempGray.delete(); result.delete(); tempMat.delete();
                        }

                        cellMat.delete();

                        // 一致度が閾値(0.4)を超えれば採用
                        if (bestMatch.val > 0.4) {
                            overlay.classList.add('identified');
                            overlay.textContent = bestMatch.score;

                            // 結果に追加
                            const val = parseFloat(bestMatch.score);
                            currentDetectedResults.push({ score: val, dataUrl: cellDataUrl });
                            totalScore += val;
                            scoreCounts[val] = (scoreCounts[val] || 0) + 1;
                        } else {
                            overlay.classList.add('unknown');
                            overlay.textContent = '未登録';
                        }
                    }
                }

                processedCount++;
                if (processedCount === 30) {
                    finishMatching(totalScore, scoreCounts, hasTemplates);
                }
            };
        });
    });
}

function finishMatching(totalScore, scoreCounts, hasTemplates) {
    dom.progressBar.style.width = '100%';
    dom.progressSection.classList.remove('visible');
    dom.analyzeBtn.disabled = false;

    if (hasTemplates) {
        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: 700; color: white;">検出: ${currentDetectedResults.length}枚</span>
                <div>
                    <span class="detected-score-value" style="font-size: 2rem;">${Math.round(totalScore * 10) / 10}</span>
                    <span style="color: var(--text-muted);"> 点</span>
                </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
        `;

        Object.keys(scoreCounts).forEach(score => {
            html += `
                <div style="background: rgba(244, 114, 182, 0.15); border: 1px solid rgba(244, 114, 182, 0.3); 
                            border-radius: 8px; padding: 4px 10px; font-size: 0.85rem;">
                    <strong style="color: var(--accent-pink-light);">${score}点</strong>
                    <span style="color: var(--text-muted);"> × ${scoreCounts[score]}</span>
                </div>
            `;
        });
        html += `</div>`;
        dom.detectedScoreDiv.innerHTML = html;
        dom.confirmAddBtn.textContent = `✅ 合計 ${Math.round(totalScore * 10) / 10}点 を履歴に追加する`;
    }
}

// =====================================
// 辞書管理モジュール (Templates)
// =====================================
function renderTemplateList() {
    dom.templateList.innerHTML = '';

    VALID_SCORES.forEach(score => {
        const item = document.createElement('div');
        item.className = 'template-item' + (templates[score] ? ' registered' : '');

        let imgHtml = templates[score] ? `<img src="${templates[score]}">` : `<div style="width: 60px; height: 60px; background: #000; border-radius: 8px; border: 1px dashed var(--text-muted); display:flex; align-items:center; justify-content:center; color: var(--text-muted); font-size:10px;">未登録</div>`;

        let statusHtml = templates[score] ? `<span class="template-status registered">✅ 登録済み</span>` : `<span class="template-status">❌ 未登録</span>`;

        item.innerHTML = `
            ${imgHtml}
            <div class="template-info">
                <div class="template-score">${score} 点シール</div>
                ${statusHtml}
            </div>
            <button class="btn btn-secondary register-btn" style="width: auto; padding: 8px 16px;">
                ${templates[score] ? '再登録' : '登録'}
            </button>
        `;

        item.querySelector('.register-btn').addEventListener('click', () => {
            openTemplateModal(score);
        });

        dom.templateList.appendChild(item);
    });
}

function openTemplateModal(score) {
    if (currentCells.length === 0) {
        alert('まずは「スキャン」タブで台紙の画像を読み込ませ、マトリクスを解析してください！\n解析された30マスの中から参考画像を登録できます。');
        dom.tabScan.click();
        return;
    }

    currentAssigningScore = score;
    dom.modalTargetScore.textContent = score + ' 点';
    dom.modal.classList.remove('hidden');

    dom.modalMatrixGrid.innerHTML = '';
    currentCells.forEach((cellDataUrl, idx) => {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.style.cursor = 'pointer';

        const img = new Image();
        img.src = cellDataUrl;
        cell.appendChild(img);

        // 登録イベント
        cell.addEventListener('click', () => {
            templates[currentAssigningScore] = cellDataUrl;
            saveData();
            closeModal();
            renderTemplateList();
        });

        dom.modalMatrixGrid.appendChild(cell);
    });
}

function closeModal() {
    dom.modal.classList.add('hidden');
    currentAssigningScore = null;
}


// =====================================
// シール管理・履歴・合計 (変更なし)
// =====================================

function addSticker(score, method) {
    stickers.push({
        id: Date.now() + Math.random(),
        score: score,
        method: method,
        timestamp: new Date().toISOString(),
    });
    saveData();
    renderStickerList();
    updateTotal();
}

function removeSticker(id) {
    stickers = stickers.filter(s => s.id !== id);
    saveData();
    renderStickerList();
    updateTotal();
}

function renderStickerList() {
    if (stickers.length === 0) {
        dom.emptyList.style.display = 'block';
        dom.listActions.style.display = 'none';
        dom.stickerCount.textContent = '0枚';
        Array.from(dom.stickerList.querySelectorAll('.sticker-item')).forEach(el => el.remove());
        return;
    }

    dom.emptyList.style.display = 'none';
    dom.listActions.style.display = 'flex';
    dom.stickerCount.textContent = `${stickers.length}枚`;

    Array.from(dom.stickerList.querySelectorAll('.sticker-item')).forEach(el => el.remove());

    const sorted = [...stickers].reverse(); // 新しいもの順
    sorted.forEach((sticker) => {
        const li = document.createElement('li');
        li.className = 'sticker-item';
        li.innerHTML = `
            <div class="sticker-info">
                <span class="sticker-score">${sticker.score} 点</span>
                <span class="sticker-method">${sticker.method}</span>
            </div>
            <button class="btn-icon" onclick="removeSticker(${sticker.id})" title="削除">✕</button>
        `;
        // insert before empty-list text realistically
        dom.stickerList.insertBefore(li, dom.emptyList);
    });
}

function updateTotal() {
    const total = stickers.reduce((sum, s) => sum + s.score, 0);
    const roundedTotal = Math.round(total * 10) / 10;
    dom.totalValue.textContent = roundedTotal;

    const progress = Math.min((roundedTotal / GOAL_POINTS) * 100, 100);
    dom.goalProgressFill.style.width = `${progress}%`;

    if (roundedTotal >= GOAL_POINTS) {
        dom.totalRemaining.textContent = '🎉 目標達成！お皿と交換できます！';
        dom.goalProgressFill.classList.add('complete');
        dom.celebration.classList.add('visible');
        spawnConfetti();
    } else {
        const remaining = Math.round((GOAL_POINTS - roundedTotal) * 10) / 10;
        dom.totalRemaining.textContent = `あと ${remaining} 点でお皿と交換！`;
        dom.goalProgressFill.classList.remove('complete');
        dom.celebration.classList.remove('visible');
    }
}

function spawnConfetti() {
    dom.confettiContainer.innerHTML = '';
    const colors = ['#f472b6', '#fbb6ce', '#fbbf24', '#34d399', '#818cf8', '#fb923c'];
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.textContent = '🌸';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.fontSize = `${Math.random() * 12 + 8}px`;
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
        dom.confettiContainer.appendChild(confetti);
    }
    setTimeout(() => { dom.confettiContainer.innerHTML = ''; }, 5000);
}

// =====================================
// データ永続化（LocalStorage）
// =====================================
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY_STICKERS, JSON.stringify(stickers));
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
}

function loadData() {
    try {
        const s = localStorage.getItem(STORAGE_KEY_STICKERS);
        if (s) stickers = JSON.parse(s);

        const t = localStorage.getItem(STORAGE_KEY_TEMPLATES);
        if (t) templates = JSON.parse(t);
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
}
