let cvReady = false;

// index.html で定義した Module.onRuntimeInitialized から呼ばれる
function onOpenCvReady() {
    if (cvReady) return;
    console.log('onOpenCvReady called');
    cvReady = true;
    const cvStatus = document.getElementById('cv-status');
    if (cvStatus) {
        cvStatus.textContent = 'OpenCV.js 準備完了';
        cvStatus.style.color = '#66ffaa';
    }
}

// ポーリングによるセーフティネット
function pollForCv() {
    if (cvReady) return;
    if (typeof cv !== 'undefined' && cv.Mat) {
        console.log('OpenCV found via polling');
        onOpenCvReady();
    } else {
        setTimeout(pollForCv, 500);
    }
}
pollForCv();

// すでに初期化が完了している（script.jsのロードが後になった）場合のケア
if (window.cvRuntimeReady) {
    onOpenCvReady();
}

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');

const croppedCanvas = document.getElementById('cropped-canvas');
const croppedCtx = croppedCanvas.getContext('2d');

const btnAnalyze = document.getElementById('btn-analyze');
const ocrStatus = document.getElementById('ocr-status');
const ocrResult = document.getElementById('ocr-result');
const cellsGrid = document.getElementById('cells-grid');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.getElementById('progress-bar');

let loadedImage = null;
let cellCanvases = [];

// DOM構築時に81個の小Canvasを作っておく
function initCellsGrid() {
    cellsGrid.innerHTML = '';
    cellCanvases = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cellCanvas = document.createElement('canvas');
            // 解像度は後で設定するが、見た目はCSSで制御
            cellsGrid.appendChild(cellCanvas);
            cellCanvases.push(cellCanvas);
        }
    }
}
initCellsGrid();

// ===== Drag & Drop Logic =====

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleImage(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImage(e.target.files[0]);
    }
});

function handleImage(file) {
    if (!cvReady) {
        alert('OpenCV.js の読み込みを待っています...');
        return;
    }
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            loadedImage = img;

            // オリジナルキャンバスに描画（最大幅でリサイズ）
            const maxW = 1000;
            const maxH = 1000;
            let finalW = img.width;
            let finalH = img.height;

            if (finalW > maxW || finalH > maxH) {
                const ratio = Math.min(maxW / finalW, maxH / finalH);
                finalW = finalW * ratio;
                finalH = finalH * ratio;
            }

            canvas.width = finalW;
            canvas.height = finalH;
            ctx.drawImage(img, 0, 0, finalW, finalH);

            ocrStatus.textContent = '画像がロードされました。解析待ち。';
            ocrResult.textContent = '';
            btnAnalyze.disabled = false;

            // OpenCVで前処理＆クロップを実行
            processImageWithOpenCV();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== OpenCV.js Logic (Phase 2) =====

function processImageWithOpenCV() {
    document.getElementById('cv-status').textContent = '画像解析中 (モルフォロジー演算)...';

    // Canvasから画像をMatとして読み込む
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blur = new cv.Mat();

    // グレースケール化
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // ノイズ除去
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // 1. 適応的2値化（反転）
    // 局所的な明るさの差を拾うため、ダークモードの暗い枠線も白く浮き上がる。
    let thresh = new cv.Mat();
    cv.adaptiveThreshold(blur, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    // 2. モルフォロジー演算によるライン抽出
    let horizontal = thresh.clone();
    let vertical = thresh.clone();

    // 水平ラインの抽出（横長のカーネル）
    let scale = 20; // 盤面サイズの1/20程度の線を拾う
    let horizontalSize = Math.floor(horizontal.cols / scale);
    let horizontalStructure = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(horizontalSize, 1));
    cv.erode(horizontal, horizontal, horizontalStructure);
    cv.dilate(horizontal, horizontal, horizontalStructure);

    // 垂直ラインの抽出（縦長のカーネル）
    let verticalSize = Math.floor(vertical.rows / scale);
    let verticalStructure = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, verticalSize));
    cv.erode(vertical, vertical, verticalStructure);
    cv.dilate(vertical, vertical, verticalStructure);

    // 3. マスクの合成（水平 + 垂直）
    let mask = new cv.Mat();
    cv.add(horizontal, vertical, mask);

    // 4. 輪郭抽出
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxRect = null;

    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let rect = cv.boundingRect(cnt);
        let area = rect.width * rect.height;
        let aspect = rect.width / rect.height;

        // アスペクト比がほぼ1:1かつ十分な面積を持つものを探す
        if (aspect > 0.8 && aspect < 1.2 && area > maxArea) {
            maxArea = area;
            maxRect = rect;
        }
    }

    if (maxRect && maxArea > 10000) {
        document.getElementById('cv-status').textContent = '数独の枠を検出（高精度モード）！';
        document.getElementById('cv-status').style.color = '#66ffaa';

        // 枠線に切り抜く
        let cropped = src.roi(maxRect);

        // プレビューの描画
        cv.imshow('cropped-canvas', cropped);

        // ダークモードかライトモードかの全体判定
        // クロップされた画像（数独全体）の中央付近のピクセルを見て判断する
        // 中央マス（4,4）のさらに中心点
        let centerX = Math.floor(cropped.cols / 2);
        let centerY = Math.floor(cropped.rows / 2);
        // グレースケールで判定するために一時的に変換
        let grayCropped = new cv.Mat();
        cv.cvtColor(cropped, grayCropped, cv.COLOR_RGBA2GRAY, 0);
        let centerIntensity = grayCropped.ucharPtr(centerY, centerX)[0];
        // 背景が暗い（< 128）ならダークモードと判定
        let isDarkMode = centerIntensity < 128;
        grayCropped.delete();

        if (isDarkMode) {
            document.getElementById('cv-status').textContent += ' (ダークモード検出)';
        }

        // 81分割処理
        sliceIntoGrid(cropped, isDarkMode);
        cropped.delete();
    } else {
        document.getElementById('cv-status').textContent = '枠の特定に失敗。全体を解析します。';
        document.getElementById('cv-status').style.color = '#ffcc00';
        cv.imshow('cropped-canvas', src);

        // 全体判定のフォールバック
        let graySrc = new cv.Mat();
        cv.cvtColor(src, graySrc, cv.COLOR_RGBA2GRAY, 0);
        let centerIntensity = graySrc.ucharPtr(Math.floor(src.rows / 2), Math.floor(src.cols / 2))[0];
        let isDarkMode = centerIntensity < 128;
        graySrc.delete();

        sliceIntoGrid(src, isDarkMode);
    }

    // メモリ解放
    src.delete(); gray.delete(); blur.delete(); thresh.delete();
    horizontal.delete(); vertical.delete(); mask.delete();
    horizontalStructure.delete(); verticalStructure.delete();
    contours.delete(); hierarchy.delete();
}

function sliceIntoGrid(cvMat, isDarkMode) {
    const width = cvMat.cols;
    const height = cvMat.rows;

    const cellW = width / 9;
    const cellH = height / 9;

    // 各マスの内側を削る量を調整。ダイナミックな補正を行うため少し余裕を持たせる
    const marginW = cellW * 0.03;
    const marginH = cellH * 0.03;

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let x = Math.floor(c * cellW + marginW);
            let y = Math.floor(r * cellH + marginH);
            let w = Math.floor(cellW - marginW * 2);
            let h = Math.floor(cellH - marginH * 2);

            let rect = new cv.Rect(x, y, w, h);
            let cellMat = cvMat.roi(rect);

            // セルの動的な前処理（境界除去・中央寄せ）
            let result = preprocessCell(cellMat, isDarkMode);

            const cellCanvas = cellCanvases[r * 9 + c];
            cv.imshow(cellCanvas, result.mat);

            // 後でOCR判定時に「このマスには文字があるはず」と分かるようにマークしておく
            cellCanvas.dataset.hasDigit = result.hasDigit ? 'true' : 'false';

            cellMat.delete();
            result.mat.delete();
        }
    }
}

/**
 * セル内の数字を孤立化させ、中央に配置する前処理
 * @param {cv.Mat} cellMat 
 * @param {boolean} isDarkMode 画像全体がダークモードかどうか
 * @returns {{mat: cv.Mat, hasDigit: boolean}} 白背景に黒文字で中央寄せされたMatと、文字が存在するかのフラグ
 */
function preprocessCell(cellMat, isDarkMode) {
    let gray = new cv.Mat();
    cv.cvtColor(cellMat, gray, cv.COLOR_RGBA2GRAY, 0);

    // 適応的2値化（反転：文字を白=255、背景を黒=0にする）
    // 初期状態のクリーンな盤面（ハイライトやメモがない状態）を前提とするため、
    // 背景と文字の2極ヒストグラムに最適な大津の2値化を使用。
    let thresh = new cv.Mat();
    if (isDarkMode) {
        // ダークモードの場合、元画像の白文字が明るい。Otsuで文字が白(255)、背景が黒(0)になるよう閾値決め
        cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
    } else {
        // ライトモードの場合、元画像の黒文字が暗い。反転して文字が白(255)、背景が黒(0)になるよう閾値決め
        cv.threshold(gray, thresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
    }

    // 境界除去: 外枠に触れているピクセルを消去
    // 連結成分（Connected Components）を抽出
    let labels = new cv.Mat();
    let stats = new cv.Mat();
    let centroids = new cv.Mat();
    let nLabels = cv.connectedComponentsWithStats(thresh, labels, stats, centroids);

    let maxArea = 0;
    let bestRect = null;

    // 背景(label 0)を除外してループ
    for (let i = 1; i < nLabels; i++) {
        let left = stats.intAt(i, cv.CC_STAT_LEFT);
        let top = stats.intAt(i, cv.CC_STAT_TOP);
        let width = stats.intAt(i, cv.CC_STAT_WIDTH);
        let height = stats.intAt(i, cv.CC_STAT_HEIGHT);
        let area = stats.intAt(i, cv.CC_STAT_AREA);

        // 境界に触れているか判定（1px余裕を持たせる）
        let isTouchingBorder = (left <= 1 || top <= 1 || (left + width) >= thresh.cols - 1 || (top + height) >= thresh.rows - 1);

        if (!isTouchingBorder) {
            // 最も大きい「浮いている」塊を数字とみなす
            if (area > maxArea) {
                maxArea = area;
                bestRect = new cv.Rect(left, top, width, height);
            }
        }
    }

    // 出力用のキャンバス（白背景）を作成
    let output = new cv.Mat.ones(thresh.rows, thresh.cols, cv.CV_8UC1);
    output.setTo(new cv.Scalar(255)); // 白で埋める

    let hasDigit = false;

    // 数字が見つかった場合、中央に配置（面積0.5%以上。ノイズ除去）
    if (bestRect && maxArea > (thresh.rows * thresh.cols * 0.005)) {
        hasDigit = true; // 確実な塊が存在する

        // otsuによって背景ノイズは消え、数字だけがくっきりと残っている。
        // threshは「文字が白(255)、背景が黒(0)」の状態。
        let digitROI = thresh.roi(bestRect);

        // 配置先の座標計算（中央）
        let targetX = Math.floor((output.cols - bestRect.width) / 2);
        let targetY = Math.floor((output.rows - bestRect.height) / 2);
        let targetRect = new cv.Rect(targetX, targetY, bestRect.width, bestRect.height);

        let processedDigit = new cv.Mat();

        // 出力はTesseract.jsが最も読みやすい「白背景(255)に黒文字(0)」に統一するため、反転させる
        cv.bitwise_not(digitROI, processedDigit);

        // 白背景に出力
        processedDigit.copyTo(output.roi(targetRect));

        processedDigit.delete();
        digitROI.delete();
    }

    // メモリ解放
    gray.delete(); thresh.delete(); labels.delete(); stats.delete(); centroids.delete();

    return { mat: output, hasDigit: hasDigit };
}

// ===== Interactive OCR Error Correction Modal Logic =====
function showModalPrompt(canvas) {
    return new Promise((resolve) => {
        const modal = document.getElementById('ocr-correction-modal');
        const img = document.getElementById('modal-cell-image');
        const input = document.getElementById('modal-digit-input');
        const btnSubmit = document.getElementById('modal-btn-submit');
        const btnSkip = document.getElementById('modal-btn-skip');

        // キャンバスの画像をimgタグに転写
        img.src = canvas.toDataURL('image/png');
        input.value = ''; // リセット

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
                // 入力が不正な場合はハイライトなどで知らせる（今回は簡易的に弾くのみ）
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

// ===== Tesseract.js Individual Cell OCR Logic =====

btnAnalyze.addEventListener('click', async () => {
    btnAnalyze.disabled = true;
    ocrStatus.style.color = '#ffcc00';
    ocrStatus.textContent = 'Tesseract.js OCRエンジンをロード中...';
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    ocrResult.textContent = '解析開始...';

    const gridResult = [];
    const manualCorrectionCache = []; // { mat: cv.Mat, digit: number } の配列を保持して、記憶機能を実装

    try {
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR // 1文字モード
        });

        ocrStatus.textContent = '81マスを個別に解析中...';

        for (let i = 0; i < 81; i++) {
            const canvas = cellCanvases[i];
            const definitelyHasDigit = canvas.dataset.hasDigit === 'true';

            // ピクセルデータを取得して空白マス（0）を早めに判定する簡易ロジック
            // OpenCVで完全に2値化してから判定するのが理想だが、今回はTesseractの文字認識結果に頼るアプローチも並行

            const ret = await worker.recognize(canvas);
            const text = ret.data.text.trim();

            // 数字が検出できなければ 0、あればその数字
            let num = text.length > 0 && !isNaN(parseInt(text)) ? parseInt(text) : 0;

            // ヒューマン・イン・ザ・ループ（UI対話的エラー修正 ＋ 「記憶」機能）
            if (definitelyHasDigit && num === 0) {
                // セルをハイライト
                canvas.style.border = '3px solid #ff0000';

                // 1. まず過去のキャッシュ（記憶）から似た画像を探す
                let matchedNumber = null;
                if (manualCorrectionCache.length > 0) {
                    // 現在のキャンバスを OpenCV Mat に変換
                    let currentMat = cv.imread(canvas);
                    cv.cvtColor(currentMat, currentMat, cv.COLOR_RGBA2GRAY, 0);

                    for (const cache of manualCorrectionCache) {
                        let result = new cv.Mat();
                        // テンプレートマッチング実行
                        cv.matchTemplate(currentMat, cache.mat, result, cv.TM_CCOEFF_NORMED);
                        let minMax = cv.minMaxLoc(result);

                        // 類似度が95%を超えていれば「同じ文字」とみなす
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
                    // キャッシュと一致した場合は、人間に聞かずに自動入力
                    num = matchedNumber;
                } else {
                    // 2. キャッシュにない場合は人間に聞く（モーダル表示）
                    num = await showModalPrompt(canvas);

                    // 3. ユーザーが入力した数字（スキップの0以外）を画像と共にキャッシュに保存
                    if (num !== 0) {
                        let cacheMat = cv.imread(canvas);
                        cv.cvtColor(cacheMat, cacheMat, cv.COLOR_RGBA2GRAY, 0);
                        manualCorrectionCache.push({ mat: cacheMat, digit: num });
                    }
                }

                // ハイライト解除
                canvas.style.border = '1px solid #444';
            }

            gridResult.push(num);

            // UIアップデート
            progressFill.style.width = `${Math.round(((i + 1) / 81) * 100)}%`;

            // コンソール出力
            if (i % 9 === 8) {
                console.log(gridResult.slice(i - 8, i + 1));
            }
        }

        ocrStatus.style.color = '#66ffaa';
        ocrStatus.textContent = `解析完了！`;

        // 配列を見やすくフォーマットして出力
        let outputText = '[\n';
        for (let r = 0; r < 9; r++) {
            outputText += '  [' + gridResult.slice(r * 9, r * 9 + 9).join(', ') + '],\n';
        }
        outputText += ']';

        ocrResult.textContent = outputText;

        await worker.terminate();

    } catch (error) {
        console.error("OCR Error:", error);
        ocrStatus.style.color = '#ff6b6b';
        ocrStatus.textContent = 'エラーが発生しました';
        ocrResult.textContent = error.message;
    } finally {
        btnAnalyze.disabled = false;
    }
});
